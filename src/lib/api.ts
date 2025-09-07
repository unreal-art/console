import {
  createWalletClient,
  custom,
  createPublicClient,
  type EIP1193Provider,
  type WalletClient,
} from "viem"
import { OPENAI_URL } from "@/config/unreal"
import { getOnboard, resetOnboard } from "@/lib/onboard"
import type { OnboardAPI, WalletState } from "@web3-onboard/core"
import { getDefaultChain } from "@/config/wallet"

// API base URL
const API_BASE_URL = OPENAI_URL
import { openaiClient } from "@/config/unreal"

// Types
export interface AuthAddressResponse {
  address: string
  chain: {
    id: number
    rpcUrls: {
      default: {
        http: string[]
      }
    }
  }
}

export interface RegisterPayload {
  iss: string // wallet address
  iat: number // issued at timestamp
  sub: string // openai address
  exp: number // expiry timestamp
  calls: number // number of API calls
  paymentToken?: string // token address (optional)
}

export interface PermitMessage {
  owner: `0x${string}`
  spender: `0x${string}`
  value: string
  nonce: string
  deadline: string
}

export interface RegisterRequest {
  payload: RegisterPayload
  signature: string
  address: string
  permit?: PermitMessage
  permitSignature?: string
}

export interface RegisterResponse {
  token: string
}

export interface VerifyResponse {
  valid: boolean
  remaining: number
  address: string
  exp: number
}

export interface ApiKeyResponse {
  key: string
  hash: string
}

export interface ApiKey {
  hash?: string
  name: string
  created_at?: string
}

export interface ApiKeyListResponse {
  keys: ApiKey[]
}

export interface AirdropResponse {
  txHash: string
  alreadyClaimed: boolean
  confirmed: boolean
  message: string
}

export interface SystemInfo {
  paymentToken?: string
  paymentTokens?: Record<string, string>
  chains?: Array<{ id: string; token: string; label: string; rpcUrl: string }>
  [key: string]: unknown
}

// API Client
export class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }
  // Set token for authenticated requests
  setToken(token: string) {
    this.token = token
    // Store token in localStorage for persistence
    localStorage.setItem("unreal_token", token)
  }

  // Get stored token
  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem("unreal_token")
    }
    return this.token
  }

  // Clear token on logout
  clearToken() {
    this.token = null
    localStorage.removeItem("unreal_token")
  }

  // Get system info
  async getSystemInfo(): Promise<{
    paymentToken?: string
    paymentTokens?: Record<string, string>
    chains?: Array<{ id: string; token: string; label: string; rpcUrl: string }>
    [key: string]: unknown
  }> {
    const response = await openaiClient.get("/system")
    return response.data
  }

  async getAuthAddress(): Promise<AuthAddressResponse> {
    const response = await openaiClient.get("/auth/address")
    return response.data
  }

  async register(registerRequest: RegisterRequest): Promise<RegisterResponse> {
    const response = await openaiClient.post("/auth/register", registerRequest)
    return response.data
  }

  async verifyToken(token: string): Promise<VerifyResponse> {
    try {
      const response = await openaiClient.get(`/auth/verify`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return response.data
    } catch (error: unknown) {
      // Handle 401 Unauthorized or other token validation errors
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { status?: number } }).response
          ?.status === "number" &&
        ((error as { response: { status: number } }).response.status === 401 ||
          (error as { response: { status: number } }).response.status === 403)
      ) {
        const status = (error as { response: { status: number } }).response
          .status
        console.error("Token validation failed:", status)
        // Clear token from local storage and client state
        this.clearToken()
      }
      throw error // Re-throw the error for the caller to handle
    }
  }

  async createApiKey(name: string): Promise<ApiKeyResponse> {
    const response = await openaiClient.post("/keys", { name })
    return response.data
  }

  async listApiKeys(): Promise<ApiKeyListResponse> {
    const response = await openaiClient.get("/keys")
    return response.data
  }

  async airdrop(): Promise<AirdropResponse> {
    const response = await openaiClient.get("/web3/airdrop")
    return response.data
  }

  async deleteApiKey(hash: string): Promise<{ success: boolean }> {
    const response = await openaiClient.delete(
      `/keys/${encodeURIComponent(hash)}`
    )
    if (response.status === 204) {
      return { success: true }
    }
    return response.data
  }
}

