import { getPublicClient } from "../src/config/wallet"
import { UNREAL_AMOUNT } from "../src/config/unreal"
import { Address, TransactionReceipt, WalletClient } from "viem"
import { waitForTransactionReceipt } from "./torus"

const unrealAbi = [
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "burn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
]

export async function getUnrealAllowance(
  token: Address,
  owner: Address,
  spender: Address,
  publicClient = getPublicClient()
): Promise<bigint> {
  const allowance = await publicClient.readContract({
    address: token,
    abi: unrealAbi,
    functionName: "allowance",
    args: [owner, spender],
  })

  return allowance as bigint
}

export async function getUnrealBalance(
  token: Address,
  address: Address,
  publicClient = getPublicClient()
): Promise<bigint> {
  const balance = await publicClient.readContract({
    address: token,
    abi: unrealAbi,
    functionName: "balanceOf",
    args: [address],
  })

  return balance as bigint
}

export async function transferUnrealToken(
  token: Address,
  wallet: WalletClient,
  to: Address,
  amount: bigint,
  publicClient = getPublicClient()
): Promise<{ txHash: Address; cb: Promise<TransactionReceipt> }> {
  const txHash = await wallet.writeContract({
    address: token,
    abi: unrealAbi,
    functionName: "transfer",
    args: [to, amount],
    account: wallet.account!,
    chain: wallet.chain,
  })

  const cb = waitForTransactionReceipt(publicClient, txHash, 1)
  return { txHash, cb }
}

export async function transferFromUnrealToken(
  token: Address,
  wallet: WalletClient,
  from: Address,
  to: Address,
  amount: bigint,
  publicClient = getPublicClient()
): Promise<{ txHash: Address; cb: Promise<TransactionReceipt> }> {
  const txHash = await wallet.writeContract({
    address: token,
    abi: unrealAbi,
    functionName: "transferFrom",
    args: [from, to, amount],
    account: wallet.account!,
    chain: wallet.chain,
  })

  const cb = waitForTransactionReceipt(publicClient, txHash, 1)
  return { txHash, cb }
}

export async function burnUnrealToken(
  token: Address,
  wallet: WalletClient,
  amount: bigint,
  publicClient = getPublicClient()
): Promise<{ txHash: Address; cb: Promise<TransactionReceipt> }> {
  const txHash = await wallet.writeContract({
    address: token,
    abi: unrealAbi,
    functionName: "burn",
    args: [amount],
    account: wallet.account!,
    chain: wallet.chain,
  })

  const cb = waitForTransactionReceipt(publicClient, txHash, 1)
  return { txHash, cb }
}
