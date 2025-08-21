import type { Address, PublicClient } from "viem"

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

// Read ERC20 balance using a provided viem PublicClient (dynamic per-chain)
export async function getErc20Balance(
  client: PublicClient,
  token: Address,
  address: Address
): Promise<bigint> {
  return (await client.readContract({
    address: token,
    abi: unrealTokenAbi,
    functionName: "balanceOf",
    args: [address],
  })) as bigint
}
