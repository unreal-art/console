<script lang="ts">
	import { ZAuthLogo } from "@config/zauth";
	// import SetupSvg from "./setup.svg";
	// import CheckPng from "./check.png";

	import type { IWallet } from "./+layout.ts";
	import { goto } from "$app/navigation";
	import { scale } from "svelte/transition";
	import Button from "$lib/components/ui/button/button.svelte";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Check } from "lucide-svelte";
	import { generateKeyPair } from "@utils/walletManager";
	import { toast } from "svelte-sonner";
	import bcrypt from "bcryptjs";
	import { CredentialStore, type ICredentials } from "$stores";
	import { AuthStore } from "$stores/authStore";

	import { Textarea } from "$lib/components/ui/textarea/index.js";

	let frame = $state<number>(1);
	let wallet = $state<IWallet>();
	let pwd = $state("");
	let skipFive = $state(false);
	let phrase = $state("");
	let containsSpecialChar = $derived(/[^a-zA-Z0-9]/.test(pwd));
	let containsUpperChar = $derived(/[A-Z]/.test(pwd));
	let containsMinFiveChar = $derived(pwd.length >= 5);
	let containsNumber = $derived(/\d/.test(pwd));
	let containsLowerChar = $derived(/[a-z]/.test(pwd));
	let notReadyCreatePwd = $derived(!containsMinFiveChar ? true : false);
	let notReadyImportWallet = $derived(phrase.length == 0 ? true : false);
	let strength = $state(0);

	// import SetupSvg from "@static/setup.svg";
	// import CheckPng from "@static/check.png";
	const SetupSvg = "/setup.svg";
	const CheckPng = "/check.png";

	const setStrength = () => {
		if (
			containsMinFiveChar &&
			containsLowerChar &&
			containsUpperChar &&
			containsNumber &&
			containsSpecialChar
		) {
			strength = 3;
		} else if (containsMinFiveChar && containsLowerChar && containsUpperChar) {
			strength = 2;
		} else if (
			containsMinFiveChar ||
			containsLowerChar ||
			containsUpperChar ||
			containsNumber ||
			containsSpecialChar
		) {
			strength = 1;
		} else {
			strength = 0;
		}
	};

	const makeKeyPair = async () => {
		const userwallet: IWallet = await generateKeyPair();
		wallet = userwallet;
		frame = 4;
	};

	const importWallet = async () => {
		// if (notReadyImportWallet) return;
		const userwallet: IWallet = await generateKeyPair(phrase);
		wallet = userwallet;
		frame = 4;
		skipFive = true;
	};

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(wallet?.mnemonic as string);
		} catch (error) {
			console.error("Unable to copy to clipboard:", error);
		}
		toast.success("Copied");
	}

	const savePassword = () => {
		const saltRounds = 10;
		const credentials: ICredentials = $CredentialStore;
		bcrypt.hash(pwd, saltRounds, function (err, hash) {
			if (err) throw err;
			// Store hash in your pwd database.
			console.log("Hashed pwd:", hash);

			// Verifying the pwd
			bcrypt.compare(pwd, hash, function (err, result) {
				if (err) throw err;
				console.log("Password matches:", result); // true
			});
			credentials.password = hash;
			credentials.public_key = wallet?.publicAddress;
			credentials.private_key = wallet?.privateAddress;
			credentials.seed_phrase = wallet?.mnemonic;
			credentials.onboarding_time = new Date();
			$CredentialStore = credentials;
			AuthStore.updateAuth({
				isAuthenticated: true,
			});

			frame = skipFive ? 6 : 5;
		});
	};
</script>

