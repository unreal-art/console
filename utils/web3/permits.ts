import {
  type Address,
  type WalletClient,
  parseSignature,
  type Hex
} from "viem"
import { getPublicClient } from "./clients"
import { getUnrealTokenAddress } from "./chains"
import {
  createTransactionResult,
  executeWithRetry,
  getGasPrices
} from "./transactions"
import {
  type TransactionResult,
  type TransactionOptions
} from "./types"
import { TransactionError } from "./types"

// EIP-2612 Permit ABI
const PERMIT_ABI = [
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
      { internalType: "uint8", name: "v", type: "uint8" },
      { internalType: "bytes32", name: "r", type: "bytes32" },
      { internalType: "bytes32", name: "s", type: "bytes32" },
    ],
    name: "permit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const

export interface PermitData {
  owner: Address
  spender: Address
  value: bigint
  nonce: bigint
  deadline: bigint
}

export interface PermitSignature {
  v: number
  r: Hex
  s: Hex
}

/**
 * Parse a permit signature
 */
export function parsePermitSignature(signature: Hex): PermitSignature {
  const { v, r, s } = parseSignature(signature)
  
  if (v === undefined) {
    throw new Error("Invalid signature: missing v value")
  }
  
  return { v: Number(v), r, s }
}

/**
 * Execute an EIP-2612 permit transaction
 */
export async function executePermit(
  tokenAddress: Address,
  permit: PermitData,
  signature: Hex,
  wallet: WalletClient,
  options?: TransactionOptions
): Promise<TransactionResult> {
  if (!wallet.account) {
    throw new TransactionError("Wallet account is required for permit execution")
  }
  
  const chainId = wallet.chain?.id
  const { v, r, s } = parsePermitSignature(signature)
  const gasPrices = await getGasPrices(chainId)
  
  console.log("Executing permit:", {
    owner: permit.owner,
    spender: permit.spender,
    value: permit.value.toString(),
    nonce: permit.nonce.toString(),
    deadline: permit.deadline.toString(),
    v,
    r,
    s,
  })
  
  const txHash = await executeWithRetry(async () => {
    return await wallet.writeContract({
      address: tokenAddress,
      abi: PERMIT_ABI,
      functionName: "permit",
      args: [
        permit.owner,
        permit.spender,
        permit.value,
        permit.deadline,
        v,
        r,
        s,
      ],
      account: wallet.account!,
      chain: wallet.chain,
      ...gasPrices,
    })
  })
  
  console.log(`Permit transaction submitted: ${txHash}`)
  
  return createTransactionResult(txHash, { ...options, chainId })
}

/**
 * Execute a permit for Unreal token
 */
export async function executeUnrealPermit(
  permit: PermitData,
  signature: Hex,
  wallet: WalletClient,
  options?: TransactionOptions
): Promise<TransactionResult> {
  const chainId = wallet.chain?.id ?? 8192
  const tokenAddress = getUnrealTokenAddress(chainId)
  return executePermit(tokenAddress, permit, signature, wallet, options)
}

/**
 * Get the current nonce for permit signatures
 */
export async function getPermitNonce(
  tokenAddress: Address,
  owner: Address,
  chainId?: number
): Promise<bigint> {
  const client = getPublicClient(chainId)
  
  try {
    const nonce = await client.readContract({
      address: tokenAddress,
      abi: [
        {
          inputs: [{ name: "owner", type: "address" }],
          name: "nonces",
          outputs: [{ name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function",
        },
      ],
      functionName: "nonces",
      args: [owner],
    })
    
    return nonce as bigint
  } catch (error) {
    console.error("Failed to get permit nonce:", error)
    return 0n
  }
}

/**
 * Create a deadline timestamp for permits
 */
export function createPermitDeadline(minutesFromNow: number = 30): bigint {
  const deadline = Math.floor(Date.now() / 1000) + (minutesFromNow * 60)
  return BigInt(deadline)
}

/**
 * Build permit message for signing
 */
export function buildPermitMessage(
  permit: PermitData,
  tokenName: string,
  tokenAddress: Address,
  chainId: number
) {
  return {
    domain: {
      name: tokenName,
      version: "1",
      chainId,
      verifyingContract: tokenAddress,
    },
    types: {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    },
    primaryType: "Permit" as const,
    message: {
      owner: permit.owner,
      spender: permit.spender,
      value: permit.value,
      nonce: permit.nonce,
      deadline: permit.deadline,
    },
  }
}
