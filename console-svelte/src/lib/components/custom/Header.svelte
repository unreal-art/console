<script lang="ts">
	import Badge from "./../ui/badge/badge.svelte";

	import { ZAuthVersion, ZAuthLogo } from "@config/zauth";
	import ToolTip from "./ToolTip.svelte";

	import Menu from "./Menu.svelte";

	let _version: string = ZAuthVersion;
	// _version = "v0.11.0";
	const _versionLen = Math.min(4, _version.length);
	console.log({ _versionLen });
</script>

<div class="relative flex h-[8%] items-center justify-between bg-secondary">
	<a href="/" class=""
		><div class="flex h-full items-center">
			<ToolTip tip="Your Identity is yours, so take it">
				<img src={ZAuthLogo} alt="logo" class="h-16 w-16" />
				<h1 class="-ml-3 mb-0 mr-0 text-2xl font-bold">
					ZAuth<Badge variant="outline" class="mr-1 p-1">
						<div class="scroll-container w-[{_versionLen}ch]">
							<sub class="scroll-text font-mono text-gray-500">{_version}</sub>
						</div>
					</Badge>
				</h1>
			</ToolTip>
		</div></a
	>

	<Menu />
</div>

<style lang="css">
	@keyframes slide {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-100%);
		}
	}
	.scroll-container {
		display: inline-block;
		overflow: hidden;
		justify-content: flex-start;
		justify-items: flex-start;
		white-space: nowrap;
		position: relative;
		height: 1rem; /* Adjust height as necessary */
	}

	.scroll-container:hover .scroll-text {
		animation-play-state: paused;
	}

	.scroll-text {
		justify-content: flex-start;
		display: inline-block;
		animation: 13s slide infinite linear;
	}
</style>
