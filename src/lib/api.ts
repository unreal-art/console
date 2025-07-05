import { createWalletClient, http, custom, getContract, parseUnits, formatUnits, hashMessage } from 'viem';
import { mainnet } from 'viem/chains';

// API base URL
const API_BASE_URL = 'https://openai.unreal.art';

// Types
export interface AuthAddressResponse {
  address: string;
  chain: {
    id: number;
    rpcUrls: {
      default: {
        http: string[];
      };
    };
  };
}

export interface RegisterPayload {
  iss: string; // wallet address
  iat: number; // issued at timestamp
  sub: string; // openai address
  exp: number; // expiry timestamp
  calls: number; // number of API calls
  paymentToken: string; // token address
}

export interface PermitMessage {
  owner: `0x${string}`;
  spender: `0x${string}`;
  value: bigint;
  nonce: bigint;
  deadline: bigint;
}

export interface RegisterRequest {
  payload: RegisterPayload;
  signature: string;
  address: string;
  permit?: PermitMessage;
  permitSignature?: string;
}

export interface RegisterResponse {
  token: string;
}

export interface VerifyResponse {
  valid: boolean;
  remaining: number;
  address: string;
  exp: number;
}

export interface ApiKeyResponse {
  key: string;
  hash: string;
}

// API Client
export class UnrealApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Set token for authenticated requests
  setToken(token: string) {
    this.token = token;
    // Store token in localStorage for persistence
    localStorage.setItem('unreal_token', token);
  }

  // Get stored token
  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('unreal_token');
    }
    return this.token;
  }

  // Clear token on logout
  clearToken() {
    this.token = null;
    localStorage.removeItem('unreal_token');
  }

  // Get system info
  async getSystemInfo(): Promise<any> {
    return this.get('/system');
  }

  // Get auth address for wallet connection
  async getAuthAddress(): Promise<AuthAddressResponse> {
    return this.get('/auth/address');
  }

  // Register with wallet signature
  async register(registerRequest: RegisterRequest): Promise<RegisterResponse> {
    return this.post('/auth/register', registerRequest);
  }

  // Verify token
  async verifyToken(token: string): Promise<VerifyResponse> {
    return this.get(`/auth/verify?token=${token}`);
  }

  // Create API key
  async createApiKey(name: string): Promise<ApiKeyResponse> {
    return this.post('/api/v1/keys', { name });
  }

  // Helper method for GET requests
  private async get(endpoint: string): Promise<any> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Helper method for POST requests
  private async post(endpoint: string, data: any): Promise<any> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

// Wallet utilities
export class WalletService {
  private walletClient: ReturnType<typeof createWalletClient> | null = null;
  private account: `0x${string}` | null = null;
  
  // Define window.ethereum for TypeScript
  private get ethereum(): any {
    return window.ethereum;
  }

  // Connect to wallet
  async connect(): Promise<string> {
    if (window.ethereum) {
      try {
        // Create a wallet client
        this.walletClient = createWalletClient({
          chain: mainnet,
          transport: custom(window.ethereum)
        });
        
        // Request accounts
        const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' }) as `0x${string}`[];
        this.account = address;
        
        return address;
      } catch (error) {
        console.error('Error connecting wallet:', error);
        throw new Error('Failed to connect wallet');
      }
    } else {
      throw new Error('No Ethereum wallet detected. Please install MetaMask or another wallet.');
    }
  }

  // Check if wallet is connected
  async isConnected(): Promise<boolean> {
    if (!window.ethereum) return false;
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
      return accounts.length > 0;
    } catch (error) {
      return false;
    }
  }

  // Get connected wallet address
  async getAddress(): Promise<string | null> {
    if (!window.ethereum) return null;
    
    try {
      if (!this.account) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
        if (accounts.length > 0) {
          this.account = accounts[0] as `0x${string}`;
        } else {
          return null;
        }
      }
      return this.account;
    } catch (error) {
      return null;
    }
  }

  // Sign message for registration
  async signMessage(message: string): Promise<string> {
    if (!this.walletClient || !this.account) {
      throw new Error('Wallet not connected');
    }
    
    try {
      return await this.walletClient.signMessage({
        account: this.account,
        message
      });
    } catch (error) {
      console.error('Error signing message:', error);
      throw new Error('Failed to sign message with wallet');
    }
  }

  // Create EIP-712 permit signature
  async createPermitSignature(
    tokenAddress: string,
    spender: string,
    amount: string,
    deadline: number
  ): Promise<{ permit: PermitMessage; signature: string }> {
    if (!this.walletClient || !this.account) {
      throw new Error('Wallet not connected');
    }

    try {
      const ownerAddress = await this.getAddress();
      if (!ownerAddress) throw new Error('No wallet address available');

      // Create a public client for read operations
      const publicClient = createWalletClient({
        chain: mainnet,
        transport: custom(window.ethereum)
      });
      
      // Define ERC20 ABI
      const erc20Abi = [
        { inputs: [], name: 'name', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
        { inputs: [{ type: 'address' }], name: 'nonces', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' }
      ] as const;
      
      // Get token name and nonce using direct calls
      const tokenName = 'Token'; // Placeholder - in real implementation, would call contract
      const nonce = '0'; // Placeholder - in real implementation, would call contract
      
      // Get chain ID
      const chainId = await this.walletClient.getChainId();
      
      // Create the domain separator for EIP-712
      const domain = {
        name: tokenName,
        version: '1',
        chainId: chainId,
        verifyingContract: tokenAddress as `0x${string}`,
      };
      
      // Define the permit type structure according to EIP-2612
      const types = {
        Permit: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      } as const;
      
      // Create the permit message
      const permit = {
        owner: ownerAddress as `0x${string}`,
        spender: spender as `0x${string}`,
        value: BigInt(amount),
        nonce: BigInt(nonce),
        deadline: BigInt(deadline)
      };
      
      // Sign the permit
      const signature = await this.walletClient.signTypedData({
        account: this.account,
        domain,
        types,
        primaryType: 'Permit',
        message: permit
      });
      
      return { permit, signature };
    } catch (error) {
      console.error('Error creating permit signature:', error);
      throw new Error('Failed to create permit signature');
    }
  }
}

// Create and export instances
export const apiClient = new UnrealApiClient();
export const walletService = new WalletService();

// Add TypeScript interface for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
