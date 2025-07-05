<script lang="ts">
	import { writable } from 'svelte/store';
	import { fade, fly, scale } from 'svelte/transition';
	import { Check, Wallet, FileText, Key, ArrowRight } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	
	// Use Svelte stores instead of React useState
	const currentStep = writable(0);
	const completedSteps = writable<number[]>([]);
	
	const steps = [
		{
			id: 0,
			title: "Connect Wallet",
			description: "Connect your non-custodial wallet",
			icon: Wallet,
			detail: "MetaMask, WalletConnect, Coinbase Wallet supported"
		},
		{
			id: 1,
			title: "Register Business", 
			description: "Auto-fill wallet address, sign payload",
			icon: FileText,
			detail: "EIP-712 signature for secure registration"
		},
		{
			id: 2,
			title: "Generate API Key",
			description: "One-time display with security warning",
			icon: Key,
			detail: "Copy to clipboard and store securely"
		}
	];
	
	function handleStepComplete(stepId: number) {
		// Update completed steps
		completedSteps.update(steps => {
			if (!steps.includes(stepId)) {
				return [...steps, stepId];
			}
			return steps;
		});
		
		// Move to next step if available
		if (stepId < steps.length - 1) {
			currentStep.set(stepId + 1);
		}
	}
	
	// Reactive variable for progress percentage
	$: progressPercentage = (($completedSteps.length) / steps.length) * 100;
</script>

<section class="py-20 relative">
	<div class="container mx-auto px-6">
		<div
			in:fly={{ y: 30, duration: 800, opacity: 0 }}
			class="text-center mb-12"
		>
			<h2 class="text-4xl font-bold mb-6">Get Started in 3 Simple Steps</h2>
			<p class="text-xl text-slate-300 mb-8">
				From wallet connection to API key generation in under 2 minutes
			</p>
		</div>

		<!-- Progress Bar -->
		<div class="max-w-2xl mx-auto mb-12">
			<div class="flex justify-between items-center mb-4">
				{#each steps as step, index}
					<div
						class={`flex items-center space-x-2 ${
							index <= $currentStep ? 'text-blue-400' : 'text-slate-500'
						}`}
					>
						<div
							class={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
								$completedSteps.includes(step.id)
									? 'bg-blue-600 border-blue-600'
									: index === $currentStep
									? 'border-blue-400 bg-slate-800'
									: 'border-slate-600 bg-slate-900'
							}`}
						>
							{#if $completedSteps.includes(step.id)}
								<Check class="w-4 h-4 text-white" />
							{:else}
								<span class="text-sm font-semibold">{index + 1}</span>
							{/if}
						</div>
						<span class="text-sm font-medium hidden sm:block">{step.title}</span>
					</div>
				{/each}
			</div>
			<Progress value={progressPercentage} class="h-2 mb-8" />
		</div>

		<!-- Step Cards -->
		<div class="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
			{#each steps as step, index}
				{@const isActive = index === $currentStep}
				{@const isCompleted = $completedSteps.includes(step.id)}
				{@const Icon = step.icon}
				
				<div
					in:fly={{ y: 20, duration: 500, delay: index * 100, opacity: 0 }}
				>
					<Card 
						class={`relative overflow-hidden transition-all duration-300 ${
							isActive 
								? 'bg-gradient-to-br from-blue-900/50 to-purple-900/50 border-blue-500' 
								: isCompleted
								? 'bg-slate-800/50 border-green-500'
								: 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
						}`}
					>
						{#if isActive}
							<div class="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 animate-pulse"></div>
						{/if}
						
						<CardContent class="p-6 relative z-10">
							<div class="flex items-center justify-between mb-4">
								<div class={`w-12 h-12 rounded-lg flex items-center justify-center ${
									isCompleted 
										? 'bg-green-600' 
										: isActive 
										? 'bg-gradient-to-r from-blue-600 to-purple-600' 
										: 'bg-slate-700'
								}`}>
									{#if isCompleted}
										<Check class="w-6 h-6 text-white" />
									{:else}
										<svelte:component this={Icon} class="w-6 h-6 text-white" />
									{/if}
								</div>
								
								{#if isActive}
									<div class="w-3 h-3 bg-blue-500 rounded-full animate-pulse-slow"></div>
								{/if}
							</div>

							<h3 class="text-xl font-semibold mb-2">{step.title}</h3>
							<p class="text-slate-400 mb-4">{step.description}</p>
							<p class="text-sm text-slate-500 mb-6">{step.detail}</p>

							{#if isActive && !isCompleted}
								<Button
									on:click={() => handleStepComplete(step.id)}
									class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
								>
									{#if step.id === 0}
										Connect Wallet
									{:else if step.id === 1}
										Sign & Register
									{:else if step.id === 2}
										Generate Key
									{/if}
									<ArrowRight class="ml-2 w-4 h-4" />
								</Button>
							{/if}

							{#if isCompleted}
								<div class="flex items-center text-green-500 text-sm">
									<Check class="w-4 h-4 mr-2" />
									Completed
								</div>
							{/if}
						</CardContent>
					</Card>
				</div>
			{/each}
		</div>

		<!-- Demo Video -->
		<div
			in:fly={{ y: 30, duration: 800, delay: 300, opacity: 0 }}
			class="max-w-2xl mx-auto mt-12 text-center"
		>
			<Card class="bg-slate-900/50 border-slate-700 overflow-hidden">
				<CardContent class="p-0">
					<div class="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
						<Button
							size="lg"
							class="bg-blue-600 hover:bg-blue-700 rounded-full w-16 h-16"
						>
							<div class="w-0 h-0 border-l-[12px] border-l-white border-y-[8px] border-y-transparent ml-1"></div>
						</Button>
						<div class="absolute bottom-4 left-4 text-sm text-slate-300">
							How to integrate Unreal API in 30 seconds
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	</div>
</section>

<style>
	@keyframes pulse-slow {
		0% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.1);
		}
		100% {
			transform: scale(1);
		}
	}
	
	.animate-pulse-slow {
		animation: pulse-slow 2s infinite;
	}
</style>
