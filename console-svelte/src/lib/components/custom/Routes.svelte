<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
</script>

<section class="h-full w-full">
	<div class="flex h-[10%] items-center justify-between px-3 text-center text-sm text-gray-300">
		<p class="text-xs">Please select a proof procees of your choice.</p>
	</div>
	<div class="h-[90%] overflow-y-auto">
		<Dialog.Root>
			<Dialog.Trigger
				class="flex h-14 w-full cursor-pointer items-center justify-between rounded-none border-none px-4 shadow-none hover:bg-background"
			>
				<span class="text-sm font-semibold">Twitter followers</span>
				<span class="flex items-center text-lg font-semibold">
					<iconify-icon icon="mingcute:right-fill"></iconify-icon>
				</span>
			</Dialog.Trigger>

			<Dialog.Content class="sm:max-w-[425px]">
				<Dialog.Header>
					<Dialog.Title>Twitter.com</Dialog.Title>
					<Dialog.Description>
						To continue with proof creation, please click the button below.

						<div class="flex h-[300px] w-full flex-col gap-10">
							<div class="text-center text-lg font-semibold text-white">Verifying</div>
							<div class="text-center">
								You have <span class="text-lg font-bold text-primary">1,200</span> followers on Linkedin.
							</div>

							<div class="text-center">Please wait...</div>
						</div>
					</Dialog.Description>
				</Dialog.Header>
				<Dialog.Footer>
					<Button class="border-none text-white outline-none hover:outline-none" type="submit"
						>Create Proof</Button
					>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
	</div>
</section>
