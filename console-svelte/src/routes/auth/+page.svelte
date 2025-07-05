<script lang="ts">
	import bcrypt from "bcryptjs";
	import { goto } from "$app/navigation";
	import { scale } from "svelte/transition";
	import Button from "$lib/components/ui/button/button.svelte";
	import { Input } from "$lib/components/ui/input/index.js";
	import { CredentialStore, AuthStore } from "$stores";
	import { toast } from "svelte-sonner";
	import ZAuthLogoC from "@components/custom/ZAuthLogoC.svelte";

	let pwd = $state("");
	let btnState = $derived(pwd.length == 0);

	const login = () => {
		if (pwd.trim().length == 0) return;
		// Verifying the pwd
		bcrypt.compare(pwd, $CredentialStore.password, function (err, result) {
			if (err || !result) {
				toast.error("Invalid credential provided.");
			} else {
				AuthStore.updateAuth({
					isAuthenticated: true,
				});
				//go to dashboard
				goto("/dashboard");
			}
		});
	};
</script>

<section
	transition:scale={{ duration: 100 }}
	class="flex h-full flex-col items-center gap-10 px-4 pt-10"
>
	<div class="flex h-[50%] w-full flex-col items-center justify-center gap-8">
		<ZAuthLogoC class="h-96 w-96" />
		<!-- <p class="text-6xl font-bold">ZAuth</p> -->
	</div>

	<form onsubmit={login} class="flex h-[50%] w-full flex-col items-center justify-start gap-3">
		<div class="flex w-full flex-col gap-5">
			<input
				oninput={(e) => {
					pwd = e.currentTarget.value.trim();
				}}
				type="password"
				id=""
				placeholder="Enter password"
				class="h-14 w-full rounded-none bg-secondary px-3 focus:border-none focus:outline-none focus:ring-0"
			/>
		</div>
		<Button disabled={btnState} type="submit" class="h-14 w-full border-none text-lg text-white"
			>Login</Button
		>
	</form>
</section>
