import { Keypair, PublicKey, Connection, clusterApiUrl, SystemProgram } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet, type Idl } from "@project-serum/anchor";
import idl from "./idl/counter_idl.json"; // Load your IDL file

class SmartContractInteraction {
	private wallet: Wallet;
	private connection: Connection;
	private provider: AnchorProvider;
	private program: Program;
	private counterPublicKey: PublicKey;

	constructor(privateKey: string, counterPublicKeyString: string, programId: string) {
		// Initialize wallet
		this.wallet = new Wallet(this.generateKeyPair(privateKey));

		// Initialize connection to Solana cluster
		this.connection = new Connection(clusterApiUrl("devnet")); // Change as needed

		// Initialize provider for Anchor
		this.provider = new AnchorProvider(
			this.connection,
			this.wallet,
			AnchorProvider.defaultOptions(),
		);

		// Initialize program with the Program ID (public key of the smart contract)
		this.program = new Program(idl as Idl, new PublicKey(programId), this.provider);

		// Initialize counter public key (public key of the specific account managed by the smart contract)
		this.counterPublicKey = new PublicKey(counterPublicKeyString);
	}

	private generateKeyPair(privateKey: string): Keypair {
		const decodedPrivateKey = Buffer.from(privateKey, "base64");
		return Keypair.fromSecretKey(decodedPrivateKey);
	}

	public async initializeCounter(): Promise<void> {
		try {
			// Check if the counter account already exists
			const counterAccount = await this.program.account.counter.fetchNullable(
				this.counterPublicKey,
			);
			if (counterAccount) {
				console.log("Counter already initialized.");
				return;
			}

			// Initialize the counter account if needed
			const tx = await this.program.methods
				.initialize()
				.accounts({
					counter: this.counterPublicKey, // Specific account public key
					authority: this.wallet.publicKey, // Public key of the wallet calling the method
					systemProgram: SystemProgram.programId,
				})
				.rpc();

			console.log("Initialize transaction signature", tx);
		} catch (err) {
			console.error("Error initializing counter", err);
		}
	}

	public async incrementCounter(): Promise<void> {
		try {
			// Increment the counter
			const tx = await this.program.methods
				.increment()
				.accounts({
					counter: this.counterPublicKey, // Specific account public key
					authority: this.wallet.publicKey, // Public key of the wallet calling the method
				})
				.rpc();

			console.log("Increment transaction signature", tx);
		} catch (err) {
			console.error("Error incrementing counter", err);
		}
	}

	public async runInteraction(): Promise<void> {
		// Run the functions
		await this.initializeCounter();
		await this.incrementCounter();
	}
}

export default SmartContractInteraction;
