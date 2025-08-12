type PublicClientLike = {
  waitForTransactionReceipt: (args: {
    hash: `0x${string}`
    confirmations?: number
  }) => Promise<unknown>
}

export async function waitForTransactionReceipt(
  client: PublicClientLike,
  txHash: `0x${string}`,
  confirmations?: number
) {
  const receipt = await client.waitForTransactionReceipt({
    hash: txHash,
    confirmations: confirmations ?? 1,
  })
  return receipt
}
