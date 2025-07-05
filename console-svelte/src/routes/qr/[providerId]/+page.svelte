<script lang="ts">
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import { goto } from "$app/navigation";
	import * as HoverCard from "$lib/components/ui/hover-card/index.js";

	import { page } from "$app/stores";
	import Header from "$lib/components/custom/Header.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import * as Popover from "$lib/components/ui/popover";
	import { DeepLink } from "$utils/deepLinking";
	import { Platform, getOperatingSystem } from "$utils/getBrowser";
	import QRCode from "@castlenine/svelte-qrcode";
	import { createSession, generateProofRequest } from "@utils/reclaim";
	import { retreivePathQuery } from "@utils/unshorten";
	import { Spinner } from "flowbite-svelte";
	import { Apple, ArrowLeft, Bold, ExternalLink, Files, LoaderCircle } from "lucide-svelte";
	import { toast } from "svelte-sonner";
	import type { PageData } from "./$types";
	import { isExtension, isWebpage } from "@utils/isWebpageExtension";
	import { PUBLIC_FC_HOST, PUBLIC_DEV_SHOW_MAC } from "$env/static/public";
	import { dev } from "$app/environment";
	import { getApp } from "@config/index";
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";
	import ToolTip from "@/src/lib/components/custom/ToolTip.svelte";
	import { onMount } from "svelte";
	let data: PageData;
	// let PUBLIC_FC_HOST = "localhost";

	let url: string = $state("");

	const providerId = $page.params["providerId"];

	const app = getApp(providerId);

	let decodedUrl: URL | null = $state(null);

	let MAC_URL: string = $state("");

	async function decodeApi(deepLinkAppUrl: string) {
		const endpoints = {
			server: `/qr/${providerId}`, //TODO: enable this later
			fc: "/.netlify/functions/undeepURL",
		};
		let host = PUBLIC_FC_HOST;
		// const hosts = [
		// 	`/qr/${providerId}`,
		// 	"https://zauth.netlify.app/.netlify/functions/undeepURL",
		// 	`${PUBLIC_FC_HOST}/.netlify/functions/undeepURL`,
		// ];
		// console.log("hosts are", hosts);
		let u: string = endpoints.fc;
		// let chosenHost

		const fullStackHosts = ["vercel"];

		if (dev && isWebpage()) {
			let _u = window.location.hostname;

			if (fullStackHosts.includes(_u)) {
				console.log("full stack host");
				// u = endpoints.server;
			} else {
				console.log("not fullstack host");
				u = endpoints.fc;
			}
			// u = `/qr/${providerId}`;
			// u = `/.netlify/functions/undeepURL`;
		}

		if (isExtension()) {
			// u = hosts[1];
			host = "https://zauth.netlify.app";
			u = endpoints.fc;
		}

		u = `${host}${u}`;

		console.log({ u });

		const res = await fetch(u, {
			method: "POST",
			body: JSON.stringify({
				url: deepLinkAppUrl,
			}),
		});

		console.log({ res });

		const json = await res.json();

		decodedUrl = new URL(json.decodedUrl);

		console.log(json);

		if (decodedUrl) {
			const extractedInfo = retreivePathQuery(decodedUrl);
			const macUrlFormat = DeepLink<Platform.MacOS>(
				Platform.MacOS,
				`${extractedInfo.pathname}${extractedInfo.searchQuery}`,
			);
			MAC_URL = macUrlFormat.toString();
			console.log("MAC_URL: " + MAC_URL);
		}
	}

	// onMount(() => {
	// 	// decodedUrl = data.decodedUrl;
	// 	// console.log("pageData", data);
	// 	// console.log($page.data);
	// 	// PUBLIC_FC_HOST = data.PUBLIC_FC_HOST;
	// });

	let isMac: boolean | null = null;

	onMount(() => {
		const clientOS = getOperatingSystem(); //fix:window not defined

		if (dev) {
			console.debug("dev mode: show mac", PUBLIC_DEV_SHOW_MAC);
			isMac = JSON.parse(PUBLIC_DEV_SHOW_MAC) as boolean;
		}

		isMac ??= clientOS == Platform.MacOS;

		console.debug({ clientOS, isMac });
	});

	$effect(() => {
		if (url) {
			// const u = new URL(url);

			// GetReclaimDeepLink(u.toString())
			// 	.then((newURL: URL) => {
			// 		decodedUrl = newURL;
			// 		console.log("decoded", decodedUrl);
			// 	})
			// 	.catch((err) => console.error(err));
			console.log("url discovered", url);

			if (isMac) {
				if (isMac) console.debug("$effect", { isMac });
				decodeApi(url);
			}
		}
	});

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(url.toString());
		} catch (error) {
			console.error("Unable to copy to clipboard:", error);
		}
		toast.success("Copied");
	}
	async function genQR() {
		const req = await generateProofRequest(providerId, "#TODO:wallet");
		url = req.url.toString();
		try {
			await createSession(providerId);
			console.log("createSession successful");
		} catch (error) {
			console.error("createSession failed", error);
		}
		// await new Promise(async () => await generateProofRequest(providerId, "")); //dev: just testing
	}
	console.log({ providerId });
	console.log({ app });

	function OpenInMac() {
		console.log("open in popup");
		window.open(MAC_URL, "popup", "width=600,height=400,scrollbars=yes,resizable=yes");
	}
