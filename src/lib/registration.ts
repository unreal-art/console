import { apiClient, walletService, type PermitMessage } from "./api"
import { Chain, parseEther, type Address } from "viem"

// Resolve the payment token for the current chain using backend system info
async function getPaymentTokenForCurrentChain(): Promise<Address | null> {
  try {
    const systemInfo = await apiClient.getSystemInfo()

    console.log("systemInfo", systemInfo)
    const chainId = await walletService.getChainId()

    const chainIn = systemInfo!.chains[chainId]

    const paymentToken = chainIn?.custom.tokens.UnrealToken.address
    return paymentToken || null
  } catch (e) {
    console.error("Failed to resolve payment token:", e)
    return null
  }
}

export interface RegistrationResult {
  token: string
  paymentToken?: Address
}

// Perform the full registration flow: build payload, sign, create permit, register
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
        needsPermit: currentAllowance < requiredAmount,
      })

      // Only create permit if allowance is insufficient
      if (currentAllowance < requiredAmount) {
        console.debug(
          "[Registration] Insufficient allowance, creating permit signature"
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
      } else {
        console.debug("[Registration] Sufficient allowance, no permit needed")
      }
    } catch (err) {
      console.error("Failed to check allowance or create permit:", err)
      // Continue without permit - let backend handle the error
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
