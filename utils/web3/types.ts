import type { 
  Address, 
  Chain, 
  PublicClient, 
  WalletClient, 
  TransactionReceipt,
  Hash
} from "viem"

// Transaction result with receipt callback
export interface TransactionResult {
  txHash: Hash
  wait: () => Promise<TransactionReceipt>
}

// Extended transaction options
export interface TransactionOptions {
  confirmations?: number
  timeoutMs?: number
  maxRetries?: number
  gasMultiplier?: number
}

// Token information
export interface TokenInfo {
  address: Address
  symbol: string
  name: string
  decimals: number
}

// Chain with custom properties
export interface ExtendedChain extends Chain {
  custom?: {
    maxRPS?: number
    tokens?: Record<string, TokenInfo>
  }
}

// Error types
export class Web3Error extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = "Web3Error"
  }
}

export class TransactionError extends Web3Error {
  constructor(
    message: string,
    public readonly txHash?: Hash,
    details?: unknown
  ) {
    super(message, "TRANSACTION_ERROR", details)
    this.name = "TransactionError"
  }
}

export class ChainError extends Web3Error {
  constructor(
    message: string,
    public readonly chainId?: number,
    details?: unknown
  ) {
    super(message, "CHAIN_ERROR", details)
    this.name = "ChainError"
  }
}
