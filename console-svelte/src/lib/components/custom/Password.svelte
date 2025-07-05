<script lang="ts">
	import { LockKeyhole, ChevronRight } from "lucide-svelte";
	import * as Dialog from "$lib/components/ui/dialog";
	import Input from "../ui/input/input.svelte";
	import { toast } from "svelte-sonner";
	import bcrypt from "bcryptjs";
	import { CredentialStore, type ICredentials } from "$stores";

	let open = $state(false);
	let oldpwd = $state("");
	let pwd = $state("");
	let pwd2 = $state("");

	let containsSpecialChar = $derived(/[^a-zA-Z0-9]/.test(pwd));
	let containsUpperChar = $derived(/[A-Z]/.test(pwd));
	let containsMinFiveChar = $derived(pwd.length >= 5);
	let containsNumber = $derived(/\d/.test(pwd));
	let containsLowerChar = $derived(/[a-z]/.test(pwd));
	let correctOldPwd = $state(false);
	let pwdMatch = $derived(pwd === pwd2);
	let notReadyCreatePwd = $derived(
		!containsMinFiveChar || !pwdMatch || !correctOldPwd ? true : false,
	);
	let strength = $state(0);

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

	const comparePwd = () => {
		if (oldpwd.trim().length == 0) return;
		// Verifying the pwd
		bcrypt.compare(oldpwd, $CredentialStore.password, function (err, result) {
			if (!err) {
				correctOldPwd = result;
				// toast.error("Invalid credential provided.");
			} else {
				toast.error("An error occured please try again later.");
			}
		});
	};

	const savePassword = () => {
		console.log("ok");
		const saltRounds = 10;
		const credentials: ICredentials = $CredentialStore;
		bcrypt.hash(pwd, saltRounds, function (err, hash) {
			console.log("🚀 ~ pwd:", pwd);
			if (err) throw err;
			// Store hash in your pwd database.
			console.log("Hashed pwd:", hash);

			// Verifying the pwd
			bcrypt.compare(pwd, hash, function (err, result) {
				if (err) throw err;
				console.log("Password matches:", result); // true
			});
			credentials.password = hash;
			$CredentialStore = credentials;
			open = false;
		});
	};
</script>

<form class=" w-full" onsubmit={savePassword}>
	<Dialog.Root bind:open>
		<Dialog.Trigger class="w-full border-none shadow-none">
			<div class="flex h-14 w-full cursor-pointer items-center border-b hover:bg-secondary">
				<div class="flex w-[15%] items-center justify-center text-xl">
					<LockKeyhole size={25} />
				</div>
				<div class="flex w-[85%] items-center justify-between text-lg">
					<span>Change Password</span>
					<ChevronRight size={25} />
				</div>
			</div>
		</Dialog.Trigger>
		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				<Dialog.Title>Change Password</Dialog.Title>
			</Dialog.Header>
			<div class="flex w-full flex-col gap-4 py-4">
				<div class="w-full">
					<Input
						oninput={(e) => {
							oldpwd = e.currentTarget.value.trim();
							comparePwd();
						}}
						type="password"
						id="oldPwd"
						placeholder="Current Password"
					/>
				</div>
				{#if !correctOldPwd && oldpwd.length > 0}
					<p class="w-full text-sm text-red-400">Incorrect password</p>
				{/if}
				<div class="w-full">
					<Input
						oninput={(e) => {
							pwd = e.currentTarget.value.trim();
							setStrength();
						}}
						type="password"
						id="pwd"
						placeholder="New Password"
					/>
				</div>
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
				<div class="w-full">
					<Input
						oninput={(e) => {
							pwd2 = e.currentTarget.value.trim();
						}}
						type="password"
						id="pwd2"
						placeholder="New Password"
					/>
				</div>

				{#if !pwdMatch && pwd2.length > 0}
					<p class="w-full text-sm text-red-400">Passwords do not match</p>
				{/if}
			</div>
			<Dialog.Footer>
				<button
					onclick={savePassword}
					disabled={notReadyCreatePwd}
					type="submit"
					class=" h-10 px-3 text-white">Save</button
				>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
</form>
