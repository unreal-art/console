<script lang="ts">
	import { Wallet } from "lucide-svelte";

	import Header from "$lib/components/custom/Header.svelte";
	import Password from "@/src/lib/components/custom/Password.svelte";
	import KeyPhrase from "@/src/lib/components/custom/KeyPhrase.svelte";

	const cssSizeDash = 92;
</script>

<Header />

<!-- <ImgA url={curApp.url} class="size-16 rounded-full bg-gray-700 md:size-20" src={curApp.logo} /> -->
<section class="flex h-[{cssSizeDash}%] flex-col items-center justify-start gap-10 px-4 pt-3">
	<h3 class="flex h-[10%] items-center text-center text-2xl font-semibold">Settings</h3>
	<div class="h-[90%] w-full">
		<Password />
		<KeyPhrase />
	</div>
</section>
