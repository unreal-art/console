<script lang="ts">
	import * as HoverCard from "$lib/components/ui/hover-card";
	import type { Snippet } from "svelte";

	interface IProps {
		class?: string;
		msg?: string;
		children: Snippet;
		divClass?: string;
	}

	let { class: className = "", msg = "Coming Soon", children, divClass = "" }: IProps = $props();
</script>

<div class={divClass}>
	<HoverCard.Root>
		<HoverCard.Trigger>{@render children()}</HoverCard.Trigger>
		<HoverCard.Content class={className}>{msg}</HoverCard.Content>
	</HoverCard.Root>
</div>
