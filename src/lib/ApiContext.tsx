import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
  ReactNode,
} from "react"
import {
  apiClient,
  walletService,
  VerifyResponse,
  ApiKeyResponse,
  ApiKey,
  ApiKeyListResponse,
} from "./api"
import { getErc20Balance } from "@/utils/web3/unreal"
import { initOnboard, type OnboardChain } from "@/lib/onboard"
import { formatEther, parseEther, type Address } from "viem"

interface ApiContextType {
  isAuthenticated: boolean
  isLoading: boolean
  walletAddress: string | null
  availableAddresses: string[]
  openaiAddress: string | null
  token: string | null
  verifyData: VerifyResponse | null
  apiKey: string | null
  apiKeyHash: string | null
  apiKeys: ApiKey[]
  isLoadingApiKeys: boolean
  error: string | null
  connectWallet: (selectedAddress?: string) => Promise<string>
  getAvailableAddresses: () => Promise<string[]>
  registerWithWallet: (calls: number) => Promise<string>
  verifyToken: () => Promise<VerifyResponse>
  createApiKey: (name: string) => Promise<ApiKeyResponse>
  listApiKeys: () => Promise<ApiKey[]>
  deleteApiKey: (hash: string) => Promise<boolean>
  logout: () => Promise<void>
  registerWalletDisconnector: (
    fn: (() => Promise<void> | void) | null
  ) => void
  clearApiKey: () => void
  clearError: () => void
}

const ApiContext = createContext<ApiContextType | undefined>(undefined)

