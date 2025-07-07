import { getAddress, type Address, type WalletClient } from "viem"
import { publicClient } from "@/config/wallet"

export interface PermitData {
  owner: Address
  spender: Address
  value: bigint
  nonce: bigint
  deadline: bigint
}

export async function getPermit({
  tokenAddress,
  owner,
  spender,
  value,
  deadline,
  signer,
  chainId,
}: {
  tokenAddress: Address
  owner: Address
  spender: Address
  value: bigint
  deadline: bigint
  signer: { address: Address; signTypedData: WalletClient["signTypedData"] }
  chainId: number
}): Promise<{ permit: any; permitSignature: `0x${string}` }> {
  // Fetch nonce from token
  const nonce: bigint = await publicClient.readContract({
    address: tokenAddress,
    abi: [
      {
        name: "nonces",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "owner", type: "address" }],
        outputs: [{ type: "uint256" }],
      },
    ],
    functionName: "nonces",
    args: [owner],
  })
  const name: string = await publicClient.readContract({
    address: tokenAddress,
    abi: [
      {
        name: "name",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ type: "string" }],
      },
    ],
    functionName: "name",
  })
  const domain = {
    name,
    version: "1",
    chainId,
    verifyingContract: tokenAddress,
  }
  const types = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  }

  const permitMessage = {
    owner: getAddress(owner),
    spender: getAddress(spender),
    value: value.toString(),
    nonce: nonce.toString(),
    deadline: deadline.toString(),
  }

  const permitSignature = await signer.signTypedData({
    account: signer.address,
    domain,
    types,
    primaryType: "Permit",
    message: permitMessage,
  })
  return { permit: permitMessage, permitSignature }
}
