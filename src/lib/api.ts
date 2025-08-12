import {
  createWalletClient,
  http,
  custom,
  getContract,
  parseUnits,
  formatUnits,
  hashMessage,
} from "viem"
import { OPENAI_URL } from "@/config/unreal"
import { publicClient, torusMainnet, TORUS_RPC } from "@/config/wallet"
import type { EIP1193Provider } from "viem"

// API base URL
const API_BASE_URL = OPENAI_URL
import { openaiClient } from "@/config/unreal"
import { isAxiosError } from "axios"

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
  paymentToken: string // token address
}

export interface PermitMessage {
  owner: `0x${string}`
  spender: `0x${string}`
  value: bigint
  nonce: bigint
  deadline: bigint
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
  hash: string
  name: string
  created_at: string
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

// System Info type returned by backend
export interface SystemInfo {
  // Some backends may return a single paymentToken or an array of tokens
  paymentToken?: `0x${string}` | string
  paymentTokens?: (`0x${string}` | string)[]
  // Allow additional fields without strict typing
  [key: string]: unknown
}

// API Client
export class UnrealApiClient {
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
  async getSystemInfo(): Promise<SystemInfo> {
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
      if (isAxiosError(error)) {
        const status = error.response?.status
        if (status === 401 || status === 403) {
          console.error("Token validation failed:", status)
          // Clear token from local storage and client state
          this.clearToken()
        }
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

// Minimal types to avoid deep generic instantiation while keeping strong typing
type Eip712Domain = {
  name?: string
  version?: string
  chainId?: number
  verifyingContract?: `0x${string}`
}
type PermitTypes = {
  readonly Permit: readonly { readonly name: string; readonly type: string }[]
}
type SignTypedDataArgsLike = {
  account: `0x${string}`
  domain: Eip712Domain
  types: PermitTypes
  primaryType: "Permit"
  message: PermitMessage
}
type SignMessageArgsLike = { account: `0x${string}`; message: string }
type WalletClientLike = {
  signMessage: (args: SignMessageArgsLike) => Promise<`0x${string}`>
  signTypedData: (args: SignTypedDataArgsLike) => Promise<`0x${string}`>
}

// Wallet utilities
export class WalletService {
  private walletClient: WalletClientLike | null = null
  private account: `0x${string}` | null = null

  // Using global window.ethereum typed via EIP-1193 (see declaration below)

  // Get all available wallet addresses
  async getAvailableAddresses(): Promise<`0x${string}`[]> {
    if (window.ethereum) {
      try {
        // Request accounts
        const addresses = (await window.ethereum.request({
          method: "eth_requestAccounts",
          params: [],
        })) as `0x${string}`[]

        return addresses
      } catch (error) {
        console.error("Error getting wallet addresses:", error)
        throw new Error("Failed to get wallet addresses")
      }
    } else {
      throw new Error(
        "No Ethereum wallet detected. Please install MetaMask or another wallet."
      )
    }
  }

  // Connect to wallet
  async connect(selectedAddress?: string): Promise<string> {
    if (window.ethereum) {
      try {
        // Create a wallet client
        this.walletClient = (createWalletClient({
          chain: torusMainnet,
          transport: custom(window.ethereum),
        }) as unknown) as WalletClientLike

        // Request accounts
        const addresses = (await window.ethereum.request({
          method: "eth_requestAccounts",
          params: [],
        })) as `0x${string}`[]

        // Use the selected address if provided and valid, otherwise use the first address
        let address: `0x${string}`
        if (
          selectedAddress &&
          addresses.includes(selectedAddress as `0x${string}`)
        ) {
          address = selectedAddress as `0x${string}`
        } else {
          address = addresses[0]
        }

        this.account = address
        return address
      } catch (error) {
        console.error("Error connecting wallet:", error)
        throw new Error("Failed to connect wallet")
      }
    } else {
      throw new Error(
        "No Ethereum wallet detected. Please install MetaMask or another wallet."
      )
    }
  }

  /**
   * Disconnect the wallet.
   * Note: For injected wallets like MetaMask, there is no programmatic disconnect.
   * This method clears the internal wallet client/account and removes any cached state.
   * The user must disconnect manually from their wallet extension if needed.
   */
  async disconnect(): Promise<void> {
    this.walletClient = null
    this.account = null
    // Optionally clear any cached wallet info in localStorage/sessionStorage
    localStorage.removeItem("unreal_wallet_address")
    localStorage.removeItem("unreal_openai_address")
    // You may also want to clear other wallet-related state here
    return
  }

  // Check if wallet is connected
  async isConnected(): Promise<boolean> {
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

  // Get connected wallet address
  async getAddress(): Promise<string | null> {
    if (!window.ethereum) return null

    try {
      if (!this.account) {
        const accounts = (await window.ethereum.request({
          method: "eth_accounts",
          params: [],
        })) as string[]
        if (accounts.length > 0) {
          this.account = accounts[0] as `0x${string}`
        } else {
          return null
        }
      }
      return this.account
    } catch (error) {
      return null
    }
  }

  // Get current chain id from wallet
  async getCurrentChainId(): Promise<number> {
    if (!window.ethereum) throw new Error("No Ethereum wallet detected")
    const chainIdHex = (await window.ethereum.request({
      method: "eth_chainId",
      params: [],
    })) as string
    // chainId is hex string like '0x1'
    return parseInt(chainIdHex, 16)
  }

  // Ensure the wallet is on the expected chain. Attempts to switch; if chain is unknown, attempts to add it.
  async ensureChain(targetChainId: number = torusMainnet.id): Promise<boolean> {
    if (!window.ethereum) throw new Error("No Ethereum wallet detected")
    const current = await this.getCurrentChainId()
    if (current === targetChainId) return true

    const chainIdHex = `0x${targetChainId.toString(16)}`
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }],
      })
      return true
    } catch (switchError: unknown) {
      // 4902: Unrecognized chain by the wallet
      if (
        typeof switchError === "object" &&
        switchError !== null &&
        "code" in switchError &&
        (switchError as { code?: number }).code === 4902
      ) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: chainIdHex,
                chainName: torusMainnet.name,
                nativeCurrency: torusMainnet.nativeCurrency,
                rpcUrls: [TORUS_RPC],
                blockExplorerUrls: [
                  torusMainnet.blockExplorers?.default?.url,
                ].filter(Boolean) as string[],
              },
            ],
          })
          return true
        } catch (addError: unknown) {
          console.error("Failed to add chain to wallet:", addError)
          throw addError
        }
      }
      console.error("Failed to switch chain:", switchError)
      throw switchError
    }
  }

  // Sign message for registration
  async signMessage(message: string): Promise<string> {
    if (!this.walletClient || !this.account) {
      throw new Error("Wallet not connected")
    }

    try {
      return await this.walletClient.signMessage({
        account: this.account,
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
    if (!this.walletClient || !this.account) {
      throw new Error("Wallet not connected")
    }

    try {
      const ownerAddress = await this.getAddress()
      if (!ownerAddress) throw new Error("No wallet address available")

      // Ensure viem client metadata aligns with current chain (Torus)
      // Note: we sign via this.walletClient; no additional client is required here.

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
      const tokenName = await publicClient.readContract({
        abi: erc20Abi,
        address: tokenAddress as `0x${string}`,
        functionName: "name",
      })
      const nonce = await publicClient.readContract({
        abi: erc20Abi,
        address: tokenAddress as `0x${string}`,
        functionName: "nonces",
        args: [ownerAddress as `0x${string}`],
      })

      const chainId = await publicClient.getChainId()

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
        account: this.account,
        domain,
        types,
        primaryType: "Permit",
        message: permit,
      })

      // Optional: log stringified view for debugging
      const permitPreview = {
        ...permit,
        value: permit.value.toString(),
        nonce: permit.nonce.toString(),
        deadline: permit.deadline.toString(),
      }
      console.log("permit", permitPreview)

      return { permit, signature }
    } catch (error) {
      console.error("Error creating permit signature:", error)
      throw new Error("Failed to create permit signature")
    }
  }
}

// Create and export instances
export const apiClient = new UnrealApiClient()
export const walletService = new WalletService()

// Add TypeScript interface for window.ethereum
declare global {
  interface Window {
    ethereum?: EIP1193Provider
  }
}
