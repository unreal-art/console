import { apiClient, walletService, type PermitMessage } from "./api"
import { Chain, parseEther, type Address } from "viem"

/**
 * Resolves the appropriate payment token address for the current chain.
 *
 * Prioritization order:
 * 1. First tries to find the token from matching chain in systemInfo.chains array
 * 2. Then checks the paymentTokens map using chainId as the key
 * 3. Falls back to the default paymentToken if available
 *
 * This ensures that each blockchain network uses its appropriate token address.
 */
async function getPaymentTokenForCurrentChain(): Promise<Address | null> {
  try {
    const systemInfo = await apiClient.getSystemInfo()
    console.log("systemInfo", systemInfo)
    const chainId = await walletService.getChainId()

    // First try to get the token from chains array by matching chainId
    if (systemInfo?.chains && Array.isArray(systemInfo.chains)) {
      // Convert chainId to string for comparison
      const chainIdStr = chainId.toString()

      // Find the chain that matches our current chainId
      const matchingChain = systemInfo.chains.find(chain => chain.id === chainIdStr)

      // If we found a matching chain, use its token address
      if (matchingChain && matchingChain.token) {
        console.debug(`[Registration] Found token ${matchingChain.token} for chain ${chainIdStr}`)
        return matchingChain.token as Address
      }
    }

    // Fallback: check if we have a paymentTokens map with chainId as key
    if (systemInfo?.paymentTokens && typeof systemInfo.paymentTokens === 'object') {
      const chainIdStr = chainId.toString()
      if (systemInfo.paymentTokens[chainIdStr]) {
        console.debug(`[Registration] Found token ${systemInfo.paymentTokens[chainIdStr]} for chain ${chainIdStr} in paymentTokens map`)
        return systemInfo.paymentTokens[chainIdStr] as Address
      }
    }

    // Last resort: use the default paymentToken if available
    if (systemInfo?.paymentToken) {
      console.debug(`[Registration] Using default paymentToken ${systemInfo.paymentToken}`)
      return systemInfo.paymentToken as Address
    }

    console.warn(`[Registration] No payment token found for chain ${chainId}`)
    return null
  } catch (e) {
    console.error("Failed to resolve payment token:", e)
    return null
  }
}

export interface RegistrationResult {
  token: string
  paymentToken?: Address
}

/**
 * Performs the full registration flow: builds payload, signs, creates permit, and registers
 *
 * Important behavior:
 * - Always creates a permit signature when paymentToken is provided and calls > 0
 * - Does not depend on checking allowance first (to handle case where allowance check fails)
 * - Throws an error if permit creation fails, as it's critical for registration
 */
export async function performRegistration(
  calls: number,
  walletAddr: string,
  openaiAddr: string
): Promise<RegistrationResult> {
  const EXPIRY_SECONDS = 3600 // 1 hour

  const paymentToken = await getPaymentTokenForCurrentChain()

  console.log("Payment Token", paymentToken)

  const currentTime = Math.floor(Date.now() / 1000)
  const payload = {
    iss: walletAddr,
    iat: currentTime,
    sub: openaiAddr,
    exp: currentTime + EXPIRY_SECONDS,
    calls,
    // Include the token if available; backend can tolerate undefined/missing if not
    ...(paymentToken ? { paymentToken } : {}),
  }

  // Sign the payload with the connected wallet
  const message = JSON.stringify(payload)
  const signature = await walletService.signMessage(message)

  // Check allowance and create permit only if needed
  let permit: PermitMessage | undefined
  let permitSignature: string | undefined

  console.log({ paymentToken, calls })
  if (paymentToken && calls > 0) {
    try {
      // Check current allowance for the paymaster (spender = openaiAddr)
      const requiredAmount = parseEther(calls.toString())

      // Always create a permit for registration regardless of current allowance
      // This ensures the registration will work even if the allowance check fails
      console.debug(
        "[Registration] Creating permit signature for token approval"
      )
      const deadline = Math.floor(Date.now() / 1000) + 3600 // 1 hour
      const permitResult = await walletService.createPermitSignature(
        paymentToken,
        openaiAddr,
        requiredAmount,
        deadline
      )
      permit = permitResult.permit
      permitSignature = permitResult.signature
      console.debug("[Registration] Permit created:", permitResult)

      // Still perform the allowance check for logging purposes
      try {
        const currentAllowance = await walletService.checkAllowance(
          paymentToken,
          walletAddr,
          openaiAddr // paymaster address
        )

        console.debug("[Registration] Allowance check:", {
          paymentToken,
          owner: walletAddr,
          spender: openaiAddr,
          requiredAmount: requiredAmount.toString(),
          currentAllowance: currentAllowance.toString(),
        })
      } catch (allowanceErr) {
        console.warn("Failed to check allowance (non-critical):", allowanceErr)
        // Continue with the permit we already created
      }
    } catch (err) {
      console.error("Failed to create permit:", err)
      throw new Error(`Failed to create permit for token approval: ${err.message || String(err)}`)
    }
  } else {
    console.debug("skipping permit")
  }

  const registerResponse = await apiClient.register({
    payload,
    signature,
    address: walletAddr,
    ...(permit && permitSignature ? { permit, permitSignature } : {}),
  })

  return {
    token: registerResponse.token,
    paymentToken: paymentToken ?? undefined,
  }
}
