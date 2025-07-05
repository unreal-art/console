import HelloAnchorInteraction from "@utils/blochchainServices/HelloAnchorInteraction";
import { PUBLIC_PROGRAM_ID } from "$env/static/public";

export async function initialize(privateKey: string, publicKey: string) {
	const programId = PUBLIC_PROGRAM_ID;
	console.log(PUBLIC_PROGRAM_ID);
	console.log(privateKey, publicKey);
	//get air drop
	//await requestAirDrop(new PublicKey(publicKey));
	const interaction = new HelloAnchorInteraction(privateKey, programId);
	// Run the interaction (initialize and fetch account data)
	await interaction.runInteraction();
}
