<script lang="ts">
	import ToolTip from "./ToolTip.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import {
		CloudDownload,
		Eye,
		Pencil,
		Trash2,
		ScanSearch,
		Pen,
		Swords,
		Search,
		X,
	} from "lucide-svelte";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { type IProofs, ProofStore } from "$stores/proofStores";
	import { goto } from "$app/navigation";
	import {
		CirclePlus,
		Cloud,
		EllipsisVertical,
		Github,
		LifeBuoy,
		LogOut,
		Mail,
		Maximize2,
		MessageSquare,
		Settings,
		UserPlus,
	} from "lucide-svelte";

	import MintNftIcon from "./mint-nft-icon.webp";

	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";

	type _IProps = {
		curAppProviderId: string;
	};

	let { curAppProviderId }: _IProps = $props();

	// let curList: IProofs[] = $derived(
	// 	$ProofStore
	// 		.filter((proof: IProofs) => proof.providerId === curAppProviderId)
	// 		.sort((a: IProofs, b: IProofs) => new Date(b.date).getTime() - new Date(a.date).getTime()),
	// );

	let open = $state(false);
	let labelName = $state("");
	let searchValue = $state("");
	let searchToggle = $state(false);

	let curList = $derived(
		searchValue.length == 0
			? $ProofStore
					.filter((proof: IProofs) => proof.providerId === curAppProviderId)
					.sort((a: IProofs, b: IProofs) => new Date(b.date).getTime() - new Date(a.date).getTime())
			: $ProofStore
					.filter((item: IProofs) => new RegExp(searchValue.trim(), "i").test(item.label))
					.filter((proof: IProofs) => proof.providerId === curAppProviderId)
					.sort(
						(a: IProofs, b: IProofs) => new Date(b.date).getTime() - new Date(a.date).getTime(),
					),
	);

	const deleteProof = (id: string | number) => {
		ProofStore.deleteProof(id);
	};

	const saveLabel = (id: string | number) => {
		if (labelName.trim().length == 0) return;
		let dataToUpdate = $ProofStore.find((data: IProofs) => data.id === id);
		if (dataToUpdate) {
			dataToUpdate.label = labelName;
			// Update properties of the found label
			ProofStore.updateProof(id, dataToUpdate);
		}
		open = false;
	};

	const formatDate = (date: Date) => {
		const currentDate = new Date(date);

		// Get the month, day, and year components from the Date object
		const month = currentDate.getMonth() + 1; // Month is zero-based, so add 1
		const day = currentDate.getDate();
		const year = currentDate.getFullYear();

		return `${month}/${day}/${year}`;
	};

	//proof download
	const downloadProof = (proof: IProofs) => {
		console.log("🚀 ~ downloadProof ~ proof:", proof);
		const data = JSON.stringify(proof.data, null, 2); // Pretty-print with 2 spaces
		// Create Blob from data
		const blob = new Blob([data], { type: "application/json" });

		//Download the Blob
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = proof.label;

		// Append the link to the document body and click it to trigger the download
		document.body.appendChild(link);
		link.click();

		// Clean up the DOM
		document.body.removeChild(link);
		URL.revokeObjectURL(url); // Release the object URL
	};
</script>

