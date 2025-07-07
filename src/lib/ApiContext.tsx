import React, {
  createContext,
  useState,
  useContext,
  useEffect,
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
import { getUnrealBalance } from "@/utils/web3/unreal"
import { formatEther, parseEther, type Address } from "viem"

interface ApiContextType {
  isAuthenticated: boolean
  isLoading: boolean
  walletAddress: string | null
  openaiAddress: string | null
  token: string | null
  verifyData: VerifyResponse | null
  apiKey: string | null
  apiKeyHash: string | null
  apiKeys: ApiKey[]
  isLoadingApiKeys: boolean
  error: string | null
  connectWallet: () => Promise<string>
  registerWithWallet: (calls: number) => Promise<string>
  verifyToken: () => Promise<VerifyResponse>
  createApiKey: (name: string) => Promise<ApiKeyResponse>
  listApiKeys: () => Promise<ApiKey[]>
  deleteApiKey: (hash: string) => Promise<boolean>
  logout: () => void
  clearApiKey: () => void
  clearError: () => void
}

const ApiContext = createContext<ApiContextType | undefined>(undefined)

export const ApiProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [openaiAddress, setOpenaiAddress] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [verifyData, setVerifyData] = useState<VerifyResponse | null>(null)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [apiKeyHash, setApiKeyHash] = useState<string | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isLoadingApiKeys, setIsLoadingApiKeys] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize state from localStorage and handle auto-registration
  useEffect(() => {
    const storedToken = localStorage.getItem("unreal_token")
    const storedWalletAddress = localStorage.getItem("unreal_wallet_address")
    const storedOpenaiAddress = localStorage.getItem("unreal_openai_address")

    if (storedToken) {
      setToken(storedToken)
      apiClient.setToken(storedToken)
      setIsAuthenticated(true)
    }

    if (storedWalletAddress) {
      setWalletAddress(storedWalletAddress)
    }

    if (storedOpenaiAddress) {
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
                  // Get system info to get the token address
                  const systemInfo = await apiClient.getSystemInfo()
                  const paymentToken = systemInfo?.paymentToken as Address

                  if (!paymentToken) {
                    console.error(
                      "Payment token not available from system info"
                    )
                    // Fallback to zero calls if token address not available
                    await autoRegisterWithWallet(
                      address,
                      authAddressResponse.address,
                      0
                    )
                    return
                  }

                  // Get actual token balance
                  let calls = 0
                  try {
                    // Convert address to correct type for viem
                    const walletAddress = address as `0x${string}`
                    const balance = await getUnrealBalance(
                      paymentToken,
                      walletAddress
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

                  // Store the calls value in localStorage
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
      } catch (error) {
        console.error("Error checking wallet connection:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkWalletConnection()
  }, [])

  // Helper function for auto-registration
  const autoRegisterWithWallet = async (
    walletAddr: string,
    openaiAddr: string,
    calls: number
  ): Promise<string | null> => {
    try {
      // Constants
      const PAYMENT_TOKEN = "0xA409B5E5D34928a0F1165c7a73c8aC572D1aBCDB"
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
      if (calls > 0) {
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
    } catch (error) {
      console.error("Auto-registration failed:", error)
      return null
    }
  }

  // Connect wallet
  const connectWallet = async (): Promise<string> => {
    setIsLoading(true)
    setError(null)

    try {
      const address = await walletService.connect()
      setWalletAddress(address)
      localStorage.setItem("unreal_wallet_address", address)

      // Get OpenAI address
      const authAddressResponse = await apiClient.getAuthAddress()
      setOpenaiAddress(authAddressResponse.address)
      localStorage.setItem("unreal_openai_address", authAddressResponse.address)

      return address
    } catch (error: any) {
      setError(error.message || "Failed to connect wallet")
      throw error
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
      // Constants
      const PAYMENT_TOKEN = "0xA409B5E5D34928a0F1165c7a73c8aC572D1aBCDB"
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
      if (calls > 0) {
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
    } catch (error: any) {
      setError(error.message || "Failed to register")
      throw error
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
    } catch (error: any) {
      setError(error.message || "Failed to verify token")
      throw error
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
    } catch (error: any) {
      setError(error.message || "Failed to create API key")
      throw error
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
      setApiKeys(response.keys)
      return response.keys
    } catch (error: any) {
      setError(error.message || "Failed to list API keys")
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
    } catch (error: any) {
      setError(error.message || `Failed to delete API key ${hash}`)
      return false
    } finally {
      setIsLoadingApiKeys(false)
    }
  }

  // Logout
  const logout = () => {
    setIsAuthenticated(false)
    setToken(null)
    setVerifyData(null)
    apiClient.clearToken()
    localStorage.removeItem("unreal_token")
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
    openaiAddress,
    token,
    verifyData,
    apiKey,
    apiKeyHash,
    apiKeys,
    isLoadingApiKeys,
    error,
    connectWallet,
    registerWithWallet,
    verifyToken,
    createApiKey,
    listApiKeys,
    deleteApiKey,
    logout,
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
