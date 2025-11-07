import { type Chain } from "viem"
import { ChainError, type ExtendedChain } from "./types"
import {
  CHAIN_MAP,
  CHAINS,
  CHAIN_DEFAULT,
  torusMainnet,
  amoyTestnet,
  titanAITestnet,
  somniaTestnet,
} from "@/config/viem"

// Re-export chain definitions for backward compatibility
export {
  torusMainnet,
  amoyTestnet,
  titanAITestnet,
  somniaTestnet,
}

// Export all chains as array
export const SUPPORTED_CHAINS = CHAINS as ExtendedChain[]

// Default chain
export const DEFAULT_CHAIN = CHAIN_DEFAULT as ExtendedChain

/**
 * Get a chain configuration by ID
 */
export function getChainById(chainId: number): ExtendedChain {
  const chain = CHAIN_MAP.get(chainId)
  if (!chain) {
    throw new ChainError(`Unsupported chain ID: ${chainId}`, chainId)
  }
  return chain as ExtendedChain
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