{#if !searchToggle}
	<div class="flex h-[15%] justify-between pl-3 pr-5">
		<h2 class="flex items-center font-semibold">Manage</h2>
		<Search onclick={() => (searchToggle = true)} size={15} class="cursor-pointer font-semibold" />
	</div>
{/if}
{#if searchToggle}
	<div class="flex h-[15%] items-center justify-between px-2">
		<form class="block h-full w-full items-center">
			<div class="relative flex h-full w-full items-center">
				<input
					placeholder="Search..."
					type="text"
					oninput={(e) => (searchValue = e.currentTarget.value)}
					class="w-full rounded-full bg-background py-2 pl-2 pr-8 text-sm outline-none focus:outline-none"
				/>
				<X
					onclick={() => {
						searchToggle = false;
						searchValue = "";
					}}
					size={14}
					class="absolute right-4 top-0 flex h-full cursor-pointer items-center font-semibold"
				/>
			</div>
		</form>
	</div>
{/if}

{#if curList.length > 0}
	<section class="h-[85%] overflow-y-auto">
		{#each curList as proof}
			<div
				class=" flex min-h-16 w-full items-center justify-between rounded-none border-none px-1 shadow-none hover:bg-background"
			>
				<div class="flex w-full flex-col text-sm font-semibold">
					<p class="pl-2 text-xs text-gray-500">{formatDate(proof.date)}</p>
					<div class="flex w-full items-center justify-between">
						<ToolTip tip={proof.label} class="">
							<form
								onsubmit={(e) => {
									saveLabel(proof.id);
									e.currentTarget.querySelectorAll("input")[0].readOnly = true;
								}}
								class="h-full"
							>
								<input
									type="text"
									value={proof.label.trim()}
									maxlength="21"
									onblur={(e) => {
										saveLabel(proof.id);
										e.currentTarget.readOnly = true;
									}}
									onchange={(e) => {
										labelName = e.currentTarget.value;
									}}
									readOnly={true}
									onclick={(e) => {
										e.currentTarget.readOnly = false;
									}}
									ondblclick={(e) => {
										goto(`/proof/view/${proof.id}`);
									}}
									class="h-full cursor-pointer bg-transparent px-2 outline-none focus:border-none focus:outline-none focus:ring-0"
								/>
							</form>
							<!-- <Dialog.Root bind:open>
								<Dialog.Trigger class="h-full justify-start border-none shadow-none">
									<button
										onclick={() => {
											// document.getElementById("name")?.focus();
											labelName = proof.label;
										}}
										class="h-full text-nowrap border-none px-2 text-start shadow-none"
										id="proofLabel">{proof.label.trim()}</button
									></Dialog.Trigger
								>
								<Dialog.Content class="sm:max-w-[425px]">
									<Dialog.Header>
										<Dialog.Title>{proof.label}</Dialog.Title>
									</Dialog.Header>
									<div class="w-full gap-4 py-4">
										<div class="w-full">
											<Input
												id="name"
												value={labelName}
												maxlength={20}
												onchange={(e) => {
													labelName = e.currentTarget.value;
												}}
												placeholder="Enter label name"
											/>
										</div>
									</div>
									<Dialog.Footer>
										<button
											type="submit"
											onclick={() => saveLabel(proof.id)}
											class="border-none text-white">Save</button
										>
									</Dialog.Footer>
								</Dialog.Content>
							</Dialog.Root> -->
						</ToolTip>

						<div class="flex items-center gap-0 font-semibold">
							<Dialog.Root bind:open>
								<Dialog.Content class="sm:max-w-[425px]">
									<Dialog.Header>
										<Dialog.Title>Edit Proof Label</Dialog.Title>
									</Dialog.Header>
									<div class="w-full gap-4 py-4">
										<div class="w-full">
											<Input
												id="name"
												value={labelName}
												maxlength={20}
												onchange={(e) => {
													labelName = e.currentTarget.value;
												}}
												placeholder="Enter label name"
											/>
										</div>
									</div>
									<Dialog.Footer>
										<button
											type="submit"
											onclick={() => saveLabel(proof.id)}
											class=" h-10 text-white">Save</button
										>
									</Dialog.Footer>
								</Dialog.Content>
							</Dialog.Root>

							<ToolTip tip="Verify Proof">
								<button class="manage-proof-icon" onclick={() => goto(`/proof/verify/${proof.id}`)}
									><ScanSearch /></button
								>
							</ToolTip>

							<ToolTip tip="Mint Proof on Solana">
								<Button
									class="h-full w-fit border-none bg-transparent p-2 text-lg shadow-none hover:bg-secondary"
									variant="outline"
									href="/proof/mint/{proof.id}"
								>
									<Swords />
									<!-- <img src={MintNftIcon} alt="mint-nft-icon" class="h-4 w-4" /> -->
								</Button>
							</ToolTip>

							<DropdownMenu.Root>
								<DropdownMenu.Trigger asChild let:builder class="h-full pb-2">
									<Button
										builders={[builder]}
										variant="outline"
										class="h-full w-fit border-none bg-transparent p-2 text-lg shadow-none hover:bg-secondary"
									>
										<EllipsisVertical class="  cursor-pointer" />
									</Button>
								</DropdownMenu.Trigger>
								<DropdownMenu.Content class="w-56">
									<DropdownMenu.Label>Controls</DropdownMenu.Label>
									<DropdownMenu.Separator />
									<DropdownMenu.Group>
										<DropdownMenu.Item
											class="cursor-pointer hover:bg-secondary"
											onclick={() => {
												labelName = proof.label;
												open = true;
											}}
										>
											<Pencil class="mr-2 h-4 w-4" />
											<span>Edit Label</span>
										</DropdownMenu.Item>

										<a href={`/proof/view/${proof.id}`}
											><DropdownMenu.Item class="cursor-pointer hover:bg-secondary">
												<Eye class="mr-2 h-4 w-4" />
												<span>View Proof</span>
											</DropdownMenu.Item></a
										>
									</DropdownMenu.Group>

									<DropdownMenu.Item
										class="cursor-pointer hover:bg-secondary"
										onclick={() => downloadProof(proof)}
									>
										<CloudDownload class="mr-2 h-4 w-4" /> Download Proof
									</DropdownMenu.Item>

									<DropdownMenu.Separator />
									<DropdownMenu.Item
										class="cursor-pointer hover:bg-secondary"
										onclick={() => deleteProof(proof.id)}
									>
										<Trash2 class="mr-2 h-4 w-4" /> Delete Proof
									</DropdownMenu.Item>
								</DropdownMenu.Content>
							</DropdownMenu.Root>
						</div>
					</div>
				</div>
			</div>
		{/each}
	</section>
{:else if searchToggle}
	<p class="text-center text-sm">No matching proof found...</p>
{:else}
	<p class="text-center text-sm">No proof under this provider...</p>
{/if}

<style lang="css">
	.manage-proof-icon {
		@apply text-lg;
		@apply lg:text-2xl;
		@apply flex items-center rounded-md  border-none border-gray-600 bg-transparent p-2  ring-0 hover:ring-0 dark:text-white lg:px-4;
	}

	#proofLabel {
		@apply lg:text-2xl;
	}
</style>