// Wallet utilities
export class WalletService {
  private walletClient: WalletClient | null = null
  private account: `0x${string}` | null = null
  private provider: EIP1193Provider | null = null
  private onboard: OnboardAPI | null = null
  private connectedWallet: WalletState | null = null

  // Define window.ethereum for TypeScript
  private get ethereum(): EIP1193Provider | undefined {
    return window.ethereum as EIP1193Provider | undefined
  }

  // Get all available wallet addresses
  async getAvailableAddresses(): Promise<`0x${string}`[]> {
    try {
      // Check for SSR context first
      if (typeof window === "undefined") {
        return []
      }

      const onboard = getOnboard()
      const state = onboard?.state?.get?.()
      const wallets: WalletState[] = (state?.wallets || []) as WalletState[]
      if (wallets.length > 0) {
        const addresses = wallets
          .flatMap((w) => w.accounts || [])
          .map((a) => a.address as `0x${string}`)
        return addresses
      }
      
      // Fallback to injected provider if available
      if (this.ethereum?.request) {
        const addresses = (await this.ethereum.request({
          method: "eth_accounts",
          params: [],
        })) as `0x${string}`[]
        return addresses
      }
      
      // No wallet available, return empty array
      return []
    } catch (error) {
      console.error("Error getting wallet addresses:", error)
      throw new Error("Failed to get wallet addresses")
    }
  }

  // Connect to wallet
  async connect(selectedAddress?: string, forceSelect?: boolean): Promise<string> {
    try {
      this.onboard = getOnboard()

      let wallets: WalletState[] = []
      if (forceSelect) {
        // Always prompt the wallet selection modal
        wallets = await this.onboard.connectWallet()
        if (!wallets || wallets.length === 0) {
          throw new Error("No wallet connected")
        }
      } else {
        // If a wallet is already connected in Onboard state, hydrate without prompting
        const stateWallets = this.onboard?.state?.get?.().wallets || []
        wallets = stateWallets as WalletState[]
        if (!wallets || wallets.length === 0) {
          // Prompt connect only when there is no existing connection
          wallets = await this.onboard.connectWallet()
          if (!wallets || wallets.length === 0) {
            throw new Error("No wallet connected")
          }
        }
      }

      const primary = wallets[0]
      this.connectedWallet = primary
      this.provider = primary.provider

      // Create a viem wallet client from the connected provider
      // Explicitly cast to WalletClient to avoid excessive generic instantiation errors
      this.walletClient = (createWalletClient({
        transport: custom(this.provider),
      }) as unknown) as WalletClient

      const addresses = (primary.accounts || []).map(
        (a) => a.address as `0x${string}`
      )
      if (addresses.length === 0) {
        throw new Error("No accounts found in connected wallet")
      }

      // Use the selected address if provided and valid, otherwise the first address
      let address: `0x${string}` = addresses[0]
      if (
        selectedAddress &&
        addresses.includes(selectedAddress as `0x${string}`)
      ) {
        address = selectedAddress as `0x${string}`
      }

      this.account = address
      return address
    } catch (error) {
      console.error("Error connecting wallet:", error)
      throw new Error("Failed to connect wallet")
    }
  }

  // Switch to a different account from the available addresses
  async switchAccount(address: string): Promise<void> {
    try {
      // Verify the address is available in the connected wallet
      const availableAddresses = await this.getAvailableAddresses()
      if (!availableAddresses.includes(address as `0x${string}`)) {
        throw new Error(`Address ${address} is not available in the connected wallet`)
      }

      // Update the current account
      this.account = address as `0x${string}`
      console.debug(`[WalletService] Switched to account: ${address}`)
    } catch (error) {
      console.error("Error switching account:", error)
      throw new Error("Failed to switch account")
    }
  }

