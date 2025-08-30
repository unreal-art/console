import { defineChain, type Chain } from "viem"
import { ChainError, type ExtendedChain } from "./types"

// Torus Mainnet configuration
export const torusMainnet = defineChain({
  id: 8192,
  name: "Torus Mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "Torus Ether",
    symbol: "TQF",
  },
  rpcUrls: {
    default: { http: ["https://rpc.toruschain.com/"] },
  },
  blockExplorers: {
    default: { name: "Torus Explorer", url: "https://toruscan.com" },
  },
  testnet: false,
  custom: {
    maxRPS: 3,
    tokens: {
      UnrealToken: {
        address: "0xA409B5E5D34928a0F1165c7a73c8aC572D1aBCDB" as const,
        symbol: "UNREAL",
        name: "Unreal Token",
        decimals: 18,
      },
    },
  },
}) as ExtendedChain

// Titan AI Testnet configuration
export const titanAITestnet = defineChain({
  id: 1020352220,
  name: "Titan AI",
  nativeCurrency: {
    decimals: 18,
    name: "Skale Fuel",
    symbol: "FUEL",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet.skalenodes.com/v1/aware-fake-trim-testnet"],
    },
  },
  blockExplorers: {
    default: {
      name: "Titan AI Explorer",
      url: "https://aware-fake-trim-testnet.explorer.testnet.skalenodes.com/",
    },
  },
  testnet: true,
  custom: {
    tokens: {
      UnrealToken: {
        address: "0x8bcEac95cb3AAF12358Dde73c16bB293f4b028C1" as const,
        symbol: "UNREAL",
        name: "Unreal Token",
        decimals: 18,
      },
    },
  },
}) as ExtendedChain

// Polygon Amoy Testnet configuration
export const amoyTestnet = defineChain({
  id: 80002,
  name: "Polygon Amoy",
  nativeCurrency: {
    decimals: 18,
    name: "POL",
    symbol: "POL",
  },
  rpcUrls: {
    default: {
      http: [
        "https://polygon-amoy.api.onfinality.io/rpc?apikey=1bd40958-ada5-4b09-8cbc-542bc44f0360",
        "https://polygon-amoy.api.onfinality.io/rpc?apikey=5a8fe9ad-d9aa-463e-8ad8-c6a4687d6cfa",
        "https://polygon-amoy.api.onfinality.io/rpc?apikey=855d2f36-8ddf-453f-a06e-5e7722fb460e",
        "https://polygon-amoy.api.onfinality.io/rpc?apikey=2c5aa595-0e05-4e6f-886d-328ecf686e9a",
        "https://polygon-amoy.api.onfinality.io/rpc?apikey=8eed9a83-a2d9-47ce-8a16-93484169061f",
        "https://polygon-amoy.api.onfinality.io/rpc?apikey=4b0f6579-9a73-4d9f-8183-c3bddf7d969d",
        "https://80002.rpc.thirdweb.com/1c7f56d370cac48d0c58616135e23ea5",
        "https://polygon-amoy.g.alchemy.com/v2/3GiG3I2-Yr9IAplzdUPuI",
        "https://rpc-amoy.polygon.technology",
        "https://polygon-amoy.drpc.org",
        "https://polygon-amoy-bor-rpc.publicnode.com",
      ],
    },
    public: {
      http: [
        "https://rpc-amoy.polygon.technology",
        "https://polygon-amoy-bor-rpc.publicnode.com",
      ],
    },
  },
  blockExplorers: {
    default: { name: "PolygonScan", url: "https://amoy.polygonscan.com" },
  },
  testnet: true,
  custom: {
    tokens: {
      UnrealToken: {
        address: "0x535D9D557f15ff50E46D51a6726C1Eb5FAf9D326" as const,
        symbol: "UNREAL",
        name: "Unreal Token",
        decimals: 18,
      },
    },
  },
}) as ExtendedChain

// Chain registry
const CHAIN_MAP = new Map<number, ExtendedChain>([
  [torusMainnet.id, torusMainnet],
  [amoyTestnet.id, amoyTestnet],
  [titanAITestnet.id, titanAITestnet],
])

// Export all chains as array
export const SUPPORTED_CHAINS = Array.from(CHAIN_MAP.values())

// Default chain
export const DEFAULT_CHAIN = torusMainnet

/**
 * Get a chain configuration by ID
 */
export function getChainById(chainId: number): ExtendedChain {
  const chain = CHAIN_MAP.get(chainId)
  if (!chain) {
    throw new ChainError(`Unsupported chain ID: ${chainId}`, chainId)
  }
  return chain
}

/**
 * Check if a chain is supported
 */
export function isChainSupported(chainId: number): boolean {
  return CHAIN_MAP.has(chainId)
}

/**
 * Get the Unreal token address for a specific chain
 */
export function getUnrealTokenAddress(chainId: number): `0x${string}` {
  const chain = getChainById(chainId)
  const tokenAddress = chain.custom?.tokens?.UnrealToken?.address
  
  if (!tokenAddress) {
    throw new ChainError(
      `Unreal token not configured for chain ${chain.name}`,
      chainId
    )
  }
  
  return tokenAddress as `0x${string}`
}

/**
 * Pick a random RPC URL from the list
 */
export function pickRandomRpc(rpcs: readonly string[]): string {
  if (rpcs.length === 0) {
    throw new Error("No RPC URLs available")
  }
  return rpcs[Math.floor(Math.random() * rpcs.length)]
}