{#if frame === 1}
	<section
		transition:scale={{ duration: 300 }}
		class="flex h-full flex-col items-center gap-10 px-4 pt-10"
	>
		<div class="flex h-[50%] w-full flex-col items-center justify-center">
			<img src={ZAuthLogo} alt="logo" class="" />
			<p class="text-6xl font-bold">ZAuth</p>
		</div>

		<div class="flex h-[50%] w-full flex-col items-center justify-center gap-3">
			<p class="text-xs">
				ZAuth is a secure ZKproof manager, putting user data in the hands of the user.
			</p>
			<Button
				onclick={() => (frame = 2)}
				class="h-14 w-full border-none text-lg text-white"
				data-testid="get-started">Get Started</Button
			>
		</div>
	</section>
{:else if frame === 2}
	<section
		transition:scale={{ duration: 300 }}
		class="flex h-full flex-col items-center gap-10 px-4 pt-10"
	>
		<div class="flex h-[50%] w-full flex-col items-center justify-center">
			<img src={SetupSvg} alt="Setup" class="" />
			<!-- <p class="text-2xl font-bold">Set up your Wallet</p> -->
		</div>
		<div class="flex w-full flex-col items-center justify-center gap-3">
			<!-- <ToolTip
				tip="With this wallet , you can secure your proofs and prevent unpermitted usage for your generated proofs."
			> -->
			<Button onclick={makeKeyPair} class="h-14 w-full border-none text-lg text-white"
				>Create Wallet</Button
			>
			<!-- </ToolTip> -->
			<Button
				class="h-14 w-full border-none text-lg text-white"
				data-testid="import-wallet"
				onclick={() => (frame = 3)}>Import Wallet</Button
			>
		</div>
	</section>
{:else if frame === 3}
	<section
		transition:scale={{ duration: 300 }}
		class="flex h-full flex-col items-center gap-10 px-4 pt-10"
	>
		<form onsubmit={importWallet} class="block h-[70%]">
			<div class="flex w-full flex-col items-center justify-center gap-6">
				<h3 class="text-2xl font-bold">Import your wallet</h3>
				<p class="text-center text-sm">The phrase entered will be used to generate your wallet.</p>
				<div class="flex w-full flex-col gap-5">
					<Textarea
						oninput={(e) => {
							phrase = e.currentTarget.value.trim();
						}}
						placeholder="Type your secret phrase here."
						class="h-44 w-full resize-none rounded-md bg-secondary px-3 outline-none
						 focus:border-none focus:outline-none focus:ring-0"
					/>
				</div>
			</div>

			<div class="flex h-[30%] w-full justify-center pt-5">
				<Button
					type="submit"
					disabled={notReadyImportWallet}
					data-testid="import-wallet-submit"
					class="h-14 w-full border-none text-lg text-white">Import Wallet</Button
				>
			</div>
		</form>
	</section>
{:else if frame === 4}
	<section
		transition:scale={{ duration: 300 }}
		class="flex h-full flex-col items-center gap-10 px-4 pt-10"
	>
		<form onsubmit={savePassword} class="block h-[70%]">
			<div class="flex w-full flex-col items-center justify-center gap-8">
				<h3 class="text-2xl font-bold">Create your password</h3>
				<p class="text-center text-sm">
					This password will unlock your ZAuth wallet only on this device
				</p>
				<div class="flex w-full flex-col gap-5">
					<input
						oninput={(e) => {
							pwd = e.currentTarget.value.trim();
							setStrength();
						}}
						type="password"
						id=""
						placeholder="Enter password"
						class="h-14 w-full bg-secondary px-3 focus:outline-none focus:ring-0"
					/>
					{#if strength == 1}
						<p class="w-full text-sm">
							Password strength: <span class="font-semibold text-red-500">Weak</span>
						</p>
					{:else if strength == 2}
						<p class="w-full text-sm">
							Password strength: <span class="font-semibold text-blue-500">Medium</span>
						</p>
					{:else if strength == 3}
						<p class="w-full text-sm">
							Password strength: <span class="font-semibold text-green-500">Strong</span>
						</p>
					{/if}
					<div class="flex w-full items-center gap-3">
						<div
							class={`flex h-6 w-6 items-center rounded-full ${containsSpecialChar ? "bg-green-500" : "bg-gray-600"} p-1`}
						>
							<Check />
						</div>
						<p class="text-xs text-gray-400">Atleast one special character</p>
					</div>
					<div class="flex w-full items-center gap-3">
						<div
							class={`flex h-6 w-6 items-center rounded-full ${containsNumber ? "bg-green-500" : "bg-gray-600"} p-1`}
						>
							<Check />
						</div>
						<p class="text-xs text-gray-400">Atleast one numeric character</p>
					</div>
					<div class="flex w-full items-center gap-3">
						<div
							class={`flex h-6 w-6 items-center rounded-full ${containsUpperChar ? "bg-green-500" : "bg-gray-600"} p-1`}
						>
							<Check />
						</div>
						<p class="text-xs text-gray-400">Atleast one Uppercase</p>
					</div>
					<div class="flex w-full items-center gap-3">
						<div
							class={`flex h-6 w-6 items-center rounded-full ${containsLowerChar ? "bg-green-500" : "bg-gray-600"} p-1`}
						>
							<Check />
						</div>
						<p class="text-xs text-gray-400">Atleast one Lowercase</p>
					</div>
					<div class="flex w-full items-center gap-3">
						<div
							class={`flex h-6 w-6 items-center rounded-full ${containsMinFiveChar ? "bg-green-500" : "bg-gray-600"} p-1`}
						>
							<Check />
						</div>
						<p class="text-xs text-gray-400">Minimum of 8 characters</p>
					</div>
				</div>
			</div>

			<div class="flex h-[30%] w-full flex-col items-center justify-center gap-3">
				<Button
					type="submit"
					disabled={notReadyCreatePwd}
					class="h-14 w-full border-none text-lg text-white">Create Password</Button
				>
			</div>
		</form>
	</section>
{:else if frame === 5}
	<section
		transition:scale={{ duration: 300 }}
		class="flex h-full flex-col items-center gap-10 px-4 pt-10"
	>
		<div class="flex h-[70%] w-full flex-col items-center justify-center gap-8">
			<h3 class="text-2xl font-bold">Recovery Phrase</h3>
			<p class="text-center text-sm">
				Write down or copy these words in the right order and save them somewhere safe.
			</p>
			<div
				class="flex h-[30%] w-full items-center justify-center rounded-lg bg-secondary p-4 text-2xl font-semibold"
			>
				<p>{wallet?.mnemonic}</p>
			</div>
		</div>

		<div class="flex h-[30%] w-full flex-col items-center justify-center gap-3">
			<Button
				variant="secondary"
				class="h-14 w-full border-none text-lg text-white"
				onclick={copyToClipboard}>Copy</Button
			>

			<Button onclick={() => (frame = 6)} class="mt-3 h-14 w-full border-none text-lg text-white"
				>Complete</Button
			>
		</div>
	</section>
{:else if frame === 6}
	<section
		transition:scale={{ duration: 300 }}
		class="flex h-full flex-col items-center gap-10 px-4 pt-10"
	>
		<div class="flex h-[50%] w-full flex-col items-center justify-center gap-4">
			<img src={CheckPng} alt="logo" class="h-40 w-40" />
			<p class="text-2xl font-bold">Congratulations</p>
		</div>

		<div class="flex h-[50%] w-full flex-col items-center justify-center gap-3">
			<p class="text-center text-lg">You have successfully set up your ZAuth account.</p>
			<Button onclick={() => goto("/dashboard")} class="h-14 w-full border-none text-lg text-white"
				>Close</Button
			>
		</div>
	</section>
{/if}
