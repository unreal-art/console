import { create } from "zustand"
import { apiClient, walletService, type VerifyResponse, type ApiKey, type ApiKeyResponse } from "@/lib/api"
import { switchChain as onboardSwitchChain, getConfiguredChains } from "@/lib/onboard"
import { performRegistration } from "@/lib/registration"

export type AppStore = {
  // State
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
  walletAddress: string | null
  openaiAddress: string | null
  token: string | null
  verifyData: VerifyResponse | null
  apiKey: string | null
  apiKeyHash: string | null
  apiKeys: ApiKey[]
  isLoadingApiKeys: boolean
  chainIdHex: string | null
  chains: ReturnType<typeof getConfiguredChains>
  // Actions
  hydrate: () => Promise<void>
  connectWallet: (selectedAddress?: string) => Promise<string>
  switchChain: (hex: string) => Promise<void>
  getCurrentChainId: () => Promise<number>
  registerWithWallet: (calls: number) => Promise<string>
  verifyToken: () => Promise<VerifyResponse>
  createApiKey: (name: string) => Promise<ApiKeyResponse>
  listApiKeys: () => Promise<ApiKey[]>
  deleteApiKey: (hash: string) => Promise<boolean>
  logout: () => Promise<void>
  clearError: () => void
}

export const useAppStore = create<AppStore>((set, get) => ({
  // initial state
  isLoading: false,
  error: null,
  isAuthenticated: false,
  walletAddress: null,
  openaiAddress: null,
  token: null,
  verifyData: null,
  apiKey: null,
  apiKeyHash: null,
  apiKeys: [],
  isLoadingApiKeys: false,
  chainIdHex: null,
  chains: getConfiguredChains(),

  // actions
  hydrate: async () => {
    try {
      const token = apiClient.getToken()
      if (token) {
        apiClient.setToken(token)
        set({ token, isAuthenticated: true })
      }
      // Try to hydrate wallet client from Onboard state (no prompt)
      try {
        const addr = await walletService.connect()
        if (addr) set({ walletAddress: addr })
      } catch {
        // ignore, user will connect explicitly
      }
      // Sync chain id if wallet available
      try {
        const id = await get().getCurrentChainId()
        set({ chainIdHex: `0x${id.toString(16)}`.toLowerCase(), chains: getConfiguredChains() })
      } catch {
        // ignore
      }
    } catch (e) {
      // ignore
    }
  },

  connectWallet: async (selectedAddress?: string) => {
    set({ isLoading: true, error: null })
    try {
      const address = await walletService.connect(selectedAddress)
      const finalAddress = selectedAddress || address
      set({ walletAddress: finalAddress })

      const authAddressResponse = await apiClient.getAuthAddress()
      set({ openaiAddress: authAddressResponse.address })
      return finalAddress
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to connect wallet"
      set({ error: message })
      throw err as Error
    } finally {
      set({ isLoading: false })
    }
  },

  switchChain: async (hex: string) => {
    await onboardSwitchChain(hex)
    try {
      localStorage.setItem("unreal_last_chain", hex.toLowerCase())
    } catch {
      // ignore
    }
    set({ chainIdHex: hex.toLowerCase() })
  },

  getCurrentChainId: async () => {
    try {
      return await walletService.getCurrentChainId()
    } catch {
      // fallback to chains[0]
      const first = get().chains?.[0]?.id
      return first ? parseInt(first, 16) : 0
    }
  },

  registerWithWallet: async (calls: number) => {
    set({ isLoading: true, error: null })
    try {
      const addr = get().walletAddress || (await get().connectWallet())
      if (!addr) throw new Error("Wallet not connected")

      // Ensure we have openai address
      let openaiAddr = get().openaiAddress
      if (!openaiAddr) {
        const resp = await apiClient.getAuthAddress()
        openaiAddr = resp.address
        set({ openaiAddress: openaiAddr })
      }

      const { token } = await performRegistration(calls, addr, openaiAddr!)
      apiClient.setToken(token)
      set({ token, isAuthenticated: true })
      return token
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to register"
      set({ error: message })
      throw err as Error
    } finally {
      set({ isLoading: false })
    }
  },

  verifyToken: async () => {
    set({ isLoading: true, error: null })
    const token = get().token
    if (!token) {
      const err = new Error("No token available")
      set({ error: err.message, isLoading: false })
      throw err
    }
    try {
      const res = await apiClient.verifyToken(token)
      set({ verifyData: res })
      return res
    } catch (e: unknown) {
      // Clear token on auth failure will be handled in apiClient interceptor too
      set({ error: e instanceof Error ? e.message : "Failed to verify token", isAuthenticated: false, token: null, verifyData: null })
      throw e as Error
    } finally {
      set({ isLoading: false })
    }
  },

  createApiKey: async (name: string) => {
    set({ isLoading: true, error: null })
    try {
      const res = await apiClient.createApiKey(name)
      set({ apiKey: res.key, apiKeyHash: res.hash })
      // refresh list
      void get().listApiKeys()
      return res
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : "Failed to create API key" })
      throw e as Error
    } finally {
      set({ isLoading: false })
    }
  },

  listApiKeys: async () => {
    set({ isLoadingApiKeys: true, error: null })
    try {
      const resp = await apiClient.listApiKeys()
      const list = Array.isArray(resp?.keys) ? resp.keys : []
      set({ apiKeys: list as ApiKey[] })
      return list as ApiKey[]
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : "Failed to list API keys" })
      return []
    } finally {
      set({ isLoadingApiKeys: false })
    }
  },

  deleteApiKey: async (hash: string) => {
    set({ isLoadingApiKeys: true, error: null })
    try {
      await apiClient.deleteApiKey(hash)
      // if deleting current
      if (get().apiKeyHash === hash) set({ apiKey: null, apiKeyHash: null })
      // refresh
      void get().listApiKeys()
      return true
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : `Failed to delete API key ${hash}` })
      return false
    } finally {
      set({ isLoadingApiKeys: false })
    }
  },

  logout: async () => {
    set({ isAuthenticated: false, token: null, verifyData: null, apiKey: null, apiKeyHash: null, walletAddress: null, openaiAddress: null })
    apiClient.clearToken()
    try {
      await walletService.disconnect()
    } catch {
      // ignore
    }
    try {
      localStorage.removeItem("unreal_token")
    } catch {
      // ignore
    }
    // soft refresh handled by caller if needed
  },

  clearError: () => set({ error: null }),
}))
