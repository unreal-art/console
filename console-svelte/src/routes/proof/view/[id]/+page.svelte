<script lang="ts">
	import { page } from "$app/stores";
	import Header from "$lib/components/custom/Header.svelte";
	import { ProofStore } from "$stores";
	import { JsonView } from "@zerodevx/svelte-json-view";
	import Button from "$lib/components/ui/button/button.svelte";
	import { ArrowLeft, Files } from "lucide-svelte";
	import { toast } from "svelte-sonner";


	import { IProofs } from '$stores/proofStores';

	let proof: IProofs = $derived(
		$ProofStore.filter((proof: IProofs) => proof.id === $page.params.id)[0],
	);
	let proofDataString: string = $derived(JSON.stringify(proof?.data));

	$effect(() => {
		if (proof) {
			console.log("🚀 ~ $effect ~ proof:", proof);
			console.log("proof.data.claimData", proof.data.claimData);
			console.log({ proofDataString });
		}
	});

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(proofDataString);
		} catch (error) {
			console.error("Unable to copy to clipboard:", error);
		}
		toast.success("Copied");
	}
</script>

<Header />

<section class="flex h-[92%] flex-col gap-10 px-4 pt-4">
	<div class="flex h-[5%] justify-between">
		<a class="block" href="/"
			><Button variant={"outline"} class="text-white shadow-none"
				><ArrowLeft size={20} />Back</Button
			></a
		>
		<Button variant={"outline"} class="text-white shadow-none" onclick={copyToClipboard}
			><Files size={20} />Copy</Button
		>
	</div>
	<div class="h-[95%] overflow-auto">
		{#if proof}
			<JsonView json={proof.data} depth={0} />
		{:else}
			<error>Proof not found</error>
		{/if}
	</div>
</section>
