import { PrivyProvider } from '@privy-io/react-auth';
import { toHex } from 'viem';
import { torusMainnet, amoyTestnet, titanAITestnet } from '@/config/wallet';
import { ReactNode } from 'react';

// Privy App ID - You'll need to get this from your Privy dashboard
// For development, you can use a test app ID
const PRIVY_APP_ID = process.env.VITE_PRIVY_APP_ID || 'YOUR_PRIVY_APP_ID';

// Configure chains for Privy
const privyChains = [
  {
    id: torusMainnet.id,
    name: torusMainnet.name,
    network: 'torus',
    nativeCurrency: torusMainnet.nativeCurrency,
    rpcUrls: {
      default: { http: torusMainnet.rpcUrls.default.http },
    },
    blockExplorers: torusMainnet.blockExplorers,
  },
  {
    id: amoyTestnet.id,
    name: amoyTestnet.name,
    network: 'polygon-amoy',
    nativeCurrency: amoyTestnet.nativeCurrency,
    rpcUrls: {
      default: { http: amoyTestnet.rpcUrls.default.http },
    },
    blockExplorers: amoyTestnet.blockExplorers,
  },
  {
    id: titanAITestnet.id,
    name: titanAITestnet.name,
    network: 'titan-ai',
    nativeCurrency: titanAITestnet.nativeCurrency,
    rpcUrls: {
      default: { http: titanAITestnet.rpcUrls.default.http },
    },
    blockExplorers: titanAITestnet.blockExplorers,
  },
];

// Default chain ID (Torus Mainnet)
const defaultChain = torusMainnet.id;

interface PrivyWrapperProps {
  children: ReactNode;
}

export function PrivyWrapper({ children }: PrivyWrapperProps) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        // Appearance configuration
        appearance: {
          theme: 'dark',
          accentColor: '#676FFF',
          logo: '/logo.svg', // Update with your logo path
          showWalletLoginFirst: true,
        },
        // Login methods - prioritize wallet connection
        loginMethods: ['wallet', 'email', 'google'],
        // Embedded wallets configuration
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
          requireUserPasswordOnCreate: false,
        },
        // Supported chains
        supportedChains: privyChains.map(chain => ({
          id: chain.id,
          name: chain.name,
          network: chain.network,
          nativeCurrency: chain.nativeCurrency,
          rpcUrls: chain.rpcUrls,
          blockExplorers: chain.blockExplorers,
        })),
        defaultChain,
        // Wallet connection options
        walletConnectCloudProjectId: process.env.VITE_WALLETCONNECT_PROJECT_ID,
      }}
    >
      {children}
    </PrivyProvider>
  );
}


