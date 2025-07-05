<script lang="ts">
	import { page } from "$app/stores";
	import { ProofStore } from "$stores";

	import Header from "$lib/components/custom/Header.svelte";
	import { scale } from "svelte/transition";
	import { goto } from "$app/navigation";
	import { verifyProof } from "@/utils/reclaim";

	import VerificationInProgress from "./verificationInProgress.png";
	import VerificationSuccess from "./verificationSuccess.png";
	import VerificationFailed from "./verificationFailed.png";
	import sleep from "@/utils/sleep";
	import { tick } from "svelte";
	import type { IProofs } from "$stores/proofStores";

	const proofId = $page.params.proofId;

	let proof: IProofs = $derived($ProofStore.filter((proof: IProofs) => proof.id === proofId)[0]);

	let proofValid: boolean = $state(false);

	let verifying: boolean = $state(true);

	const _verify = async () => {
		await sleep(1000);
		try {
			proofValid = await verifyProof(proof.data);
		} catch (e) {
			console.error("Verification Error" + e);
		}
		verifying = false;
	};
	$effect(() => {
		console.log({ proof, proofId });

		if (!proof) {
			throw Error("Failed to load proof : " + proofId);
		}
	});

	const _return = async () => {
		if (!verifying) {
			await sleep(4000);
			// await tick();
			goto("/dashboard");
		}
	};
</script>

<Header />

{#await _verify()}
	<section
		transition:scale={{ duration: 600 }}
		class="flex h-[92%] flex-col items-center justify-center gap-10 px-4"
	>
		<div class=" relative flex h-[300px] w-full items-center justify-center">
			<!-- <div class="absolute">
			<Spinner color="green" currentColor="white" currentFill="gray" />
		</div> -->
			<img src={VerificationInProgress} alt="proof-verification" />
		</div>

		<div>
			<h3 class="text-center text-lg font-semibold">Proof Verification in progress.</h3>
			<p class="text-center text-sm">This may take a few second...</p>
		</div>
	</section>
{/await}

<section
	transition:scale={{ duration: 600 }}
	class="flex h-[92%] flex-col items-center justify-center gap-10 px-4 py-4"
>
	<div class=" relative flex h-[300px] w-full items-center justify-center">
		{#if proofValid}
			<!-- <div class="absolute">
			<Spinner color="green" currentColor="white" currentFill="gray" />
		</div> -->
			<img src={VerificationSuccess} alt="proof-verification" class="max-h-full" />
		{:else}
			<img src={VerificationFailed} alt="proof-verification" class="max-h-full" />
		{/if}
	</div>

	<div>
		<h3 class="text-center text-lg font-semibold">Proof Verification Completed.</h3>
		<!-- <p class="text-center text-sm">Yo...</p> -->
	</div>
</section>

<!-- TODO: improve UX -->
{_return()}