  /**
   * Disconnect the wallet.
   * Note: For injected wallets like MetaMask, there is no programmatic disconnect.
   * This method clears the internal wallet client/account and removes any cached state.
   * The user must disconnect manually from their wallet extension if needed.
   */
  async disconnect(): Promise<void> {
    try {
      // Attempt to disconnect via web3-onboard
      const onboard = this.onboard || getOnboard()
      const wallets = onboard?.state?.get?.().wallets || []
      for (const w of wallets) {
        try {
          // web3-onboard v2 API
          await onboard.disconnectWallet({ label: w.label })
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ignore onboard disconnect failures
    }

    this.walletClient = null
    this.account = null
    this.provider = null
    this.connectedWallet = null
    // Optionally clear any cached wallet info in localStorage/sessionStorage
    localStorage.removeItem("unreal_wallet_address")
    try {
      // Clear common web3-onboard persisted state to avoid auto-reconnect
      localStorage.removeItem("onboard")
      localStorage.removeItem("connectedWallets")
      // Clear WalletConnect v2 persisted state keys if present
      try {
        const keysToClear: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i)
          if (!k) continue
          const low = k.toLowerCase()
          if (
            low.startsWith("wc@") ||
            low.includes("walletconnect") ||
            low.includes("_walletconnect")
          ) {
            keysToClear.push(k)
          }
        }
        keysToClear.forEach((k) => localStorage.removeItem(k))
      } catch (_) {
        // ignore wc storage errors
      }
    } catch (_) {
      // ignore storage errors
    }
    // Drop current onboard instance so next connect shows the selection modal fresh
    try {
      resetOnboard()
    } catch (_) {
      // ignore
    }
    return
  }

  // Check if wallet is connected
  async isConnected(): Promise<boolean> {
    try {
      const onboard = this.onboard || getOnboard()
      const wallets = onboard?.state?.get?.().wallets || []
      if (wallets.length > 0) return true
    } catch (e) {
      // ignore state errors
      void e
    }
    if (!window.ethereum) return false
    try {
      const accounts = (await window.ethereum.request({
        method: "eth_accounts",
        params: [],
      })) as string[]
      return accounts.length > 0
    } catch (error) {
      return false
    }
  }

  // Get the current connected wallet address (always fetch fresh from state)
  async getAddress(): Promise<string | null> {
    try {
      const onboard = this.onboard || getOnboard()
      const wallets = onboard?.state?.get?.().wallets || []
      const first = wallets[0]

      let current: `0x${string}` | null = null

      // Aggregate all known addresses from onboard state
      const allAddresses: `0x${string}`[] = Array.isArray(wallets)
        ? wallets
            .flatMap((w: WalletState) => w?.accounts || [])
            .map((a) => a.address as `0x${string}`)
        : []

      // Prefer an explicit account set during connect(selectedAddress)
      if (this.account && allAddresses.includes(this.account)) {
        current = this.account
      } else if (first && first.accounts && first.accounts[0]?.address) {
        current = first.accounts[0].address as `0x${string}`
      } else if (this.ethereum?.request) {
        const accounts = (await this.ethereum.request({
          method: "eth_accounts",
          params: [],
        })) as `0x${string}`[]
        if (Array.isArray(accounts) && accounts.length > 0) {
          // If an explicit account was set and is available via provider, prefer it
          if (this.account && accounts.includes(this.account)) {
            current = this.account
          } else {
            current = accounts[0] as `0x${string}`
          }
        }
      }

      // Update cached account for convenience, but always prefer fresh state on next call
      this.account = current
      return current
    } catch (error) {
      return null
    }
  }

  // Expose a dynamic public client based on the connected provider
  getPublicClient(): ReturnType<typeof createPublicClient> {
    if (!this.provider) {
      throw new Error("No provider available - connect a wallet first")
    }
    return createPublicClient({ transport: custom(this.provider) })
  }

  async getChainId(): Promise<number> {
    const client = this.getPublicClient()
    return client.getChainId()
  }

  // Get the current chain ID from the connected wallet state
  async getCurrentChainId(): Promise<number> {
    const onboard = this.onboard || getOnboard()
    const wallets = onboard?.state?.get?.().wallets || []
    
    if (wallets.length > 0 && wallets[0].chains.length > 0) {
      // The first chain in the first wallet is the currently selected chain
      const chainId = wallets[0].chains[0].id
      // Convert hex string to number if needed
      if (typeof chainId === 'string' && chainId.startsWith('0x')) {
        return parseInt(chainId, 16)
      }
      return Number(chainId)
    }
    
    // Fallback to default chain if no wallet is connected
    return getDefaultChain().id
  }

