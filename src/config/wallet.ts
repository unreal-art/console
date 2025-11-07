import {
  createNonceManager,
  createPublicClient,
  createWalletClient,
  http,
  WalletClient,
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import {
  getChain,
  getDefaultChain,
  torusMainnet,
  amoyTestnet,
  titanAITestnet,
  somniaTestnet,
  CHAIN_MAP,
  CHAINS,
  CHAIN_DEFAULT,
} from "./viem"

/**
 * Multichain wallet configuration and public client factory.
 *
 * - Default chain: Torus Mainnet
 * - Use getPublicClient(chainId?) to retrieve a cached PublicClient per chain.
 * - Use getDefaultPublicClient() for the default Torus client.
 * - Legacy export `publicClient` is deprecated; migrate to the functions above.
 */

// Re-export chain definitions for backward compatibility
export {
  torusMainnet,
  amoyTestnet,
  titanAITestnet,
  somniaTestnet,
  CHAIN_MAP,
  CHAINS,
  CHAIN_DEFAULT,
  getChain,
  getDefaultChain,
}

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
