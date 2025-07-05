<script lang="ts">
	import { ChevronRight, Wallet } from "lucide-svelte";
	import * as Dialog from "$lib/components/ui/dialog";
	import Input from "../ui/input/input.svelte";
	import { toast } from "svelte-sonner";
	import bcrypt from "bcryptjs";
	import { CredentialStore, type ICredentials } from "$stores";

	let open = $state(false);
	let pwd = $state("");
	let correctPwd = $state(false);
	let shouldNotProceed = $derived(pwd.length == 0);
	let compared = $state(false);

	const comparePwd = () => {
		if (pwd.trim().length == 0) return;
		// Verifying the pwd
		bcrypt.compare(pwd, $CredentialStore.password, function (err, result) {
			compared = true;
			if (!err) {
				correctPwd = result;
				// toast.error("Invalid credential provided.");
			} else {
				toast.error("An error occured please try again later.");
			}
		});
	};

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText($CredentialStore.seed_phrase as string);
		} catch (error) {
			console.error("Unable to copy to clipboard:", error);
		}
		toast.success("Copied");
	}
</script>

<div class=" w-full">
	<Dialog.Root bind:open>
		<Dialog.Trigger
			onclick={() => {
				correctPwd = false;
				compared = false;
			}}
			class="w-full border-none shadow-none"
		>
			<div class="flex h-14 w-full cursor-pointer items-center border-b hover:bg-secondary">
				<div class="flex w-[15%] items-center justify-center text-xl">
					<Wallet size={25} />
				</div>

				<div class="flex w-[85%] items-center justify-between text-lg">
					<span>Export Wallet</span>
					<ChevronRight size={25} />
				</div>
			</div>
		</Dialog.Trigger>
		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				<Dialog.Title>Export Wallet</Dialog.Title>
			</Dialog.Header>

			{#if !correctPwd}
				<div class="flex w-full flex-col gap-4 py-4">
					<div class="w-full">
						<Input
							oninput={(e) => {
								pwd = e.currentTarget.value.trim();
							}}
							type="password"
							id="pwd"
							placeholder="Enter Password"
						/>
					</div>
					{#if !correctPwd && compared}
						<p class="w-full text-sm text-red-400">Incorrect password</p>
					{/if}
				</div>
			{:else}
				<div class="flex h-28 w-full rounded-md bg-secondary px-4 py-4">
					{$CredentialStore.seed_phrase}
				</div>
			{/if}
			<Dialog.Footer>
				{#if !correctPwd}
					<button
						disabled={shouldNotProceed}
						onclick={comparePwd}
						class=" h-10 px-3 text-white hover:ring-0">Proceed</button
					>
				{:else}
					<button onclick={copyToClipboard} class=" h-10 px-3 text-white hover:ring-0">Copy</button>
				{/if}
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
</div>
