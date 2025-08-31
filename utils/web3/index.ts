/**
 * Web3 Utilities
 * 
 * Comprehensive utilities for interacting with EVM blockchains
 * with support for multiple chains, ERC-20 tokens, and EIP-2612 permits.
 */

// Re-export all types
export * from "./types"

// Re-export chain utilities
export {
  // Chains
  torusMainnet,
  titanAITestnet,
  amoyTestnet,
  SUPPORTED_CHAINS,
  DEFAULT_CHAIN,
  
  // Chain helpers
  getChainById,
  isChainSupported,
  getUnrealTokenAddress,
  pickRandomRpc,
} from "./chains"

// Re-export client utilities
export {
  getPublicClient,
  getDefaultPublicClient,
  createWalletClientForChain,
  clearClientCaches,
  getAverageBlockTime,
} from "./clients"

// Re-export transaction utilities
export {
  waitForTransaction,
  createTransactionResult,
  estimateGasWithBuffer,
  getGasPrices,
  executeWithRetry,
} from "./transactions"

// Re-export token utilities
export {
  // Generic token functions
  getTokenBalance,
  getTokenAllowance,
  approveToken,
  transferToken,
  transferTokenFrom,
  
  // Unreal token specific
  getUnrealBalance,
  getUnrealAllowance,
  transferUnrealToken,
  transferUnrealTokenFrom,
  burnUnrealToken,
  
  // Formatting helpers
  formatTokenAmount,
  parseTokenAmount,
} from "./tokens"

// Re-export permit utilities
export {
  // Types
  type PermitData,
  type PermitSignature,
  
  // Functions
  parsePermitSignature,
  executePermit,
  executeUnrealPermit,
  getPermitNonce,
  createPermitDeadline,
  buildPermitMessage,
} from "./permits"
