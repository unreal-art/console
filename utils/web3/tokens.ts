import { 
  type Address,
  type WalletClient,
  type PublicClient,
  erc20Abi,
  formatUnits,
  parseUnits
} from "viem"
import { unrealTokenAbi } from "@/abis/unrealToken"
import { getPublicClient, getDefaultPublicClient } from "./clients"
import { getUnrealTokenAddress } from "./chains"
import { 
  createTransactionResult,
  executeWithRetry,
  getGasPrices,
  type TransactionResult,
  type TransactionOptions
} from "./transactions"
import { TransactionError } from "./types"

/**
 * Read ERC-20 token balance
 */
export async function getTokenBalance(
  tokenAddress: Address,
  accountAddress: Address,
  chainId?: number
): Promise<bigint> {
  const client = getPublicClient(chainId)
  
  return await executeWithRetry(async () => {
    const balance = await client.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [accountAddress],
    })
    return balance as bigint
  })
}

/**
 * Read ERC-20 allowance
 */
export async function getTokenAllowance(
  tokenAddress: Address,
  owner: Address,
  spender: Address,
  chainId?: number
): Promise<bigint> {
  const client = getPublicClient(chainId)
  
  return await executeWithRetry(async () => {
    const allowance = await client.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "allowance",
      args: [owner, spender],
    })
    return allowance as bigint
  })
}

/**
 * Get Unreal token balance for a specific chain
 */
export async function getUnrealBalance(
  accountAddress: Address,
  chainId?: number
): Promise<bigint> {
  const tokenAddress = getUnrealTokenAddress(chainId ?? 8192)
  return getTokenBalance(tokenAddress, accountAddress, chainId)
}

/**
 * Get Unreal token allowance for a specific chain
 */
export async function getUnrealAllowance(
  owner: Address,
  spender: Address,
  chainId?: number
): Promise<bigint> {
  const tokenAddress = getUnrealTokenAddress(chainId ?? 8192)
  return getTokenAllowance(tokenAddress, owner, spender, chainId)
}

/**
 * Approve ERC-20 token spending
 */
export async function approveToken(
  tokenAddress: Address,
  spender: Address,
  amount: bigint,
  wallet: WalletClient,
  options?: TransactionOptions
): Promise<TransactionResult> {
  if (!wallet.account) {
    throw new TransactionError("Wallet account is required for approval")
  }
  
  const chainId = wallet.chain?.id
  const gasPrices = await getGasPrices(chainId)
  
  const txHash = await executeWithRetry(async () => {
    return await wallet.writeContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "approve",
      args: [spender, amount],
      account: wallet.account!,
      chain: wallet.chain,
      ...gasPrices,
    })
  })
  
  return createTransactionResult(txHash, { ...options, chainId })
}

/**
 * Transfer ERC-20 tokens
 */
export async function transferToken(
  tokenAddress: Address,
  to: Address,
  amount: bigint,
  wallet: WalletClient,
  options?: TransactionOptions
): Promise<TransactionResult> {
  if (!wallet.account) {
    throw new TransactionError("Wallet account is required for transfer")
  }
  
  const chainId = wallet.chain?.id
  const gasPrices = await getGasPrices(chainId)
  
  const txHash = await executeWithRetry(async () => {
    return await wallet.writeContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "transfer",
      args: [to, amount],
      account: wallet.account!,
      chain: wallet.chain,
      ...gasPrices,
    })
  })
  
  return createTransactionResult(txHash, { ...options, chainId })
}

/**
 * Transfer Unreal tokens
 */
export async function transferUnrealToken(
  to: Address,
  amount: bigint,
  wallet: WalletClient,
  options?: TransactionOptions
): Promise<TransactionResult> {
  const chainId = wallet.chain?.id ?? 8192
  const tokenAddress = getUnrealTokenAddress(chainId)
  return transferToken(tokenAddress, to, amount, wallet, options)
}

/**
 * Transfer tokens using transferFrom (requires prior approval)
 */
export async function transferTokenFrom(
  tokenAddress: Address,
  from: Address,
  to: Address,
  amount: bigint,
  wallet: WalletClient,
  options?: TransactionOptions
): Promise<TransactionResult> {
  if (!wallet.account) {
    throw new TransactionError("Wallet account is required for transferFrom")
  }
  
  const chainId = wallet.chain?.id
  const gasPrices = await getGasPrices(chainId)
  
  const txHash = await executeWithRetry(async () => {
    return await wallet.writeContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "transferFrom",
      args: [from, to, amount],
      account: wallet.account!,
      chain: wallet.chain,
      ...gasPrices,
    })
  })
  
  return createTransactionResult(txHash, { ...options, chainId })
}

/**
 * Transfer Unreal tokens using transferFrom
 */
export async function transferUnrealTokenFrom(
  from: Address,
  to: Address,
  amount: bigint,
  wallet: WalletClient,
  options?: TransactionOptions
): Promise<TransactionResult> {
  const chainId = wallet.chain?.id ?? 8192
  const tokenAddress = getUnrealTokenAddress(chainId)
  return transferTokenFrom(tokenAddress, from, to, amount, wallet, options)
}

/**
 * Burn Unreal tokens
 */
export async function burnUnrealToken(
  burnAddress: Address,
  amount: bigint,
  wallet: WalletClient,
  options?: TransactionOptions
): Promise<TransactionResult> {
  if (!wallet.account) {
    throw new TransactionError("Wallet account is required for burn operation")
  }
  
  const chainId = wallet.chain?.id ?? 8192
  const tokenAddress = getUnrealTokenAddress(chainId)
  const gasPrices = await getGasPrices(chainId)
  
  const txHash = await executeWithRetry(async () => {
    return await wallet.writeContract({
      address: tokenAddress,
      abi: unrealTokenAbi,
      functionName: "burn",
      args: [burnAddress, amount],
      account: wallet.account!,
      chain: wallet.chain,
      ...gasPrices,
    })
  })
  
  return createTransactionResult(txHash, { ...options, chainId })
}

/**
 * Format token amount for display
 */
export function formatTokenAmount(
  amount: bigint,
  decimals: number = 18,
  displayDecimals: number = 4
): string {
  const formatted = formatUnits(amount, decimals)
  const [whole, decimal] = formatted.split(".")
  
  if (!decimal) return whole
  
  const truncated = decimal.slice(0, displayDecimals)
  return `${whole}.${truncated}`
}

/**
 * Parse token amount from string
 */
export function parseTokenAmount(
  amount: string,
  decimals: number = 18
): bigint {
  return parseUnits(amount, decimals)
}
