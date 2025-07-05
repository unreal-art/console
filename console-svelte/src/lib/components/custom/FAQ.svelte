<script lang="ts">
	import { writable } from 'svelte/store';
	import { fade, fly, slide } from 'svelte/transition';
	import { ChevronDown, MessageCircle } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	
	// Simple replacement for useOpenWidget - in a real app, this might connect to a chat widget
	function openWidget() {
		window.open('mailto:support@unreal.ai', '_blank');
	}
	
	// Track which FAQ is open
	const openIndex = writable<number | null>(0);
	
	const faqs = [
		{
			question: "How does on-chain billing work?",
			answer: "Every API call is settled on-chain using smart contracts. You pay 1 $UNREAL token per inference, with all transactions recorded immutably on the blockchain. This provides complete transparency and eliminates hidden fees or surprise charges."
		},
		{
			question: "Is the API really OpenAI-compatible?",
			answer: "Yes, our API is 100% compatible with OpenAI's API specification. You can use existing OpenAI SDKs and simply change the base URL. No code changes required for models like GPT-4, GPT-3.5, and others."
		},
		{
			question: "What security measures do you have in place?",
			answer: "We implement enterprise-grade security including end-to-end encryption, secure key management, SOC2 Type II compliance, regular security audits, and blockchain-level transaction security. Your data and API keys are never stored in plain text."
		},
		{
			question: "How do I get started?",
			answer: "Simply connect your Web3 wallet (MetaMask, WalletConnect, etc.), register your business by signing an EIP-712 payload, and generate your API key. The entire process takes less than 2 minutes."
		},
		{
			question: "What happens if I run out of $UNREAL tokens?",
			answer: "API calls will be temporarily suspended until you top up your account. You can easily purchase more $UNREAL tokens through our dashboard using various cryptocurrencies or traditional payment methods."
		},
		{
			question: "Do you offer enterprise support?",
			answer: "Yes, we offer dedicated enterprise support including custom SLAs, priority support channels, volume discounts, custom billing arrangements, and dedicated account management for large-scale deployments."
		},
		{
			question: "Can I use this for production applications?",
			answer: "Absolutely. Our infrastructure is designed for production workloads with 99.9% uptime SLA, global edge computing, auto-scaling, and enterprise-grade security. Many businesses are already running production applications on our platform."
		},
		{
			question: "What's your roadmap?",
			answer: "We're launching with API access in July 2025, followed by AI agent hosting, advanced analytics dashboard, multi-model support, and integration with major blockchain networks. Check our roadmap for detailed timelines."
		}
	];
	
	function toggleFAQ(index: number) {
		openIndex.update(current => current === index ? null : index);
	}
	
	function handleJoinDiscord() {
		window.open('https://discord.gg/VzPQBKJ5EK', '_blank');
	}
	
	function handleTelegramChat() {
		window.open('https://t.me/ideomind', '_blank');
	}
</script>

<section class="py-20 relative">
	<div class="container mx-auto px-6">
		<div
			in:fly={{ y: 30, duration: 800, opacity: 0 }}
			class="text-center mb-16"
		>
			<h2 class="text-4xl font-bold mb-6">Frequently Asked Questions</h2>
			<p class="text-xl text-slate-300 max-w-3xl mx-auto">
				Get answers to common questions about Unreal AI's platform, security, and integration.
			</p>
		</div>

		<div class="max-w-4xl mx-auto">
			<div class="space-y-4">
				{#each faqs as faq, index}
					<div
						in:fly={{ y: 20, duration: 500, delay: index * 100, opacity: 0 }}
					>
						<Card class="bg-slate-900/50 border-slate-700 hover:border-slate-600 transition-colors">
							<CardContent class="p-0">
								<button
									on:click={() => toggleFAQ(index)}
									class="w-full text-left p-6 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
								>
									<h3 class="text-lg font-semibold text-white pr-4">
										{faq.question}
									</h3>
									<div
										class="flex-shrink-0 transform transition-transform duration-300"
										class:rotate-180={$openIndex === index}
									>
										<ChevronDown class="w-5 h-5 text-slate-400" />
									</div>
								</button>
								
								{#if $openIndex === index}
									<div transition:slide={{ duration: 300 }} class="overflow-hidden">
										<div class="px-6 pb-6 text-slate-300 leading-relaxed">
											{faq.answer}
										</div>
									</div>
								{/if}
							</CardContent>
						</Card>
					</div>
				{/each}
			</div>

			<!-- Contact Support -->
			<div
				in:fly={{ y: 30, duration: 800, delay: 300, opacity: 0 }}
				class="mt-12 text-center"
			>
				<Card class="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/30">
					<CardContent class="p-8">
						<MessageCircle class="w-12 h-12 text-blue-400 mx-auto mb-4" />
						<h3 class="text-xl font-semibold mb-4">Still have questions?</h3>
						<p class="text-slate-300 mb-6">
							Our support team is here to help you get started with Unreal AI.
						</p>
						<div class="flex flex-col sm:flex-row gap-4 justify-center">
							<Button 
								class="bg-blue-600 hover:bg-blue-700"
								on:click={openWidget}
							>
								Contact Support
							</Button>
							<Button 
								variant="outline" 
								class="border-slate-600 hover:bg-slate-800"
								on:click={handleJoinDiscord}
							>
								Join Discord
							</Button>
							<Button 
								variant="outline" 
								class="border-slate-600 hover:bg-slate-800"
								on:click={handleTelegramChat}
							>
								Telegram Chat
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	</div>
</section>

<style>
	.transform {
		transform: translateY(0);
	}
	
	.rotate-180 {
		transform: rotate(180deg);
	}
</style>
