/**
 * Migration helpers for transitioning from old utils to new web3 utilities
 * 
 * This file provides compatibility wrappers to ease the migration process.
 * These should be considered DEPRECATED and replaced with direct imports
 * from the new web3 modules.
 */

import { type Address, type WalletClient, type PublicClient, type TransactionReceipt } from "viem"
import {
  getUnrealBalance as newGetUnrealBalance,
  getUnrealAllowance as newGetUnrealAllowance,
  transferUnrealToken as newTransferUnrealToken,
  transferUnrealTokenFrom as newTransferUnrealTokenFrom,
  burnUnrealToken as newBurnUnrealToken,
} from "./tokens"
import { waitForTransaction } from "./transactions"
import { executePermit as newExecutePermit, type PermitData } from "./permits"
import { getDefaultPublicClient, getPublicClient } from "./clients"

/**
 * @deprecated Use getUnrealBalance from web3/tokens
 */
export async function getUnrealBalance(
  token: Address,
  address: Address,
  publicClient = getDefaultPublicClient()
): Promise<bigint> {
  // Extract chainId from client if available
  const chainId = publicClient.chain?.id
  return newGetUnrealBalance(address, chainId)
}

/**
 * @deprecated Use getUnrealAllowance from web3/tokens
 */
export async function getUnrealAllowance(
  token: Address,
  owner: Address,
  spender: Address,
  publicClient = getDefaultPublicClient()
): Promise<bigint> {
  const chainId = publicClient.chain?.id
  return newGetUnrealAllowance(owner, spender, chainId)
}

/**
 * @deprecated Use transferUnrealToken from web3/tokens
 */
export async function transferUnrealToken(
  token: Address,
  wallet: WalletClient,
  to: Address,
  amount: bigint,
  publicClient = getDefaultPublicClient()
): Promise<{ txHash: Address; cb: Promise<TransactionReceipt> }> {
  const result = await newTransferUnrealToken(to, amount, wallet)
  return {
    txHash: result.txHash as Address,
    cb: result.wait() as Promise<TransactionReceipt>
  }
}

/**
 * @deprecated Use transferUnrealTokenFrom from web3/tokens
 */
export async function transferFromUnrealToken(
  token: Address,
  from: Address,
  to: Address,
  amount: bigint,
  wallet: WalletClient
): Promise<`0x${string}`> {
  const result = await newTransferUnrealTokenFrom(from, to, amount, wallet)
  return result.txHash
}

/**
 * @deprecated Use burnUnrealToken from web3/tokens
 */
export async function burnUnrealToken(
  token: Address,
  burnAddress: Address,
  amount: bigint,
  wallet: WalletClient
): Promise<string> {
  const result = await newBurnUnrealToken(burnAddress, amount, wallet)
  return result.txHash
}

/**
 * @deprecated Use waitForTransaction from web3/transactions
 */
export async function waitForTransactionReceipt(
  client: PublicClient,
  txHash: `0x${string}`,
  confirmations?: number,
  timeoutMs?: number
) {
  return waitForTransaction(txHash, {
    chainId: client.chain?.id,
    confirmations,
    timeoutMs
  })
}

/**
 * @deprecated Use executePermit from web3/permits
 */
export async function executePermit(
  token: Address,
  permit: PermitData,
  permitSignature: `0x${string}`,
  wallet: WalletClient,
  publicClient: PublicClient,
  confirmationWait?: number
) {
  const result = await newExecutePermit(token, permit, permitSignature, wallet, {
    timeoutMs: confirmationWait
  })
  
  return {
    txHash: result.txHash,
    cb: result.wait()
  }
}
