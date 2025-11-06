import { CHAINS, CHAIN_DEFAULT } from "@/config/viem"

/**
 * Blockscout SDK configuration for blockchain explorer integration.
 * 
 * Provides configuration for Blockscout API integration, including:
 * - Primary and supported chain configurations
 * - Token and contract mappings
 * - Explorer URL helpers
 */

// Blockscout SDK configuration
export const blockscoutConfig = {
  primaryChain: {
    id: CHAIN_DEFAULT.id,
    name: CHAIN_DEFAULT.name,
    rpcUrl: CHAIN_DEFAULT.rpcUrls.default.http[0],
    explorerUrl: CHAIN_DEFAULT.blockExplorers.default.url,
    apiUrl: `${CHAIN_DEFAULT.blockExplorers.default.url}/api/v2`,
    nativeCurrency: {
      name: CHAIN_DEFAULT.nativeCurrency.name,
      symbol: CHAIN_DEFAULT.nativeCurrency.symbol,
      decimals: CHAIN_DEFAULT.nativeCurrency.decimals,
    },
    isTestnet: CHAIN_DEFAULT.testnet,
  },

  // Multi chain support
  supportedChains: CHAINS.map((chain) => ({
    id: chain.id,
    name: chain.name,
    rpcUrl: chain.rpcUrls.default.http[0],
    explorerUrl: chain.blockExplorers.default.url,
    apiUrl: `${chain.blockExplorers.default.url}/api/v2`,
    nativeCurrency: {
      name: chain.nativeCurrency.name,
      symbol: chain.nativeCurrency.symbol,
      decimals: chain.nativeCurrency.decimals,
    },
    isTestnet: chain.testnet,
    isActive: true,
  })),

  tokens: {
    ...Object.fromEntries(
      CHAINS.map((chain) => {
        const custom = chain.custom as
          | { tokens?: { UnrealToken?: { address: string; symbol: string; name: string; decimals: number } } }
          | undefined
        const token = custom?.tokens?.UnrealToken
        if (!token) return []
        return [
          `${token.symbol}_${chain.id}`,
          {
            address: token.address,
            symbol: token.symbol,
            name: token.name,
            decimals: token.decimals,
            chainId: chain.id,
          },
        ]
      }).filter((entry) => entry.length > 0)
    ),
    ...Object.fromEntries(
      CHAINS.map((chain) => [
        chain.nativeCurrency.symbol,
        {
          address: "0x0000000000000000000000000000000000000000",
          symbol: chain.nativeCurrency.symbol,
          name: chain.nativeCurrency.name,
          decimals: chain.nativeCurrency.decimals,
          chainId: chain.id,
        },
      ])
    ),
  },

  // Contract addresses
  contracts: {
    ...Object.fromEntries(
      CHAINS.map((chain) => {
        const contracts = chain.contracts as
          | { UnrealToken?: { address: string } }
          | undefined
        const contract = contracts?.UnrealToken
        if (!contract) return []
        return [
          `UnrealToken_${chain.id}`,
          {
            address: contract.address,
            chainId: chain.id,
          },
        ]
      }).filter((entry) => entry.length > 0)
    ),
  },

  // Notification settings
  notifications: {
    enabled: true,
    position: "top-right" as const,
    duration: 5000,
    showExplorerLinks: true,
    showTransactionDetails: true,
  },

  // Custom toast types for Unreal operations
  customToastTypes: {
    TOKEN_APPROVAL: "token_approval",
    AIRDROP: "airdrop",
    TRANSACTION: "transaction",
  },
}

// Helper functions
export const getChainConfig = (chainId: number) => {
  return blockscoutConfig.supportedChains.find((chain) => chain.id === chainId)
}

export const getCurrentChainConfig = () => {
  try {
    const saved =
      typeof window !== "undefined"
        ? window.localStorage.getItem("evm-last-chain-id")
        : null
    if (saved) {
      const id = parseInt(saved, 10)
      const found = getChainConfig(id)
      if (found) return found
    }
  } catch {}
  return blockscoutConfig.primaryChain
}

export const getTokenConfig = (symbol: string) => {
  return blockscoutConfig.tokens[
    symbol as keyof typeof blockscoutConfig.tokens
  ]
}

export const getContractConfig = (contractName: string) => {
  return blockscoutConfig.contracts[
    contractName as keyof typeof blockscoutConfig.contracts
  ]
}

export const isChainSupported = (chainId: number) => {
  return blockscoutConfig.supportedChains.some((chain) => chain.id === chainId)
}

export const getExplorerUrl = (chainId?: number) => {
  const chain = chainId ? getChainConfig(chainId) : getCurrentChainConfig()
  return chain?.explorerUrl || blockscoutConfig.primaryChain.explorerUrl
}

export const getApiUrl = (chainId?: number) => {
  const chain = chainId ? getChainConfig(chainId) : getCurrentChainConfig()
  if (chain?.apiUrl) return chain.apiUrl
  if (chain?.explorerUrl) return `${chain.explorerUrl}/api/v2`
  return blockscoutConfig.primaryChain.apiUrl
}