</script>

<Header />
<section class="flex h-[92%] flex-col items-center gap-10 px-4 py-4 pt-10">
	<a href={app?.url} target="_blank" rel="noopener noreferrer">
		<img src={app?.logo} alt="" class="align-center size-16 rounded-full bg-gray-700" />
		<!-- <iconify-icon icon={app?.logo} class="pr-3 text-2xl"></iconify-icon> -->
	</a>
	<HoverCard.Root>
		<HoverCard.Trigger
			href={app.url}
			target="_blank"
			rel="noreferrer noopener"
			class="rounded-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-black"
		>
			{app.name}
		</HoverCard.Trigger>
		<HoverCard.Content class="w-80">
			<div class="flex justify-between space-x-4">
				<Avatar.Root>
					<Avatar.Image src={app.logo} />
					<Avatar.Fallback>{app.name}</Avatar.Fallback>
				</Avatar.Root>
				<div class="space-y-1">
					<h4 class="text-sm font-semibold">{app.name}</h4>
					<p class="text-sm">{app.desc}</p>
				</div>
			</div>
		</HoverCard.Content>
	</HoverCard.Root>
	{#await genQR()}
		<!-- <p>generating the qr</p> -->
		<Spinner color="green" currentColor="white" currentFill="gray" />
	{:then}
		<a href={url} target="_blank" rel="noopener noreferrer">
			<QRCode
				data={url}
				backgroundColor="white"
				logoPath={app?.logo}
				waitForLogo={true}
				haveBackgroundRoundedEdges={true}
				dispatchDownloadUrl={true}
				isResponsive={false}
			/>
		</a>
	{/await}

	<div class="flex items-center justify-center gap-1">
		<Button
			variant={"outline"}
			class="tool-icon text-white shadow-none"
			on:click={(e:Event)=>{
				goto('/dashboard', {replaceState:false})
			}}><ArrowLeft />Back</Button
		>

		{#if url}
			<Tooltip.Root>
				<Tooltip.Trigger asChild let:builder>
					<Button builders={[builder]} variant="outline" class="tool-icon">
						<a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink /></a>
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>Open QRLink</p>
				</Tooltip.Content>
			</Tooltip.Root>

			{#if MAC_URL}
				<ToolTip tip="Open in Mac: make sure u have Reclaim App installed" class="px-4 py-4">
					<Button href={MAC_URL} rel="noopener noreferrer" variant="outline" class="hidden lg:flex">
						<span> <Apple size={30} /> </span>
					</Button>
					<Button variant="outline" on:click={OpenInMac} class="lg:hidden">
						<span> <Apple size={30} /> </span>
					</Button>
				</ToolTip>
				<!-- <Tooltip.Root class="tool-icon">
					<Tooltip.Trigger asChild let:builder>
						<Button builders={[builder]} variant="outline">
							<a href={MAC_URL} rel="noopener noreferrer">
								<span> <Apple /> </span>
							</a>
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>Open in Mac</p>
					</Tooltip.Content>
				</Tooltip.Root> -->
			{:else if isMac}
				<Button disabled variant="outline" class="tool-icon">
					<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
					<span> <Apple /> </span>
				</Button>
			{/if}

			<Button variant="outline" class="tool-icon text-white shadow-none" onclick={copyToClipboard}
				><Files />Copy</Button
			>
		{/if}
	</div>
</section>

<style lang="css">
	.tool-icon {
		@apply px-1;
	}
</style>
