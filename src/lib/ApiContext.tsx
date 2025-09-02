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
import { getUnrealBalance } from "@utils/web3/unreal"
import { initOnboard, getOnboard, type OnboardChain } from "@/lib/onboard"
import type { WalletState } from "@web3-onboard/core"
import { formatEther } from "viem"
import { performRegistration } from "./registration"
import { getChainById } from "@utils/web3/chains"
import { getPublicClient, getDefaultChain } from "@/config/wallet"

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
  switchAccount: (address: string) => Promise<void>
  getAvailableAddresses: () => Promise<string[]>
  registerWithWallet: (calls: number) => Promise<string>
  verifyToken: () => Promise<VerifyResponse>
  createApiKey: (name: string) => Promise<ApiKeyResponse>
  listApiKeys: () => Promise<ApiKey[]>
  deleteApiKey: (hash: string) => Promise<boolean>
  logout: () => Promise<void>
  registerWalletDisconnector: (fn: (() => Promise<void> | void) | null) => void
  clearApiKey: () => void
  clearError: () => void
  getCurrentChainId: () => Promise<number>
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

  // Avoid persisting sign-out state; minimize localStorage usage to session token only

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
            return {
              id: idHex,
              token: c.token,
              label: c.label,
              rpcUrl: c.rpcUrl,
            }
          })
          initOnboard(chains)
        }
      } catch (e) {
        console.warn("Failed to init chains from system info", e)
      }
    })()
    const storedToken = localStorage.getItem("unreal_token")

    if (storedToken) {
      setToken(storedToken)
      apiClient.setToken(storedToken)
      setIsAuthenticated(true)
    }

    // Do not restore wallet address from storage; rely on wallet provider state

    // Check if wallet is already connected and handle auto-registration
    const checkWalletConnection = async () => {
      try {
        const isConnected = await walletService.isConnected()
        console.debug("[ApiContext] Wallet connected?", isConnected)
        if (isConnected) {
          const address = await walletService.getAddress()
          if (address) {
            setWalletAddress(address)
            console.debug("[ApiContext] Using wallet address", address)

            // If we have a wallet address but no token, fetch the OpenAI address
            if (!storedToken) {
              try {
                const authAddressResponse = await apiClient.getAuthAddress()
                setOpenaiAddress(authAddressResponse.address)
                console.debug(
                  "[ApiContext] Fetched OpenAI address",
                  authAddressResponse.address
                )

                try {
                  // Get system info and chain-aware token address
                  const systemInfo = await apiClient.getSystemInfo()
                  const chainId = await walletService.getChainId()

                  const chain = getChainById(chainId)

                  const paymentToken = chain.custom.tokens.UnrealToken.address

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

                  // Get actual token balance via dynamic public client
                  let calls = 0
                  try {
                    const walletAddr = address as `0x${string}`
                    const chainId = await walletService.getCurrentChainId()
                    const client = getPublicClient(chainId)
                    const balance = await getUnrealBalance(
                      paymentToken,
                      walletAddr,
                      client
                    )
                    const balanceInEther = formatEther(balance)
                    calls = Number(balanceInEther)
                    console.debug(
                      "[ApiContext] UNREAL balance:",
                      balanceInEther,
                      "=> calls:",
                      calls
                    )
                  } catch (balanceError) {
                    console.error("Unable to get balance:", balanceError)
                    // Continue with zero calls if balance check fails
                  }

                  // Do not persist calls/payment token; use in-memory only

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

    // Always check connection on mount; no persistent signed-out gating
    checkWalletConnection()
  }, [])

  // React to wallet account changes from Web3-Onboard state
  useEffect(() => {
    const onboard = getOnboard()
    // Prefer subscribing to the wallets slice if available
    type WalletsSubscription = {
      subscribe: (fn: (wallets: WalletState[]) => void) => {
        unsubscribe: () => void
      }
    }
    const selector = (
      onboard as unknown as {
        state?: { select?: (key: "wallets") => WalletsSubscription }
      }
    ).state?.select?.("wallets")

    if (selector && typeof selector.subscribe === "function") {
      const sub = selector.subscribe((wallets: WalletState[]) => {
        try {
          const first = wallets && wallets[0]
          const nextAddr: string | null = first?.accounts?.[0]?.address || null

          // Update available addresses list
          const addrs = Array.isArray(wallets)
            ? wallets
                .flatMap((w: WalletState) => w?.accounts || [])
                .map((a) => String(a?.address || ""))
                .filter((v) => v.length > 0)
            : []
          setAvailableAddresses(addrs)

          // Update current wallet address if changed
          if (nextAddr !== walletAddress) {
            setWalletAddress(nextAddr)
            console.debug("[ApiContext] Wallet account changed:", nextAddr)
          }
        } catch (e) {
          console.warn("[ApiContext] Wallets subscription parse error", e)
        }
      })
      return () => {
        try {
          sub?.unsubscribe?.()
        } catch (_) {
          // ignore
        }
      }
    }

    // Fallback polling if select/subscribe is not available
    let cancelled = false
    const interval = setInterval(async () => {
      if (cancelled) return
      try {
        const addr = await walletService.getAddress()
        if (addr !== walletAddress) {
          setWalletAddress(addr)
          console.debug("[ApiContext] Wallet account polled change:", addr)
        }
      } catch {
        // ignore
      }
    }, 1500)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [walletAddress])

  // Helper function for auto-registration
  const autoRegisterWithWallet = async (
    walletAddr: string,
    openaiAddr: string,
    calls: number
  ): Promise<string | null> => {
    try {
      console.debug("[ApiContext] Auto-register start", {
        walletAddr,
        openaiAddr,
        calls,
      })
      const result = await performRegistration(calls, walletAddr, openaiAddr)

      // Set token and auth state
      setToken(result.token)
      localStorage.setItem("unreal_token", result.token)
      apiClient.setToken(result.token)
      setIsAuthenticated(true)

      // Do not persist payment token; use in-memory flow only

      console.debug("[ApiContext] Auto-register success; token set")

      return result.token
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
        error instanceof Error
          ? error.message
          : "Failed to get wallet addresses"
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
      console.debug("[ApiContext] Connected wallet address", finalAddress)

      // Get OpenAI address
      const authAddressResponse = await apiClient.getAuthAddress()
      setOpenaiAddress(authAddressResponse.address)
      console.debug(
        "[ApiContext] Fetched OpenAI address",
        authAddressResponse.address
      )

      return finalAddress
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to connect wallet"
      setError(message)
      throw error as Error
    } finally {
      setIsLoading(false)
    }
  }

  // Switch to a different account from the available addresses
  const switchAccount = async (address: string): Promise<void> => {
    setError(null)

    try {
      // Switch the account in WalletService
      await walletService.switchAccount(address)

      // Update the context state to reflect the new address
      setWalletAddress(address)
      console.debug("[ApiContext] Switched to account:", address)

      // Note: This doesn't automatically re-register or change authentication
      // The user will need to re-register if they want to use this account for API calls
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to switch account"
      setError(message)
      throw error as Error
    }
  }

  // Register with wallet
  const registerWithWallet = async (calls: number): Promise<string> => {
    setIsLoading(true)
    setError(null)

    // Always fetch the active wallet address from WalletService to avoid stale state
    const currentAddress = await walletService.getAddress()
    if (!currentAddress) {
      setError("Wallet not connected")
      setIsLoading(false)
      throw new Error("Wallet not connected")
    }
    // Keep context state in sync
    if (currentAddress !== walletAddress) {
      setWalletAddress(currentAddress)
    }

    // Ensure we have the OpenAI address
    let openaiAddr = openaiAddress
    if (!openaiAddr) {
      try {
        const authAddressResponse = await apiClient.getAuthAddress()
        openaiAddr = authAddressResponse.address
        setOpenaiAddress(openaiAddr)
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Failed to fetch OpenAI address"
        setError(message)
        setIsLoading(false)
        throw e as Error
      }
    }

    try {
      console.debug("[ApiContext] Register with wallet", {
        walletAddress: currentAddress,
        openaiAddr,
        calls,
      })
      const result = await performRegistration(
        calls,
        currentAddress,
        openaiAddr!
      )

      // Set token
      setToken(result.token)
      localStorage.setItem("unreal_token", result.token)
      apiClient.setToken(result.token)
      setIsAuthenticated(true)

      // Do not persist payment token

      return result.token
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to register"
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
      const message =
        error instanceof Error ? error.message : "Failed to create API key"
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
      const rawKeys = (response as { keys: Array<ApiKey | string> | unknown })
        .keys as Array<ApiKey | string> | undefined
      const normalized: ApiKey[] = Array.isArray(rawKeys)
        ? rawKeys
            .map((k: ApiKey | string): ApiKey => {
              if (typeof k === "string") {
                // Backend returns only a list of key names
                return { name: k }
              }
              if (typeof k === "object" && k !== null) {
                const name =
                  typeof (k as { name?: unknown }).name === "string"
                    ? ((k as { name?: unknown }).name as string)
                    : ""
                const hash =
                  typeof (k as { hash?: unknown }).hash === "string"
                    ? ((k as { hash?: unknown }).hash as string)
                    : undefined
                const created_at =
                  typeof (k as { created_at?: unknown }).created_at === "string"
                    ? ((k as { created_at?: unknown }).created_at as string)
                    : typeof (k as { createdAt?: unknown }).createdAt ===
                      "string"
                    ? ((k as { createdAt?: unknown }).createdAt as string)
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
      const message =
        error instanceof Error ? error.message : "Failed to list API keys"
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
        error instanceof Error
          ? error.message
          : `Failed to delete API key ${hash}`
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

    // Reset wallet address state
    setWalletAddress(null)
    setOpenaiAddress(null)

    console.debug("[ApiContext] Logout complete; refreshing app")

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

  // Get current chain ID from wallet
  const getCurrentChainId = async (): Promise<number> => {
    try {
      return await walletService.getCurrentChainId()
    } catch (error) {
      console.error("Error getting current chain ID:", error)
      // Return configured default chain ID if error
      return getDefaultChain().id
    }
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
    switchAccount,
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
    getCurrentChainId,
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
