import { apiClient, walletService, type PermitMessage } from "./api"
import { parseEther, type Address } from "viem"

// Resolve the payment token for the current chain using backend system info
async function getPaymentTokenForCurrentChain(): Promise<Address | null> {
  try {
    const systemInfo = await apiClient.getSystemInfo()
    const chainId = await walletService.getChainId()
    const chainIdHex = `0x${chainId.toString(16)}`.toLowerCase()

    let paymentToken = (systemInfo?.paymentToken || "") as Address

    if (Array.isArray(systemInfo?.chains)) {
      const match = (
        systemInfo!.chains as Array<{
          id: string
          token: string
          label: string
          rpcUrl: string
        }>
      ).find((c) => c.id.toLowerCase() === chainIdHex)
      if (match?.token) paymentToken = match.token as Address
    } else if (systemInfo?.paymentTokens) {
      const byDec = systemInfo.paymentTokens[String(chainId)]
      const byHex = systemInfo.paymentTokens[chainIdHex]
      const byHexNo0x = systemInfo.paymentTokens[chainId.toString(16).toLowerCase()]
      paymentToken = (byDec || byHex || byHexNo0x || paymentToken) as Address
    }

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

  // Create a permit unconditionally whenever a payment token is available
  let permit: PermitMessage | undefined
  let permitSignature: string | undefined
  if (paymentToken) {
    const deadline = Math.floor(Date.now() / 1000) + 3600 // 1 hour
    try {
      const permitResult = await walletService.createPermitSignature(
        paymentToken,
        openaiAddr,
        parseEther(calls.toString()),
        deadline
      )
      permit = permitResult.permit
      permitSignature = permitResult.signature
      console.log("permitResult", permitResult)
    } catch (err) {
      console.error("Failed to create permit signature:", err)
    }
  }

  const registerResponse = await apiClient.register({
    payload,
    signature,
    address: walletAddr,
    ...(permit && permitSignature ? { permit, permitSignature } : {}),
  })

  return { token: registerResponse.token, paymentToken: paymentToken ?? undefined }
}