export const ApiProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [availableAddresses, setAvailableAddresses] = useState<string[]>([])
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [openaiAddress, setOpenaiAddress] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [verifyData, setVerifyData] = useState<VerifyResponse | null>(null)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [apiKeyHash, setApiKeyHash] = useState<string | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isLoadingApiKeys, setIsLoadingApiKeys] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // External wallet disconnector (e.g., thirdweb)
  const walletDisconnectRef = useRef<(() => Promise<void> | void) | null>(null)

  // Allow UI layer (e.g., thirdweb hooks) to register a disconnector we can call on logout
  const registerWalletDisconnector = (
    fn: (() => Promise<void> | void) | null
  ) => {
    walletDisconnectRef.current = fn
  }

  // Prevent auto-reconnect after a deliberate logout
  const SIGNED_OUT_KEY = "unreal_signed_out"

  // Initialize state from localStorage and handle auto-registration
  useEffect(() => {
    // Initialize web3-onboard chains from backend system info if available
    ;(async () => {
      try {
        const si = await apiClient.getSystemInfo()
        const chainsRaw = si?.chains
        if (Array.isArray(chainsRaw) && chainsRaw.length > 0) {
          const chains: OnboardChain[] = chainsRaw.map((c) => {
            const idHex = c.id.startsWith("0x")
              ? c.id.toLowerCase()
              : `0x${parseInt(c.id, 10).toString(16)}`
            return { id: idHex, token: c.token, label: c.label, rpcUrl: c.rpcUrl }
          })
          initOnboard(chains)
        }
      } catch (e) {
        console.warn("Failed to init chains from system info", e)
      }
    })()
    const storedToken = localStorage.getItem("unreal_token")
    const storedWalletAddress = localStorage.getItem("unreal_wallet_address")
    const storedOpenaiAddress = localStorage.getItem("unreal_openai_address")
    const signedOut = localStorage.getItem(SIGNED_OUT_KEY) === "1"

    if (storedToken) {
      setToken(storedToken)
      apiClient.setToken(storedToken)
      setIsAuthenticated(true)
    }

    if (storedWalletAddress && !signedOut) {
      setWalletAddress(storedWalletAddress)
    }

    if (storedOpenaiAddress && !signedOut) {
      setOpenaiAddress(storedOpenaiAddress)
    }

    // Check if wallet is already connected and handle auto-registration
    const checkWalletConnection = async () => {
      try {
        const isConnected = await walletService.isConnected()
        if (isConnected) {
          const address = await walletService.getAddress()
          if (address) {
            setWalletAddress(address)
            localStorage.setItem("unreal_wallet_address", address)

            // If we have a wallet address but no token, try to get the OpenAI address
            if (!storedToken && !storedOpenaiAddress) {
              try {
                const authAddressResponse = await apiClient.getAuthAddress()
                setOpenaiAddress(authAddressResponse.address)
                localStorage.setItem(
                  "unreal_openai_address",
                  authAddressResponse.address
                )

                try {
                  // Get system info and chain-aware token address
                  const systemInfo = await apiClient.getSystemInfo()
                  const chainId = await walletService.getChainId()
                  const chainIdHex = `0x${chainId.toString(16)}`.toLowerCase()

                  let paymentToken = (systemInfo?.paymentToken || "") as Address
                  if (Array.isArray(systemInfo?.chains)) {
                    const match = (systemInfo!.chains as Array<{
                      id: string
                      token: string
                      label: string
                      rpcUrl: string
                    }>).find((c) => c.id.toLowerCase() === chainIdHex)
                    if (match?.token) paymentToken = match.token as Address
                  } else if (systemInfo?.paymentTokens) {
                    const byDec = systemInfo.paymentTokens[String(chainId)]
                    const byHex = systemInfo.paymentTokens[chainIdHex]
                    const byHexNo0x = systemInfo.paymentTokens[chainId
                      .toString(16)
                      .toLowerCase()]
                    paymentToken = (byDec || byHex || byHexNo0x || paymentToken) as Address
                  }

                  if (!paymentToken) {
                    console.error("Payment token not available from system info")
                    // Fallback to zero calls if token address not available
                    await autoRegisterWithWallet(
                      address,
                      authAddressResponse.address,
                      0
                    )
                    return
                  }

                  // Get actual token balance via dynamic public client
                  let calls = 0
                  try {
                    const walletAddr = address as `0x${string}`
                    const client = walletService.getPublicClient()
                    const balance = await getErc20Balance(
                      client,
                      paymentToken,
                      walletAddr
                    )
                    const balanceInEther = formatEther(balance)
                    calls = parseInt(balanceInEther)
                    console.log(
                      `Token balance: ${balanceInEther} (${calls} calls)`
                    )
                  } catch (balanceError) {
                    console.error("Unable to get balance:", balanceError)
                    // Continue with zero calls if balance check fails
                  }

                  // Store values in localStorage
                  localStorage.setItem("unreal_calls_value", calls.toString())
                  localStorage.setItem("unreal_payment_token", paymentToken)

                  // Auto-register with the wallet
                  await autoRegisterWithWallet(
                    address,
                    authAddressResponse.address,
                    calls
                  )
                } catch (systemError) {
                  console.error("Error fetching system info:", systemError)
                  // Fallback to zero calls if system info fetch fails
                  await autoRegisterWithWallet(
                    address,
                    authAddressResponse.address,
                    0
                  )
                }
              } catch (innerError) {
                console.error("Error in auto-registration process:", innerError)
              }
            }
          }
        }
      } catch (error: unknown) {
        console.error("Error checking wallet connection:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (!signedOut) {
      checkWalletConnection()
    } else {
      setIsLoading(false)
    }
  }, [])

  // Helper function for auto-registration
  const autoRegisterWithWallet = async (
    walletAddr: string,
    openaiAddr: string,
    calls: number
  ): Promise<string | null> => {
    try {
      // Resolve payment token per current chain from system info
      const systemInfo = await apiClient.getSystemInfo()
      const chainId = await walletService.getChainId()
      const chainIdHex = `0x${chainId.toString(16)}`.toLowerCase()
      let PAYMENT_TOKEN = (systemInfo?.paymentToken || "") as Address
      if (Array.isArray(systemInfo?.chains)) {
        const match = (systemInfo!.chains as Array<{
          id: string
          token: string
          label: string
          rpcUrl: string
        }>).find((c) => c.id.toLowerCase() === chainIdHex)
        if (match?.token) PAYMENT_TOKEN = match.token as Address
      } else if (systemInfo?.paymentTokens) {
        const byDec = systemInfo.paymentTokens[String(chainId)]
        const byHex = systemInfo.paymentTokens[chainIdHex]
        const byHexNo0x = systemInfo.paymentTokens[chainId
          .toString(16)
          .toLowerCase()]
        PAYMENT_TOKEN = (byDec || byHex || byHexNo0x || PAYMENT_TOKEN) as Address
      }

      if (!PAYMENT_TOKEN) {
        console.error("Payment token not found; cannot register with calls")
      }
      const EXPIRY_SECONDS = 3600 // 1 hour

      // Prepare payload with current timestamps
      const currentTime = Math.floor(Date.now() / 1000)
      const payload = {
        iss: walletAddr,
        iat: currentTime,
        sub: openaiAddr,
        exp: currentTime + EXPIRY_SECONDS,
        calls: calls,
        paymentToken: PAYMENT_TOKEN,
      }

      // Sign the payload
      const message = JSON.stringify(payload)
      const signature = await walletService.signMessage(message)

      // Generate permit if calls > 0
      let permit
      let permitSignature
      if (calls > 0 && PAYMENT_TOKEN) {
        const deadline = Math.floor(Date.now() / 1000) + 3600 // 1h
        try {
          const permitResult = await walletService.createPermitSignature(
            PAYMENT_TOKEN,
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

      // Register with API
      const registerResponse = await apiClient.register({
        payload,
        signature,
        address: walletAddr,
        ...(permit && permitSignature ? { permit, permitSignature } : {}),
      })

      // Set token
      setToken(registerResponse.token)
      localStorage.setItem("unreal_token", registerResponse.token)
      apiClient.setToken(registerResponse.token)
      setIsAuthenticated(true)

      return registerResponse.token
    } catch (error: unknown) {
      console.error("Auto-registration failed:", error)
      return null
    }
  }

  // Get available wallet addresses
  const getAvailableAddresses = async (): Promise<string[]> => {
    setIsLoading(true)
    setError(null)

    try {
      const addresses = await walletService.getAvailableAddresses()
      setAvailableAddresses(addresses)
      return addresses
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to get wallet addresses"
      setError(message)
      throw error as Error
    } finally {
      setIsLoading(false)
    }
  }

  // Connect wallet
  const connectWallet = async (selectedAddress?: string): Promise<string> => {
    setIsLoading(true)
    setError(null)

    try {
      // Get available addresses first if not already fetched
      if (availableAddresses.length === 0) {
        await getAvailableAddresses()
      }
      
      // Connect wallet with selected address
      const address = await walletService.connect(selectedAddress)
      
      // Ensure we're using the selected address if provided
      const finalAddress = selectedAddress || address
      setWalletAddress(finalAddress)
      localStorage.setItem("unreal_wallet_address", finalAddress)
      // Clear signed-out flag upon a successful manual connect
      localStorage.removeItem(SIGNED_OUT_KEY)

      // Get OpenAI address
      const authAddressResponse = await apiClient.getAuthAddress()
      setOpenaiAddress(authAddressResponse.address)
      localStorage.setItem("unreal_openai_address", authAddressResponse.address)

      return finalAddress
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to connect wallet"
      setError(message)
      throw error as Error
    } finally {
      setIsLoading(false)
    }
  }

  // Register with wallet
  const registerWithWallet = async (calls: number): Promise<string> => {
    setIsLoading(true)
    setError(null)

    if (!walletAddress || !openaiAddress) {
      setError("Wallet not connected")
      setIsLoading(false)
      throw new Error("Wallet not connected")
    }

    try {
      // Resolve payment token per current chain
      const systemInfo = await apiClient.getSystemInfo()
      const chainId = await walletService.getChainId()
      const chainIdHex = `0x${chainId.toString(16)}`.toLowerCase()
      let PAYMENT_TOKEN = (systemInfo?.paymentToken || "") as Address
      if (Array.isArray(systemInfo?.chains)) {
        const match = (systemInfo!.chains as Array<{
          id: string
          token: string
          label: string
          rpcUrl: string
        }>).find((c) => c.id.toLowerCase() === chainIdHex)
        if (match?.token) PAYMENT_TOKEN = match.token as Address
      } else if (systemInfo?.paymentTokens) {
        const byDec = systemInfo.paymentTokens[String(chainId)]
        const byHex = systemInfo.paymentTokens[chainIdHex]
        const byHexNo0x = systemInfo.paymentTokens[chainId
          .toString(16)
          .toLowerCase()]
        PAYMENT_TOKEN = (byDec || byHex || byHexNo0x || PAYMENT_TOKEN) as Address
      }
      const EXPIRY_SECONDS = 3600 // 1 hour

      // Store the calls value in localStorage
      localStorage.setItem("unreal_calls_value", calls.toString())

      // Prepare payload with current timestamps
      const currentTime = Math.floor(Date.now() / 1000)
      const payload = {
        iss: walletAddress,
        iat: currentTime,
        sub: openaiAddress,
        exp: currentTime + EXPIRY_SECONDS,
        calls: calls,
        paymentToken: PAYMENT_TOKEN,
      }

      // Sign the payload
      const message = JSON.stringify(payload)
      const signature = await walletService.signMessage(message)

      // Generate permit if calls > 0
      let permit
      let permitSignature
      if (calls > 0 && PAYMENT_TOKEN) {
        const deadline = Math.floor(Date.now() / 1000) + 3600
        try {
          const permitResult = await walletService.createPermitSignature(
            PAYMENT_TOKEN,
            openaiAddress,
            parseEther(calls.toString()),
            deadline
          )
          permit = permitResult.permit
          permitSignature = permitResult.signature
        } catch (err) {
          console.error("Failed to create permit signature:", err)
        }
      }

      // Register with API
      const registerResponse = await apiClient.register({
        payload,
        signature,
        address: walletAddress,
        ...(permit && permitSignature ? { permit, permitSignature } : {}),
      })

      // Set token
      setToken(registerResponse.token)
      localStorage.setItem("unreal_token", registerResponse.token)
      apiClient.setToken(registerResponse.token)
      setIsAuthenticated(true)

      return registerResponse.token
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to register"
      setError(message)
      throw error as Error
    } finally {
      setIsLoading(false)
    }
  }

  // Verify token
  const verifyToken = async (): Promise<VerifyResponse> => {
    setIsLoading(true)
    setError(null)

    if (!token) {
      setError("No token available")
      setIsLoading(false)
      throw new Error("No token available")
    }

    try {
      const response = await apiClient.verifyToken(token)
      setVerifyData(response)
      return response
    } catch (error: unknown) {
      // Check if the error is a 404 (token expired or invalid)
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as { response?: { status?: number } }).response?.status === 404
      ) {
        console.log("Token expired or invalid, clearing authentication state")
        // Clear token and reset authentication state
        setIsAuthenticated(false)
        setToken(null)
        setVerifyData(null)
        apiClient.clearToken()
        localStorage.removeItem("unreal_token")
        setError("Token expired. Please reconnect your wallet.")
      } else {
        const message =
          error instanceof Error ? error.message : "Failed to verify token"
        setError(message)
      }
      throw error as Error
    } finally {
      setIsLoading(false)
    }
  }

  // Create API key
  const createApiKey = async (name: string): Promise<ApiKeyResponse> => {
    setIsLoading(true)
    setError(null)

    if (!isAuthenticated) {
      setError("Not authenticated")
      setIsLoading(false)
      throw new Error("Not authenticated")
    }

    try {
      const response = await apiClient.createApiKey(name)
      setApiKey(response.key)
      setApiKeyHash(response.hash)

      // Refresh the API keys list after creating a new key
      await listApiKeys()

      return response
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create API key"
      setError(message)
      throw error as Error
    } finally {
      setIsLoading(false)
    }
  }

  // List all API keys
  const listApiKeys = async (): Promise<ApiKey[]> => {
    setIsLoadingApiKeys(true)
    setError(null)
    try {
      const response = await apiClient.listApiKeys()
      const rawKeys = (response as { keys: Array<ApiKey | string> | unknown }).keys as Array<ApiKey | string> | undefined
      const normalized: ApiKey[] = Array.isArray(rawKeys)
        ? rawKeys
            .map((k: ApiKey | string): ApiKey => {
              if (typeof k === "string") {
                // Backend returns only a list of key names
                return { name: k }
              }
              if (typeof k === "object" && k !== null) {
                const name = typeof (k as { name?: unknown }).name === "string" ? ((k as { name?: unknown }).name as string) : ""
                const hash = typeof (k as { hash?: unknown }).hash === "string" ? ((k as { hash?: unknown }).hash as string) : undefined
                const created_at =
                  typeof (k as { created_at?: unknown }).created_at === "string"
                    ? (((k as { created_at?: unknown }).created_at as string))
                    : typeof (k as { createdAt?: unknown }).createdAt === "string"
                    ? (((k as { createdAt?: unknown }).createdAt as string))
                    : undefined
                return { name, hash, created_at }
              }
              return { name: "" }
            })
            .filter((k) => k.name && k.name.length > 0)
        : []
      setApiKeys(normalized)
      return normalized
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to list API keys"
      setError(message)
      return []
    } finally {
      setIsLoadingApiKeys(false)
    }
  }

  // Delete API key by hash
  const deleteApiKey = async (hash: string): Promise<boolean> => {
    setIsLoadingApiKeys(true)
    setError(null)
    try {
      await apiClient.deleteApiKey(hash)

      // Refresh the API keys list after deletion
      await listApiKeys()

      // If the deleted key was the current key, clear it
      if (hash === apiKeyHash) {
        setApiKey(null)
        setApiKeyHash(null)
      }

      return true
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : `Failed to delete API key ${hash}`
      setError(message)
      return false
    } finally {
      setIsLoadingApiKeys(false)
    }
  }

  // Logout
  const logout = async () => {
    // // Reset authentication state
    setIsAuthenticated(false)
    setToken(null)
    setVerifyData(null)
    setApiKey(null)
    setApiKeyHash(null)

    // Clear API client token
    apiClient.clearToken()

    // Remove all related items from localStorage
    localStorage.removeItem("unreal_token")
    localStorage.removeItem("unreal_wallet_address")
    localStorage.removeItem("unreal_openai_address")
    localStorage.removeItem("unreal_calls_value")
    localStorage.removeItem("unreal_payment_token")

    // Reset wallet address state
    setWalletAddress(null)
    setOpenaiAddress(null)

    console.log("Wallet disconnected and refresh")

    // Disconnect local WalletService state
    try {
      await walletService.disconnect()
    } catch (e) {
      console.warn("WalletService.disconnect warning:", e)
    }

    // If a thirdweb disconnector is registered, call it before reload
    try {
      if (walletDisconnectRef.current) {
        await walletDisconnectRef.current()
      }
    } catch (e) {
      console.warn("thirdweb disconnect warning:", e)
    }
    // Mark that the user intentionally signed out to prevent auto-reconnect on next mount
    localStorage.setItem(SIGNED_OUT_KEY, "1")
    window.location.reload()
  }

  // Clear current API key (after copy)
  const clearApiKey = () => {
    setApiKey(null)
  }

  // Clear error
  const clearError = () => {
    setError(null)
  }

  const value = {
    isAuthenticated,
    isLoading,
    walletAddress,
    availableAddresses,
    openaiAddress,
    token,
    verifyData,
    apiKey,
    apiKeyHash,
    apiKeys,
    isLoadingApiKeys,
    error,
    connectWallet,
    getAvailableAddresses,
    registerWithWallet,
    verifyToken,
    createApiKey,
    listApiKeys,
    deleteApiKey,
    logout,
    registerWalletDisconnector,
    clearApiKey,
    clearError,
  }

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>
}

export const useApi = (): ApiContextType => {
  const context = useContext(ApiContext)
  if (context === undefined) {
    throw new Error("useApi must be used within an ApiProvider")
  }
  return context
}
