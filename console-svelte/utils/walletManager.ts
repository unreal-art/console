import { Keypair } from "@solana/web3.js";
import * as bs58 from "bs58";
import * as bip39 from "bip39";
import nacl from "tweetnacl";
import { Buffer } from "buffer"; // Import the Buffer polyfill
globalThis.Buffer = Buffer;

export async function generateKeyPair(phrase: string = ""): Promise<{
	publicAddress: string;
	privateAddress: string;
	mnemonic: string;
}> {
	// Generate a random mnemonic (seed phrase)
	const mnemonic: string = phrase.length > 0 ? phrase : bip39.generateMnemonic();

	// Convert the mnemonic to a seed
	const seedBuffer = await bip39.mnemonicToSeed(mnemonic);

	// Convert the seed buffer to a Uint8Array
	const seed: Uint8Array = new Uint8Array(seedBuffer);

	// Derive a keypair from the seed using tweetnacl
	const tempKeypair: nacl.SignKeyPair = nacl.sign.keyPair.fromSeed(seed.slice(0, 32));

	// Convert to Solana Keypair format
	const keyPair: Keypair = Keypair.fromSecretKey(tempKeypair.secretKey);

	const wallet = {
		publicAddress: keyPair.publicKey.toBase58(),
		privateAddress: bs58.encode(Uint8Array.from(keyPair.secretKey)),
		mnemonic,
	};
	return wallet;
}
