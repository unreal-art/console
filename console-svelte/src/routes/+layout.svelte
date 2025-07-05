<script lang="ts">
	import "../app.pcss";
	import { ModeWatcher } from "mode-watcher";
	import { Toaster } from "$lib/components/ui/sonner";
	import { ZAuthVersion } from "@config/zauth";
</script>

<ModeWatcher defaultMode={"system"} />
<Toaster position="bottom-right" />

<svelte:head>
	<title>ZAuth:{ZAuthVersion}</title>
	<meta
		name="description"
		content="ZAuth decentralizes user auth and gives the user power over their data."
	/>
	<meta name="keywords" content="OAuth, Web3 auth, privacy, ZAuth, ZkAuth, Zkproof" />
	<meta name="author" content="Hiro, William, laciferin" />
	<meta name="version" content={ZAuthVersion} />
</svelte:head>

<main class="h-screen md:w-[500px]">
	<slot></slot>
</main>

<style>
	@import "open-props/style";
	@import "open-props/normalize";
	@import "open-props/buttons";
	@import "@fontsource-variable/manrope";

	:global(body) {
		font-family: "Manrope Variable", sans-serif;
		height: 100%;
		width: 100%;
		min-width: 360px;
		min-height: 600px;
		max-width: fit-content;
		max-height: max-content;
		overflow: clip;
		overflow-y: hidden;
		/* justify-content: center; */
		/* align-items: center; */
		/* background-color: #f0f0f0; */
		/* display: flex; */
		/* justify-self: center;
		align-items: center; */

		/* display: flex; */
	}
</style>
