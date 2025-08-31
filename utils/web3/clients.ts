import { 
  createPublicClient, 
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Chain,
  type Account,
  type Transport
} from "viem"
import { 
  DEFAULT_CHAIN, 
  getChainById, 
  pickRandomRpc 
} from "./chains"
import { ChainError } from "./types"

// Client cache for performance
const publicClientCache = new Map<number, PublicClient>()
const walletClientCache = new Map<string, WalletClient>()

/**
 * Get or create a public client for reading blockchain data
 */
export function getPublicClient(chainId?: number): PublicClient {
  const targetChainId = chainId ?? DEFAULT_CHAIN.id
  
  // Return cached client if exists
  const cached = publicClientCache.get(targetChainId)
  if (cached) {
    return cached
  }
  
  // Get chain configuration
  const chain = getChainById(targetChainId)
  
  // Create new public client with random RPC
  const client = createPublicClient({
    chain,
    transport: http(pickRandomRpc(chain.rpcUrls.default.http), {
      retryCount: 3,
      retryDelay: 1000,
    }),
  })
  
  // Cache the client
  publicClientCache.set(targetChainId, client)
  
  return client
}

/**
 * Get the default public client (for default chain)
 */
export function getDefaultPublicClient(): PublicClient {
  return getPublicClient(DEFAULT_CHAIN.id)
}

/**
 * Create a wallet client for writing transactions
 */
export function createWalletClientForChain(
  account: Account,
  chainId: number
): WalletClient {
  const chain = getChainById(chainId)
  
  const cacheKey = `${account.address}-${chainId}`
  
  // Check cache
  const cached = walletClientCache.get(cacheKey)
  if (cached) {
    return cached
  }
  
  // Create new wallet client
  const client = createWalletClient({
    account,
    chain,
    transport: http(pickRandomRpc(chain.rpcUrls.default.http), {
      retryCount: 3,
      retryDelay: 1000,
    }),
  })
  
  // Cache the client
  walletClientCache.set(cacheKey, client)
  
  return client
}

/**
 * Clear client caches (useful for testing or when RPC issues occur)
 */
export function clearClientCaches(): void {
  publicClientCache.clear()
  walletClientCache.clear()
}

/**
 * Get block time estimate for a chain
 */
export async function getAverageBlockTime(
  chainId?: number,
  blockCount: number = 30
): Promise<number> {
  const client = getPublicClient(chainId)
  
  try {
    const latestBlock = await client.getBlock({ blockTag: "latest" })
    const fromBlockNumber = latestBlock.number - BigInt(blockCount)
    const fromBlock = await client.getBlock({ blockNumber: fromBlockNumber })
    
    const timeDiff = Number(latestBlock.timestamp - fromBlock.timestamp)
    const avgSeconds = timeDiff / blockCount
    
    // Return in milliseconds with buffer
    return Math.ceil(avgSeconds * 1000 * 1.5)
  } catch (error) {
    console.error("Failed to calculate average block time:", error)
    // Return default based on chain
    const chain = getChainById(chainId ?? DEFAULT_CHAIN.id)
    return chain.testnet ? 3000 : 12000 // 3s for testnets, 12s for mainnet
  }
}
