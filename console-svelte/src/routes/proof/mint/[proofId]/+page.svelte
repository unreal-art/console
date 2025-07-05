<script lang="ts">
	import ComingSoon from "@/src/lib/components/custom/ComingSoon.svelte";
	import Header from "./../../../../lib/components/custom/Header.svelte";
	import { page } from "$app/stores";
	import { type IProofs, ProofStore } from "$stores";
	import { ZAuthLogo } from "@config/zauth";
	import { initialize } from "$utils/helloAnchor";
	import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
	import { CredentialStore, type ICredentials } from "$stores";

	import * as Alert from "$lib/components/ui/alert";
	import { _DEFAULT_APPLICATION, getAppByName, _AppProviderList, findAppProvider } from "@/config";
	import Button from "@/src/lib/components/ui/button/button.svelte";

	const proofId = $page.params.proofId;

	// app store
	let curAppString = $state(_DEFAULT_APPLICATION);
	let curApp = $derived(getAppByName(curAppString));

	let proof: IProofs = $derived($ProofStore.filter((proof: IProofs) => proof.id === proofId)[0]);
	const curAppProvider = $derived(proof ? findAppProvider(proof.providerId) : null);

	$effect(() => {
		console.log({ proof, proofId });
	});

	const initializeProgram = () => {
		const credentials: ICredentials = $CredentialStore;
		if (!credentials.private_key || !credentials.public_key) return;
		initialize(credentials.private_key, credentials.public_key);
	};

	// TODO: check if proof is verified
</script>

<Header />
{#if proof}
	<section class="flex h-[92%] flex-col items-center gap-10">
		<div class="h-50% flex min-h-[500px] w-full flex-col gap-4 rounded-md px-4 py-2">
			<div class="first-letter: flex h-[10%] items-center gap-6">
				{#if curAppProvider}
					<!-- <h2 class="text-md font-semibold text-gray-400">
						{curAppProvider.provider} - {curAppProvider.app.name}
					</h2> -->
					<Breadcrumb.Root>
						<Breadcrumb.List>
							<Breadcrumb.Item class="hidden lg:inline-block">
								<Breadcrumb.Link href="/">ZAuth</Breadcrumb.Link>
							</Breadcrumb.Item>
							<Breadcrumb.Separator class="hidden lg:inline-block" />
							<Breadcrumb.Item>
								<Breadcrumb.Link href="/dashboard">
									<!-- {curApp.name} -->
									<!-- TODO: fix href -->
									<img
										src={curApp.logo}
										alt="logo"
										class="inline-block size-5 rounded-full bg-gray-700"
									/>
								</Breadcrumb.Link>
							</Breadcrumb.Item>
							<Breadcrumb.Separator />
							<Breadcrumb.Item>
								<Breadcrumb.Link href="/dashboard">
									{curAppProvider.name}
								</Breadcrumb.Link>
							</Breadcrumb.Item>
							<Breadcrumb.Separator />
							<Breadcrumb.Item>
								<Breadcrumb.Page>{proof.label}</Breadcrumb.Page>
							</Breadcrumb.Item>
						</Breadcrumb.List>
					</Breadcrumb.Root>
				{/if}
			</div>
			<div class="h-[75%]">
				<img src={curApp.logo2} alt="logo" class=" relative size-full" />
			</div>
			<!-- <p class="flex h-[5%] justify-center text-sm text-gray-400">{proof.label}</p> -->
			<ComingSoon divClass="h-[10%]">
				<Button type="button" onclick={initializeProgram} class="w-full border-none text-white"
					>Mint</Button
				>
			</ComingSoon>
		</div>
	</section>
{/if}
