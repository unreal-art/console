import type { Account, Address, WalletClient } from "viem"

import { UNREAL_AMOUNT } from "@/config/unreal"
import { unrealTokenAbi } from "@/abis/unrealToken"
import { publicClient } from "@/config/wallet"

export async function getUnrealAllowance(
  token: Address,
  owner: Address,
  spender: Address
): Promise<bigint> {
  return (await publicClient.readContract({
    address: token,
    abi: unrealTokenAbi,
    functionName: "allowance",
    args: [owner, spender],
  })) as bigint
}

export async function getUnrealBalance(
  token: Address,
  address: Address
): Promise<bigint> {
  return (await publicClient.readContract({
    address: token,
    abi: unrealTokenAbi,
    functionName: "balanceOf",
    args: [address],
  })) as bigint
}

export async function transferUnrealToken(
  token: Address,
  from: Address,
  to: Address,
  wallet: any
): Promise<string> {
  // ERC20 transferFrom: from -> to
  let txHash: string
  try {
    txHash = await wallet.writeContract({
      address: token,
      abi: unrealTokenAbi,
      functionName: "transferFrom",
      args: [from, to, UNREAL_AMOUNT],
      account: wallet.account,
    })
  } catch (err: any) {
    // Re-throw a simple error message that is safe to serialize across workers.
    const message = err?.message ?? "transferFrom failed"
    throw new Error(message)
  }

  // await publicClient.waitForTransactionReceipt({ hash: txHash })

  // fire-and-forget: do not wait for confirmation
  return txHash
}

export async function burnUnrealToken(
  token: Address,
  burnAddress: Address,
  wallet: any
): Promise<string> {
  const txHash = await wallet.writeContract({
    address: token,
    abi: unrealTokenAbi,
    functionName: "burn",
    args: [burnAddress, UNREAL_AMOUNT],
    account: wallet.account,
  })

  // wait for confirmation (can be disabled for faster response)
  // await publicClient.waitForTransactionReceipt({ hash: txHash })

  return txHash
}
