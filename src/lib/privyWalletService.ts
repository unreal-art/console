import { createWalletClient, custom, type WalletClient, type EIP1193Provider } from 'viem';
import { getDefaultChain } from '@/config/wallet';

// Privy wallet type
interface PrivyWallet {
  address: string;
  chainId: string;
  walletClientType: string;
  connectorType: string;
  getEthereumProvider: () => Promise<EIP1193Provider>;
}

export class PrivyWalletService {
  private walletClient: WalletClient | null = null;
  private account: `0x${string}` | null = null;
  private provider: EIP1193Provider | null = null;

  // Initialize with Privy wallet provider
  async initWithPrivyWallet(wallet: PrivyWallet): Promise<void> {
    try {
      // Get the provider from Privy wallet
      const provider = await wallet.getEthereumProvider();
      if (!provider) {
        throw new Error('No provider available from Privy wallet');
      }

      this.provider = provider as EIP1193Provider;
      
      // Create wallet client with the provider
      this.walletClient = createWalletClient({
        chain: getDefaultChain(),
        transport: custom(this.provider),
      });

      // Get the account address
      const accounts = await provider.request({ method: 'eth_accounts' });
      if (accounts && accounts.length > 0) {
        this.account = accounts[0] as `0x${string}`;
      }
    } catch (error) {
      console.error('Error initializing Privy wallet:', error);
      throw error;
    }
  }

  // Connect wallet using Privy
  async connect(wallet: PrivyWallet): Promise<string> {
    await this.initWithPrivyWallet(wallet);
    
    if (!this.account) {
      throw new Error('No account found after connecting');
    }
    
    return this.account;
  }

  // Disconnect wallet
  async disconnect(): Promise<void> {
    this.walletClient = null;
    this.account = null;
    this.provider = null;
  }

  // Check if wallet is connected
  isConnected(): boolean {
    return !!this.walletClient && !!this.account;
  }

  // Get current wallet address
  async getAddress(): Promise<`0x${string}` | null> {
    if (!this.account) {
      // Try to get from provider if available
      if (this.provider) {
        try {
          const accounts = await this.provider.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            this.account = accounts[0] as `0x${string}`;
            return this.account;
          }
        } catch (error) {
          console.error('Error getting accounts:', error);
        }
      }
      return null;
    }
    return this.account;
  }

  // Get all available addresses (for Privy, typically just one)
  async getAvailableAddresses(): Promise<string[]> {
    const address = await this.getAddress();
    return address ? [address] : [];
  }

  // Get current chain ID
  async getCurrentChainId(): Promise<number> {
    if (!this.provider) {
      return getDefaultChain().id;
    }

    try {
      const chainIdHex = await this.provider.request({ method: 'eth_chainId' });
      return parseInt(chainIdHex as string, 16);
    } catch (error) {
      console.error('Error getting chain ID:', error);
      return getDefaultChain().id;
    }
  }

  // Switch to a different chain
  async switchChain(chainId: number): Promise<void> {
    if (!this.provider) {
      throw new Error('No provider available');
    }

    const chainIdHex = `0x${chainId.toString(16)}`;
    
    try {
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
    } catch (error: unknown) {
      // If chain doesn't exist, we might need to add it first
      const errorObj = error as { code?: number; message?: string };
      if (errorObj.code === 4902) {
        throw new Error('Chain not configured in wallet. Please add it manually.');
      }
      throw error;
    }
  }

  // Sign a message
  async signMessage(message: string): Promise<string> {
    if (!this.walletClient || !this.account) {
      throw new Error('Wallet not connected');
    }

    try {
      return await this.walletClient.signMessage({
        account: this.account,
        message,
      });
    } catch (error) {
      console.error('Error signing message:', error);
      throw new Error('Failed to sign message with wallet');
    }
  }

  // Get the wallet client for advanced operations
  getWalletClient(): WalletClient | null {
    return this.walletClient;
  }

  // Get the provider for direct RPC calls
  getProvider(): EIP1193Provider | null {
    return this.provider;
  }
}

// Export a singleton instance
export const privyWalletService = new PrivyWalletService();
