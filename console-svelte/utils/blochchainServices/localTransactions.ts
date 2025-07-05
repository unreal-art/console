import {
	Transaction,
	SystemProgram,
	LAMPORTS_PER_SOL,
	PublicKey,
	sendAndConfirmTransaction,
	clusterApiUrl,
	Connection,
	Keypair,
} from "@solana/web3.js";

import base58 from "bs58";
// The given base58 encoded public key string
const base58PublicKeyString = "CVv4s8H2GLtouSXASzRHzpmsfYrH7REcMefPvb3GMerV";

// Convert the base58 encoded string to a Solana PublicKey type
const solanaPublicKey = new PublicKey(base58PublicKeyString);

// Sample code for sending token from a user to another user.
export const sendTokenTransaction = (
	fromPubkey: PublicKey,
	toPubkey: PublicKey,
	senderKeypair: Keypair,
) => {
	let transaction = new Transaction();
	let connection = new Connection(clusterApiUrl("devnet"));

	transaction.add(
		SystemProgram.transfer({
			fromPubkey,
			toPubkey,
			lamports: LAMPORTS_PER_SOL,
		}),
	);

	sendAndConfirmTransaction(connection, transaction, [senderKeypair]);
};

// Request for airdrop
export const requestAirDrop = async (publicKey: PublicKey) => {
	let connection = new Connection(clusterApiUrl("devnet"));

	let airdropSignature = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL);

	// Confirm transaction using the new method with commitment level
	let latestBlockHash = await connection.getLatestBlockhash();

	await connection.confirmTransaction(
		{
			signature: airdropSignature,
			blockhash: latestBlockHash.blockhash,
			lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
		},
		"confirmed",
	);
};

// Main function
export const main = async () => {
	// Use the given public key
	let publicKey = solanaPublicKey;

	// Request airdrop
	await requestAirDrop(publicKey);

	console.log(`Airdrop requested for publicKey: ${publicKey.toBase58()}`);
};

// // Run the main function
// main().catch((err) => {
// 	console.error(err);
// });
