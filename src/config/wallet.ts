import {
  Chain,
  createNonceManager,
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  erc20Abi,
  WalletClient,
} from "viem"
import { privateKeyToAccount } from "viem/accounts"

/**
 * Multichain wallet configuration and public client factory.
 *
 * - Default chain: Torus Mainnet
 * - Use getPublicClient(chainId?) to retrieve a cached PublicClient per chain.
 * - Use getDefaultPublicClient() for the default Torus client.
 * - Legacy export `publicClient` is deprecated; migrate to the functions above.
 */
// -------- Chain / RPC configuration --------
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
    // maxRPS : for
    maxRPS: 3,

    tokens: {
      UnrealToken: {
        address: "0xA409B5E5D34928a0F1165c7a73c8aC572D1aBCDB",
        symbol: "UNREAL",
        name: "Unreal Token",
        decimals: 18,
      },
    },
  },
  contracts: {
    UnrealToken: {
      address: "0xA409B5E5D34928a0F1165c7a73c8aC572D1aBCDB",
      symbol: "UNREAL",
      name: "Unreal Token",
      decimals: 18,
      abi: erc20Abi,
    },
  },
})

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
        address: "0x8bcEac95cb3AAF12358Dde73c16bB293f4b028C1",
        symbol: "UNREAL",
        name: "Unreal Token",
        decimals: 18,
      },
    },
  },
  contracts: {
    UnrealToken: {
      address: "0x8bcEac95cb3AAF12358Dde73c16bB293f4b028C1",
      symbol: "UNREAL",
      name: "Unreal Token",
      decimals: 18,
      abi: erc20Abi,
    },
  },
})

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
        // "https://80002.rpc.thirdweb.com/1c7f56d370cac48d0c58616135e23ea5",
        // "https://polygon-amoy.api.onfinality.io/public",
        // 'https://polygon-amoy.public.blastapi.io/',

        "https://polygon-amoy.g.alchemy.com/v2/3GiG3I2-Yr9IAplzdUPuI",
        "https://rpc-amoy.polygon.technology",
        // "https://polygon-amoy.gateway.tatum.io",
        "https://polygon-amoy.drpc.org",
        // "https://api.zan.top/polygon-amoy", //ran into RPS limits
        "https://polygon-amoy-bor-rpc.publicnode.com",
        // "https://polygon-amoy.api.onfinality.io/public",
        // "https://polygon-amoy.gateway.tenderly.co",
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
        address: "0x535D9D557f15ff50E46D51a6726C1Eb5FAf9D326",
        symbol: "UNREAL",
        name: "Unreal Token",
        decimals: 18,
      },
    },
  },
  contracts: {
    UnrealToken: {
      address: "0x535D9D557f15ff50E46D51a6726C1Eb5FAf9D326",
      symbol: "UNREAL",
      name: "Unreal Token",
      decimals: 18,
      abi: erc20Abi,
    },
  },
})


export const somniaTestnet = defineChain({
  id: 50312,
  name: "Somnia Shanon Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Somnia Testnet Token",
    symbol: "STT",
  },
  rpcUrls: {
    default: {
      http: [
        "https://dream-rpc.somnia.network"
      ],
    },
    public: {
      http: ["https://dream-rpc.somnia.network"],
    },
  },
  blockExplorers: {
    default: { name: "Somnia Shanon Explorer", url: "https://shannon-explorer.somnia.network/" },
  },
  testnet: true,
  custom: {
    maxRPS: 3,

    tokens: {
      UnrealToken: {
        address: "0xd1fB2a15545032a8170370d7eC47C0FC69A00eed",
        symbol: "UNREAL",
        name: "Unreal Token",
        decimals: 18,
      },
    },
  },
  contracts: {
    UnrealToken: {
      address: "0xd1fB2a15545032a8170370d7eC47C0FC69A00eed",
      symbol: "UNREAL",
      name: "Unreal Token",
      decimals: 18,
      abi: erc20Abi,
    },
  },
})


// Chain configuration map
export const CHAIN_MAP = new Map<number, Chain>([
  [torusMainnet.id, torusMainnet],
  [amoyTestnet.id, amoyTestnet],
  [titanAITestnet.id, titanAITestnet],
  [somniaTestnet.id, somniaTestnet],
])

/**
 * Get a Chain definition by chainId.
 * @param chainId EVM chain id (e.g., 8192 Torus, 80002 Amoy)
 * @returns Chain or undefined if not supported
 */
export function getChain(chainId: number): Chain {
  const chain = CHAIN_MAP.get(chainId)
  if (!chain) {
    throw new Error(`Unsupported chain ID: ${chainId}`)
  }
  return chain
}

/**
 * Get the default Chain used by the router (Torus Mainnet).
 */
export function getDefaultChain(): Chain {
  return torusMainnet
}

export const CHAINS = Array.from(CHAIN_MAP.values())

// -------- Public Client Management --------
// Cache for public clients per chain
const publicClientCache = new Map<number, any>()

export function pickRpc(rpcs: readonly string[]) {
  return rpcs[Math.floor(Math.random() * rpcs.length)]
}
/**
 * Get or create a public client for the specified chain
 */
export function getPublicClient(chainId?: number): any {
  const targetChainId = chainId || getDefaultChain().id

  // Return cached client if exists
  if (publicClientCache.has(targetChainId)) {
    return publicClientCache.get(targetChainId)!
  }

  // Get chain configuration
  const chain = getChain(targetChainId)
  if (!chain) {
    throw new Error(`Unsupported chain ID: ${targetChainId}`)
  }

  // Create new public client
  const client = createPublicClient({
    chain,
    transport: http(pickRpc(chain.rpcUrls.default.http)),
  })

  // Cache the client
  publicClientCache.set(targetChainId, client)

  return client
}

/**
 * Get the default public client (Torus Mainnet)
 */
export function getDefaultPublicClient(): any {
  return getPublicClient(getDefaultChain().id)
}

export const publicClient = getDefaultPublicClient()

// Legacy export for backward compatibility (DEPRECATED)
// TODO: Remove this once all usage is migrated to getPublicClient()
