<script lang="ts">
	import ComingSoon from "@/src/lib/components/custom/ComingSoon.svelte";
	import { page } from "$app/stores";
	import {
		CirclePlus,
		Cloud,
		EllipsisVertical,
		Github,
		LifeBuoy,
		LogOut,
		FileLock,
		Mail,
		Maximize2,
		MessageSquare,
		Settings,
		UserPlus,
		Sun,
		Moon,
	} from "lucide-svelte";
	import { goto } from "$app/navigation";
	import { AuthStore } from "$stores";
	import { toggleMode } from "mode-watcher";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import Button from "../ui/button/button.svelte";
	import { dev } from "$app/environment";

	import { isWebpage2 } from "@utils/isWebpageExtension";
	const expandViewURLs = {
		web: "/",
		ext: "/index.html",
	};
	let showExpandView: boolean = !isWebpage2($page.url);
	let expandViewURL = expandViewURLs.ext;

	if (dev) {
		showExpandView = true;
		expandViewURL = expandViewURLs.web;
	}
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger asChild let:builder>
		<Button
			builders={[builder]}
			variant="outline"
			class="bg-transparent shadow-none hover:bg-background/50"
		>
			<EllipsisVertical class="cursor-pointer" />
		</Button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="w-56">
		<DropdownMenu.Label>Control Panel</DropdownMenu.Label>
		<DropdownMenu.Separator />
		<DropdownMenu.Group>
			{#if showExpandView}
				<a href={expandViewURL} target="_blank"
					><DropdownMenu.Item class="cursor-pointer hover:bg-secondary lg:hidden ">
						<Maximize2 class="mr-2 h-4 w-4" />
						<span>Expand View</span>
					</DropdownMenu.Item></a
				>
			{/if}
			<a href="/settings">
				<DropdownMenu.Item class="cursor-pointer hover:bg-secondary">
					<Settings class="mr-2 h-4 w-4" />
					<span>Settings</span>
				</DropdownMenu.Item>
			</a>

			<DropdownMenu.Separator />
			<ComingSoon>
				<DropdownMenu.Group>
					<DropdownMenu.Sub>
						<DropdownMenu.SubTrigger class="text-gray-400">
							<UserPlus class="mr-2 h-4 w-4" />
							<span>Invite users</span>
						</DropdownMenu.SubTrigger>
						<DropdownMenu.SubContent>
							<DropdownMenu.Item disabled={true} class="cursor-pointer hover:bg-secondary">
								<Mail class="mr-2 h-4 w-4" />
								<span>Email</span>
							</DropdownMenu.Item>
							<DropdownMenu.Item disabled={true} class="cursor-pointer hover:bg-secondary">
								<MessageSquare class="mr-2 h-4 w-4" />
								<span>Message</span>
							</DropdownMenu.Item>
							<DropdownMenu.Item disabled={true} class="cursor-pointer hover:bg-secondary">
								<CirclePlus class="mr-2 h-4 w-4" />

								<span>More...</span>
							</DropdownMenu.Item>
						</DropdownMenu.SubContent>
					</DropdownMenu.Sub>
				</DropdownMenu.Group>
			</ComingSoon>

			<DropdownMenu.Separator />
			<ComingSoon>
				<DropdownMenu.Item disabled={true} class="cursor-pointer hover:bg-secondary">
					<Github class="mr-2 h-4 w-4" />

					<span>GitHub</span>
				</DropdownMenu.Item>
			</ComingSoon>
			<ComingSoon>
				<DropdownMenu.Item disabled={true} class="cursor-pointer hover:bg-secondary">
					<LifeBuoy class="mr-2 h-4 w-4" />
					<span>Support</span>
				</DropdownMenu.Item>
			</ComingSoon>
			<ComingSoon>
				<DropdownMenu.Item disabled={true} class="cursor-pointer hover:bg-secondary">
					<Cloud class="mr-2 h-4 w-4" />
					<span>API</span>
				</DropdownMenu.Item>
			</ComingSoon>
			<DropdownMenu.Separator />

			<DropdownMenu.Item
				onclick={() => {
					AuthStore.reset();
					goto("/auth");
				}}
				class="cursor-pointer hover:bg-secondary"
			>
				<LogOut class="mr-2 h-4 w-4" />
				<span>Log out</span>
			</DropdownMenu.Item>
		</DropdownMenu.Group>

		<DropdownMenu.Item class="cursor-pointer p-0 hover:bg-secondary">
			<Button
				onclick={toggleMode}
				variant="outline"
				size="icon"
				class="text-md flex h-full w-full justify-start border-none p-1 font-light shadow-none"
			>
				<Moon
					class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
					onclick={toggleMode}
				/>
				<Sun
					class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
					onclick={toggleMode}
				/>
				<span class="hidden text-sm dark:flex" onclick={toggleMode}>Light</span>
				<span class="flex dark:hidden" onclick={toggleMode}>Dark</span>
			</Button>
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
