<script lang="ts">
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import { navigate } from "svelte-routing";
	import { scale } from "svelte/transition";
	import "iconify-icon";
	import { onDestroy, onMount, setContext, tick } from "svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";
	import Manage from "$lib/components/custom/Manage.svelte";
	import { Check, ChevronsUpDown, CloudUpload, Pickaxe } from "lucide-svelte";
	import { v4 as uuidv4 } from "uuid";
	import * as Select from "$lib/components/ui/select";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import * as Command from "$lib/components/ui/command/index.js";
	import * as Popover from "$lib/components/ui/popover/index.js";
	import { ProofStore } from "$stores/proofStores";
	import Header from "$lib/components/custom/Header.svelte";
	import { generateProofRequest } from "@utils/reclaim";
	import { goto } from "$app/navigation";
	import {
		_applicationList,
		_AppProviderList,
		_DEFAULT_APP_PROVIDER,
		_DEFAULT_APPLICATION,
		_PLACEHOLDER_SELECT_APP_PROVIDER,
		_PLACEHOLDER_SELECT_APPLICATION,
		_QR_KEY,
		_WALLET_ADDRESS,
		getAppByName,
		type IProvider,
	} from "@config/index";
	import type { IProofs } from "./+layout";
	import ImgA from "@/src/lib/components/custom/ImgA.svelte";
	import { AppStateStore } from "$stores/appStateStore";

	const cssSizeDash = 92;

	// instantenous state
	let isApp = $state(false);
	let isAppProvider = $state(true);

	// app store
	let curAppString = $state(_DEFAULT_APPLICATION);
	let curApp = $derived(getAppByName(curAppString));

	let curAppProvider: IProvider = $state(_DEFAULT_APP_PROVIDER(_DEFAULT_APPLICATION));
	let curAppProviderId: string = $derived(curAppProvider.id);

	// TODO : remove unused variable
	let counter = $state<number>(1);
	let files = $state<FileList>();

	let fileContent = "";

	let selectedValue = $derived(
		_applicationList.find((f) => f.name === curAppString)?.label ??
			_PLACEHOLDER_SELECT_APP_PROVIDER,
	);

	let curAppProviderList = $derived(_AppProviderList[curAppString]);

	// TODO : remove unused variable
	let curProofs: IProofs[] = $derived(
		$ProofStore.filter((proof: IProofs) => proof.providerId === curAppProviderId),
		// .sort((a: IProofs, b: IProofs) => new Date(b.date).getTime() - new Date(a.date).getTime()),
	);

	function closeAndFocusTrigger(triggerId: string) {
		isApp = false;
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
	}

	function persistAppConfig() {
		console.debug("persist app config");
		AppStateStore.setCurApp(curAppString);
		AppStateStore.setCurAppProvider(curAppProvider);
	}

	onMount(() => {
		curAppString = $AppStateStore.curApp;
		curAppProvider = $AppStateStore.curAppProvider;
	});

	onDestroy(() => {
		persistAppConfig();
	});

	$inspect(curAppString, curAppProvider);

	// appStoreState
	$effect(() => {
		return () => {
			console.log("cleaning up");
			persistAppConfig();
		};
	});

	$effect(() => {
		if (files && files != undefined) {
			const file = files[0];
			const currentDate = new Date();

			// Format the date in the desired pattern (month/day/year)
			// const formattedDate = `${month}/${day}/${year}`;
			// const formattedDateTimeString: string = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")} ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

			const reader = new FileReader();
			const id: string = uuidv4();
			reader.onload = () => {
				fileContent = reader.result as string;
				const data: IProofs = {
					id,
					label: `${curApp.name}-${ProofStore.size(curAppProvider.id) + 1}`,
					date: currentDate,
					providerId: curAppProvider.id,
					data: JSON.parse(fileContent),
				};

				// add proof to proof stores
				ProofStore.addProof(data);
			};
			reader.readAsText(file);
		}
	});

	const upload = () => {
		document.getElementById("upload")?.click();
	};
</script>

<Header />

