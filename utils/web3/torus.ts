import { PublicClient, TransactionReceipt } from "viem"
import Bluebird from "bluebird"

// gets: BlockTime in ms
export async function getAverageBlockTime(
  publicClient: PublicClient,
  blockCount: number = 30
): Promise<number> {
  const latestBlock = await publicClient.getBlock({ blockTag: "latest" })

  const fromBlockNumber = latestBlock.number - BigInt(blockCount)
  const fromBlock = await publicClient.getBlock({
    blockNumber: fromBlockNumber,
  })

  const timeDiff = latestBlock.timestamp - fromBlock.timestamp
  const average = timeDiff / BigInt(blockCount)

  console.log(`getAverageBlockTime()=${average}s`)

  return Math.ceil(Number(average) * 1e3 * 20)
}

// timeoutMs: to averageBlockTime
export async function waitForTransactionReceipt(
  client: PublicClient,
  txHash: `0x${string}`,
  confirmations?: number,
  timeoutMs?: number
): Promise<TransactionReceipt> {
  if (!timeoutMs) {
    timeoutMs = await getAverageBlockTime(client)
  }

  const receiptPromise = client.waitForTransactionReceipt({
    hash: txHash,
    confirmations: confirmations ?? 1,
    timeout: timeoutMs,
  })

  let receipt: TransactionReceipt | null = null

  try {
    receipt = await receiptPromise
    console.log(`(${txHash}) confirmed in block ${receipt.blockNumber}`)
  } catch (error) {
    console.error("timeout=", timeoutMs, "Error waiting for transaction receipt:", error)
    throw error
  }

  return receipt
}
