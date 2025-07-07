import type { PublicClient } from 'viem';

export async function waitForTransactionReceipt(
	client: PublicClient,
	txHash: `0x${string}`,
	confirmations?: number
) {
	const receipt = await client.waitForTransactionReceipt({
		hash: txHash,
		confirmations: confirmations ?? 1
	});
	return receipt;
}
