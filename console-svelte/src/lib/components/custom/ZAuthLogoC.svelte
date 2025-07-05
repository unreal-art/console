<script lang="ts">
	import ImgA from "./ImgA.svelte";
	import Badge from "./../ui/badge/badge.svelte";
	import ToolTip from "./ToolTip.svelte";
	import { ZAuthURL, ZAuthVersion, ZAuthLogo } from "@/config/zauth";

	interface IProps {
		class?: string;
	}

	let { class: className = "h-16 w-16" }: IProps = $props();
</script>

<ToolTip tip="Your Identity is yours, so take it" classToolTipBtn="hover:bg-transparent">
	<ImgA url={ZAuthURL} src={ZAuthLogo} alt="ZAuth" class={className} />
</ToolTip>
<Badge variant="outline" class="mr-1 border-none p-1">
	<sub class="font-mono text-sm text-gray-500">{ZAuthVersion}</sub></Badge
>
