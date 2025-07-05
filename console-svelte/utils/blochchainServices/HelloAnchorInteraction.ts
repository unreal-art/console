import {
	Keypair,
	PublicKey,
	Connection,
	clusterApiUrl,
	SystemProgram,
	Transaction,
	sendAndConfirmTransaction,
} from "@solana/web3.js";
import { AnchorProvider, Program } from "@project-serum/anchor";
import { Buffer } from "buffer"; // Import buffer package
import bs58 from "bs58"; // Import base58 package
import idl from "./idl/hello_anchor_idl.json"; // Load your IDL file
import BN from "bn.js";
globalThis.Buffer = Buffer;

class HelloAnchorInteraction {
	private connection: Connection;
	private provider: AnchorProvider;
	private program: Program;
	private newAccountKeypair: Keypair;
	private walletKeypair: Keypair; // Store the wallet keypair

	constructor(privateKey: string, programId: string) {
		// Initialize connection to Solana cluster
		this.connection = new Connection(clusterApiUrl("devnet")); // Change as needed

		// Generate a new Keypair for the wallet from the private key
		this.walletKeypair = this.generateKeyPair(privateKey);

		// Initialize provider for Anchor
		this.provider = new AnchorProvider(
			this.connection,
			{
				publicKey: this.walletKeypair.publicKey,
				signTransaction: async (tx) => {
					tx.partialSign(this.walletKeypair);
					return tx;
				},
				signAllTransactions: async (txs) => {
					return txs.map((tx) => {
						tx.partialSign(this.walletKeypair);
						return tx;
					});
				},
			},
			AnchorProvider.defaultOptions(),
		);

		// Initialize program with the Program ID (public key of the smart contract)
		this.program = new Program(idl as any, new PublicKey(programId), this.provider);

		// Generate a new Keypair for the new account
		this.newAccountKeypair = Keypair.generate();
	}

	private generateKeyPair(privateKey: string): Keypair {
		return Keypair.fromSecretKey(bs58.decode(privateKey));
	}

	public async initializeAccount(data: number): Promise<void> {
		try {
			// Fetch a recent blockhash
			const { blockhash } = await this.connection.getRecentBlockhash();

			const tx = new Transaction().add(
				this.program.instruction.initialize(new BN(data), {
					accounts: {
						newAccount: this.newAccountKeypair.publicKey, // Public key of the new account
						signer: this.walletKeypair.publicKey, // Public key of the wallet calling the method
						systemProgram: SystemProgram.programId,
					},
				}),
			);

			// Set the recent blockhash in the transaction
			tx.recentBlockhash = blockhash;
			tx.feePayer = this.walletKeypair.publicKey;

			// Sign the transaction with both the new account keypair and the wallet keypair
			tx.sign(this.newAccountKeypair, this.walletKeypair);

			// Send the transaction
			const txSignature = await sendAndConfirmTransaction(this.connection, tx, [
				this.walletKeypair,
				this.newAccountKeypair,
			]);

			console.log("Initialize transaction signature", txSignature);
		} catch (err) {
			console.error("Error initializing account", err);
		}
	}

	// Example method to fetch the account data
	public async getAccountData(): Promise<void> {
		try {
			const account = await this.program.account.newAccount.fetch(this.newAccountKeypair.publicKey);
			console.log("Account data:", account.data.toString());
		} catch (err) {
			console.error("Error fetching account data", err);
			// keep fetching untill mined
			//TODO: replace with a hook in the page.
			this.getAccountData();
		}
	}

	// Run example interactions
	public async runInteraction(): Promise<void> {
		try {
			const data = 45; // Example data to initialize the account with
			await this.initializeAccount(data);
			console.log("Initialized account successfully");

			// Wait a bit to ensure the transaction is confirmed
			await this.waitTransactionConfirmation();

			// Now fetch and log the account data
			await this.getAccountData();
		} catch (err) {
			console.error("Error running interaction", err);
		}
	}

	private async waitTransactionConfirmation(): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, 5000)); // Adjust timeout as needed
	}
}

export default HelloAnchorInteraction;
