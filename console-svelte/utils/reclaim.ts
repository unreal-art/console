import { Reclaim, type Proof } from "@reclaimprotocol/js-sdk";
import { ProofStore } from "$stores";
import { v4 as uuidv4 } from "uuid";
import { goto } from "$app/navigation";
import { getApp } from "@config/index";
import { RECLAIM_APP_ID, RECLAIM_APP_SECRET } from "@config/reclaim";

export type _IProofRequest = {
	url: URL;
	// reclaimClient: Reclaim
};

let reclaimClient = new Reclaim.ProofRequest(RECLAIM_APP_ID);

export async function generateProofRequest(
	providerId: string,
	wallet: string,
): Promise<_IProofRequest> {
	reclaimClient = new Reclaim.ProofRequest(RECLAIM_APP_ID);

	await reclaimClient.buildProofRequest(providerId);

	reclaimClient.setSignature(await reclaimClient.generateSignature(RECLAIM_APP_SECRET));

	const { requestUrl, statusUrl } = await reclaimClient.createVerificationRequest();
	console.log("requestUrl", requestUrl);
	console.log("statusUrl", statusUrl);

	// return new URL("https://google.com");
	return {
		url: new URL(requestUrl),
		// reclaimClient
	};
}

export async function createSession(providerId: string) {
	// TODO: migrate the callbacks to qr/page.svelte
	await reclaimClient.startSession({
		onSuccessCallback: (proofs) => {
			console.log("Verification success", proofs);
			const proofId = ProofStore.size(providerId) + 1;
			const proof = proofs[0];

			const app = getApp(providerId);

			// const appProviderId = //TODO: appProvidername in proof

			ProofStore.addProof({
				id: uuidv4(),
				label: `${app.name}-${proofId}`,
				date: new Date(),
				providerId,
				data: proof,
			});
			if (window.history.length > 1) {
				window.history.back();
			} else {
				goto("/dashboard");
			}
		},
		onFailureCallback: (error) => {
			console.error("Verification failed", error);
			// Your business logic here to handle the error
			console.error("error", error);
		},
	});
	console.log("reclaim session complete");
}

export async function verifyProof(proof: Proof): Promise<boolean> {
	console.debug("verifying proof", proof);
	const flag = await Reclaim.verifySignedProof(proof);
	console.debug({ flag });
	return flag;
}
