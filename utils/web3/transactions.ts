import {
  type PublicClient,
  type Hash,
  type TransactionReceipt,
  type WalletClient,
} from "viem"
import { getPublicClient, getAverageBlockTime } from "./clients"
import {
  TransactionError,
  type TransactionResult,
  type TransactionOptions,
} from "./types"

/**
 * Wait for a transaction with configurable options
 */
export async function waitForTransaction(
  txHash: Hash,
  options?: TransactionOptions & { chainId?: number }
): Promise<TransactionReceipt> {
  const client = getPublicClient(options?.chainId)
  const confirmations = options?.confirmations ?? 1
  const maxRetries = options?.maxRetries ?? 3

  // Get timeout based on block time if not provided
  let timeout = options?.timeoutMs
  if (!timeout) {
    const avgBlockTime = await getAverageBlockTime(options?.chainId)
    timeout = avgBlockTime * confirmations * 2 // 2x buffer
  }

  let lastError: unknown

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `Waiting for tx ${txHash} (attempt ${attempt}/${maxRetries})...`
      )

      const receipt = await client.waitForTransactionReceipt({
        hash: txHash,
        confirmations,
        timeout,
        onReplaced: (replacement) => {
          console.log(`Transaction replaced: ${replacement.transaction.hash}`)
        },
      })

      if (receipt.status === "reverted") {
        throw new TransactionError("Transaction reverted", txHash, { receipt })
      }

      console.log(`Transaction confirmed in block ${receipt.blockNumber}`)
      return receipt
    } catch (error) {
      lastError = error
      console.error(`Attempt ${attempt} failed:`, error)

      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
        console.log(`Retrying in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw new TransactionError(
    `Transaction failed after ${maxRetries} attempts`,
    txHash,
    lastError
  )
}

/**
 * Create a transaction result with wait callback
 */
export function createTransactionResult(
  txHash: Hash,
  options?: TransactionOptions & { chainId?: number }
): TransactionResult {
  return {
    txHash,
    wait: () => waitForTransaction(txHash, options),
  }
}

/**
 * Estimate gas with multiplier for safety margin
 */
export async function estimateGasWithBuffer(
  client: PublicClient,
  request: Parameters<PublicClient["estimateGas"]>[0],
  multiplier: number = 1.2
): Promise<bigint> {
  try {
    const estimated = await client.estimateGas(request)
    return BigInt(Math.ceil(Number(estimated) * multiplier))
  } catch (error) {
    console.error("Gas estimation failed:", error)
    // Return a reasonable default
    return 200000n
  }
}

/**
 * Get current gas prices with priority fee
 */
export async function getGasPrices(chainId?: number) {
  const client = getPublicClient(chainId)

  try {
    const block = await client.getBlock({ blockTag: "latest" })
    const baseFee = block.baseFeePerGas ?? 0n

    // Calculate priority fee (tip)
    const priorityFee =
      baseFee > 10n * 10n ** 9n
        ? 2n * 10n ** 9n // 2 gwei for high base fee
        : 1n * 10n ** 9n // 1 gwei for low base fee

    return {
      maxFeePerGas: baseFee * 2n + priorityFee,
      maxPriorityFeePerGas: priorityFee,
    }
  } catch (error) {
    console.error("Failed to get gas prices:", error)
    // Return defaults
    return {
      maxFeePerGas: 50n * 10n ** 9n, // 50 gwei
      maxPriorityFeePerGas: 2n * 10n ** 9n, // 2 gwei
    }
  }
}

/**
 * Execute a transaction with retry logic
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: unknown) {
      lastError = error
      console.error(
        `Attempt ${attempt} failed:`,
        error instanceof Error ? error.message : error
      )

      // Don't retry on certain errors
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      if (
        errorMessage.includes("rejected") ||
        errorMessage.includes("denied") ||
        errorMessage.includes("insufficient funds")
      ) {
        throw error
      }

      if (attempt < maxRetries) {
        const delay = retryDelay * attempt
        console.log(`Retrying in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}