  async setChain(chainIdHex: string): Promise<void> {
    const onboard = this.onboard || getOnboard()
    await onboard.setChain({ chainId: chainIdHex })
  }

  // Check ERC20 token allowance
  async checkAllowance(
    tokenAddress: string,
    owner: string,
    spender: string
  ): Promise<bigint> {
    if (!this.provider) {
      throw new Error("Wallet not connected")
    }

    try {
      const client = createPublicClient({
        transport: custom(this.provider),
      })

      // Define ERC20 allowance ABI
      const erc20Abi = [
        {
          inputs: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
          ],
          name: "allowance",
          outputs: [{ name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function",
        },
      ] as const

      // Check current allowance
      const allowance = await client.readContract({
        abi: erc20Abi,
        address: tokenAddress as `0x${string}`,
        functionName: "allowance",
        args: [owner as `0x${string}`, spender as `0x${string}`],
      })

      return BigInt(allowance)
    } catch (error) {
      console.error("Error checking allowance:", error)
      throw new Error("Failed to check token allowance")
    }
  }

  // Sign message for registration
  async signMessage(message: string): Promise<string> {
    if (!this.walletClient) {
      throw new Error("Wallet not connected")
    }

    try {
      const addr = await this.getAddress()
      if (!addr) throw new Error("No wallet address available")
      return await this.walletClient.signMessage({
        account: addr,
        message,
      })
    } catch (error) {
      console.error("Error signing message:", error)
      throw new Error("Failed to sign message with wallet")
    }
  }

  // Create EIP-712 permit signature
  async createPermitSignature(
    tokenAddress: string,
    spender: string,
    amount: bigint,
    deadline: number
  ): Promise<{ permit: PermitMessage; signature: string }> {
    if (!this.walletClient) {
      throw new Error("Wallet not connected")
    }

    try {
      const ownerAddress = await this.getAddress()
      if (!ownerAddress) throw new Error("No wallet address available")

      // Create a dynamic public client for read operations using the connected provider
      const client = createPublicClient({
        transport: custom(this.provider),
      })

      // Define ERC20 ABI
      const erc20Abi = [
        {
          inputs: [],
          name: "name",
          outputs: [{ type: "string" }],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [{ type: "address" }],
          name: "nonces",
          outputs: [{ type: "uint256" }],
          stateMutability: "view",
          type: "function",
        },
      ] as const

      // Get token name and nonce using direct calls
      const tokenName = await client.readContract({
        abi: erc20Abi,
        address: tokenAddress as `0x${string}`,
        functionName: "name",
      })
      const nonce = await client.readContract({
        abi: erc20Abi,
        address: tokenAddress as `0x${string}`,
        functionName: "nonces",
        args: [ownerAddress],
      })

      const chainId = await client.getChainId()

      // Create the domain separator for EIP-712
      const domain = {
        name: tokenName,
        version: "1",
        chainId: chainId,
        verifyingContract: tokenAddress as `0x${string}`,
      }

      // Define the permit type structure according to EIP-2612
      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      } as const

      // Create the permit message
      const permit = {
        owner: ownerAddress as `0x${string}`,
        spender: spender as `0x${string}`,
        value: amount,
        nonce: BigInt(nonce),
        deadline: BigInt(deadline),
      }

      // Sign the permit
      const signature = await this.walletClient.signTypedData({
        account: ownerAddress as `0x${string}`,
        domain,
        types,
        primaryType: "Permit",
        message: permit,
      })

      const permitMsg = {
        ...permit,
        value: amount.toString(),
        nonce: nonce.toString(),
        deadline: deadline.toString(),
      }

      console.log("permit", permitMsg)

      return { permit: permitMsg, signature }
    } catch (error) {
      console.error("Error creating permit signature:", error)
      throw new Error("Failed to create permit signature")
    }
  }
}

// Create and export instances
export const apiClient = new ApiClient()
export const walletService = new WalletService()

// Add TypeScript interface for window.ethereum
declare global {
  interface Window {
    ethereum?: EIP1193Provider
  }
}