<!-- <ImgA url={curApp.url} class="size-16 rounded-full bg-gray-700 md:size-20" src={curApp.logo} /> -->
<section class="flex h-[{cssSizeDash}%] flex-col items-center justify-center gap-10 px-4 pt-3">
	<div class="flex h-[25%] items-center justify-center">
		<a href={curApp.url} target="_blank" rel="noopener noreferrer">
			<img src={curApp.logo} alt="logo" class="size-14 rounded-full bg-gray-700 md:size-24" />
		</a>
	</div>

	<form class="flex h-[20%] w-full flex-col justify-center gap-4">
		<Popover.Root bind:open={isApp} let:ids>
			<Popover.Trigger asChild let:builder class="w-full">
				<Button
					builders={[builder]}
					variant="outline"
					role="combobox"
					aria-expanded={isApp}
					class="h-14 w-full justify-between"
				>
					{selectedValue}
					<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</Popover.Trigger>
			<Popover.Content
				class="relative w-[92%] max-w-[470px] justify-between p-0 md:w-[89%] lg:w-[96%]"
			>
				<Command.Root>
					<Command.Input placeholder={_PLACEHOLDER_SELECT_APPLICATION} class="focus:outline-none" />
					<Command.Empty>No match found.</Command.Empty>
					<Command.Group>
						{#each _applicationList as app}
							<Command.Item
								class="justify-between"
								value={app.name}
								disabled={_AppProviderList[app.name] == undefined}
								onSelect={(currentValue) => {
									if (curAppString != currentValue) {
										curAppString = currentValue;
										curAppProvider = _DEFAULT_APP_PROVIDER(curAppString); //_PLACEHOLDER_SELECT_APP_PROVIDER;
									}
									closeAndFocusTrigger(ids.trigger);
								}}
							>
								<!-- <Check
									class={cn("mr-2 h-4 w-4", curAppString !== app.name && "text-transparent")}
								/> -->

								<!-- <iconify-icon icon={app.logo} class="pr-3 text-2xl"></iconify-icon> -->
								{app.label}
								<!-- <img
									src={app?.logo}
									alt=""
									class="ml-3 size-8 justify-end rounded-full bg-gray-700"
								/> -->
								<Avatar.Root>
									<Avatar.Image src={app.logo} alt="@{app.name}" />
									<!-- <Avatar.Fallback></Avatar.Fallback> -->
								</Avatar.Root>
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>

		<!-- dev:setting default curAppProvider -->
		<Select.Root
			selected={{
				label: curAppProvider.name,
				value: curAppProvider,
			}}
			onSelectedChange={(v) => {
				//@ts-ignore
				v && (curAppProvider = v.value);
				console.log("🚀 ~ curAppProvider:", curAppProvider.id);
			}}
		>
			<Select.Trigger
				class="h-14 w-full pr-4 outline-none hover:bg-secondary focus:outline-none focus:ring-0"
			>
				<Select.Value placeholder={_PLACEHOLDER_SELECT_APP_PROVIDER} />
			</Select.Trigger>
			<Select.Content>
				{#each curAppProviderList as appProvider}
					<Select.Item label={appProvider.name} value={appProvider}>{appProvider.name}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>

		<input type="file" class="hidden" id="upload" accept=".json" bind:files />
		<div class="flex gap-4">
			<Button
				disabled={curAppProvider && curAppString ? false : true}
				variant={"outline"}
				onclick={upload}
				class="h-10 w-full"
			>
				Upload Proof <CloudUpload class="h-4S w-4" />
			</Button>

			<Button
				disabled={curAppProvider && curAppString ? false : true}
				variant={"outline"}
				onclick={async (e:Event)=>{
				const {url:qrCodeURL} = await generateProofRequest(curAppProvider.id, _WALLET_ADDRESS)
				console.log("qrCodeURL: " + qrCodeURL)
				localStorage.setItem(_QR_KEY,   JSON.stringify(qrCodeURL))
 				goto(`/qr/${curAppProvider.id}`, {
					state: {
						url: qrCodeURL.toString() //need to clone, so need to be string or json
						}
					}
				)
			}}
				class="h-10 w-full "
			>
				Generate Proof <Pickaxe class="h-3 w-3" />
			</Button>
		</div>
	</form>

	{#if $ProofStore.length > 0}
		<div
			transition:scale={{ duration: $ProofStore.length * 1000 }}
			class="flex h-auto min-h-[55%] w-full flex-col rounded-md bg-secondary"
		>
			<div class="h-[85%] w-full pt-2">
				<Manage {curAppProviderId} />
			</div>
		</div>
	{/if}
</section>

<!-- <div class="mt-10"></div> -->

<!-- <footer class="mt-10">Copyright</footer> -->

<style>
	.select__option--is-selected::before {
		display: none;
	}
</style>
