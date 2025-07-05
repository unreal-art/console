<script lang="ts">
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";
	import { TicketPercent } from "lucide-svelte";
	import { Button } from "../ui/button";
	import type { Snippet } from "svelte";
	interface IProps {
		tip: string;
		children: Snippet;
		class?: string;
		classToolTipBtn?: string;
	}
	let { tip, children, class: className = "", classToolTipBtn = "" }: IProps = $props();
	console.debug({ className, tip });
</script>

<Tooltip.Root>
	<Tooltip.Trigger asChild let:builder>
		<Button
			builders={[builder]}
			class="m-0 border-none bg-transparent p-0 shadow-none {classToolTipBtn}"
			variant="outline"
		>
			<!-- <slot /> -->
			{@render children()}
		</Button>
	</Tooltip.Trigger>
	<Tooltip.Content class={className}>{tip} {@debug tip}</Tooltip.Content>
</Tooltip.Root>

<style lang="css">
	#custom-naked-button {
		background: transparent;
		border: none;
		padding: 0;
		margin: 0;
		color: inherit;
		font: inherit;
		appearance: none;
		outline: none;
	}

	#custom-naked-button:focus {
		outline: none;
	}

	#custom-naked-button:hover {
		outline: none;
		background-color: transparent;
	}
</style>
