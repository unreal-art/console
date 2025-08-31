import { Account, Address, TransactionReceipt, WalletClient } from "viem"

import { UNREAL_AMOUNT } from "@config/unreal"
import { unrealTokenAbi } from "@abis/unrealToken"
import { getDefaultPublicClient, getPublicClient } from "@config/wallet"
import { waitForTransactionReceipt } from "./torus"

/**
 * Read ERC-20 allowance (owner -> spender).
 * Multichain: pass an optional PublicClient to target a specific chain; defaults to Torus via getDefaultPublicClient().
 */
export async function getUnrealAllowance(
  token: Address,
  owner: Address,
  spender: Address,
  publicClient = getDefaultPublicClient()
): Promise<bigint> {
  return (await publicClient.readContract({
    address: token,
    abi: unrealTokenAbi,
    functionName: "allowance",
    args: [owner, spender],
  })) as bigint
}

/**
 * Read ERC-20 balanceOf(address).
 * Multichain: optionally provide a PublicClient; defaults to Torus via getDefaultPublicClient().
 */
export async function getUnrealBalance(
  token: Address,
  address: Address,
  publicClient = getDefaultPublicClient()
): Promise<bigint> {
  return (await publicClient.readContract({
    address: token,
    abi: unrealTokenAbi,
    functionName: "balanceOf",
    args: [address],
  })) as bigint
}

/**
 * Execute ERC-20 transferFrom(from, to, amount) using a WalletClient.
 * Requires wallet.account; uses wallet.chain to select the target network.
 * Returns the transaction hash (fire-and-forget).
 */
export async function transferFromUnrealToken(
  token: Address,
  from: Address,
  to: Address,
  amount: bigint,
  wallet: WalletClient
): Promise<`0x${string}`> {
  // ERC20 transferFrom: from -> to
  if (!wallet.account) {
    throw new Error("Wallet account is required for transferFrom operation")
  }

  let txHash: string
  try {
    txHash = await wallet.writeContract({
      address: token,
      abi: unrealTokenAbi,
      functionName: "transferFrom",
      args: [from, to, amount],
      account: wallet.account,
      chain: wallet.chain,
      // Add high priority fee to ensure transaction is processed quickly
      // maxPriorityFeePerGas: 2_000_000_000n, // 2 Gwei
      // maxFeePerGas: 100_000_000_000n, // 100 Gwei max fee
    })
  } catch (err: any) {
    // Re-throw a simple error message that is safe to serialize across workers.
    const message = err?.message ?? "transferFrom failed"
    throw new Error(message)
  }

  // await publicClient.waitForTransactionReceipt({ hash: txHash })

  // fire-and-forget: do not wait for confirmation
  return txHash as `0x${string}`
}

/**
 * Execute ERC-20 transfer(to, amount) using a WalletClient.
 * Requires wallet.account; uses wallet.chain to select the target network.
 * Returns txHash and a cb promise that waits for 1 confirmation via the wallet's associated client.
 */
export async function transferUnrealToken(
  token: Address,
  wallet: WalletClient,
  to: Address,
  amount: bigint,
  publicClient = getDefaultPublicClient()
): Promise<{ txHash: Address; cb: Promise<TransactionReceipt> }> {
  if (!wallet.account) {
    throw new Error("Wallet account is required for transfer operation")
  }

  let txHash: Address
  try {
    txHash = await wallet.writeContract({
      address: token,
      abi: unrealTokenAbi,
      functionName: "transfer",
      args: [to, amount],
      account: wallet.account,
      chain: wallet.chain,
    })
  } catch (err: any) {
    // Re-throw a simple error message that is safe to serialize across workers.
    const message = err?.message ?? "transfer failed"
    throw new Error(message)
  }

  const cb = waitForTransactionReceipt(publicClient, txHash, 1)

  return { txHash, cb }
}

/**
 * Burn tokens via burn(address,uint256) using a WalletClient.
 * Requires wallet.account; uses wallet.chain to select the target network.
 */
export async function burnUnrealToken(
  token: Address,
  burnAddress: Address,
  amount: bigint,
  wallet: WalletClient
): Promise<string> {
  if (!wallet.account) {
    throw new Error("Wallet account is required for burn operation")
  }

  const txHash = await wallet.writeContract({
    address: token,
    abi: unrealTokenAbi,
    functionName: "burn",
    args: [burnAddress, amount],
    account: wallet.account,
    chain: wallet.chain,
  })

  // wait for confirmation (can be disabled for faster response)
  // await publicClient.waitForTransactionReceipt({ hash: txHash })

  return txHash
}
