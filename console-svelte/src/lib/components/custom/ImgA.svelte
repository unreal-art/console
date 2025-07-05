<script lang="ts">
	import { stringify } from "devalue";
	import type { Snippet } from "svelte";

	interface IProps {
		url: string;
		alt?: string;
		class?: string;
		src: string;
		rel?: string;
		target?: string;
		children?: Snippet;
	}

	let {
		url,
		src,
		alt = "",
		class: className,
		target = "_blank",
		rel = "noopener noreferrer",
		children,
	}: IProps = $props();
</script>

<a href={url} {target}>
	<img {src} {alt} class={className} />
	{#if children}}
		{@render children()}
	{/if}
</a>
