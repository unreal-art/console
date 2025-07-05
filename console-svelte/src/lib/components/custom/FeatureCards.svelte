<script lang="ts">
	import { fly, scale } from 'svelte/transition';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Shield, Zap, Globe, DollarSign } from 'lucide-svelte';
	
	const features = [
		{
			icon: DollarSign,
			title: "On-chain Billing, Zero Surprises",
			description: "Transparent, immutable billing records on the blockchain. Every transaction is verifiable and auditable.",
			gradient: "from-green-500 to-emerald-600",
			details: [
				"Real-time transaction tracking",
				"Immutable billing records", 
				"Gas-optimized smart contracts",
				"Multi-chain support"
			]
		},
		{
			icon: Zap,
			title: "Pay as You Go: 1 $UNREAL = 1 Inference",
			description: "Simple, predictable pricing. No hidden fees, no monthly commitments. Just pay for what you use.",
			gradient: "from-yellow-500 to-orange-600",
			details: [
				"No minimum spend requirements",
				"Instant top-up with crypto",
				"Volume discounts available",
				"Enterprise billing options"
			]
		},
		{
			icon: Shield,
			title: "Enterprise-Grade Security",
			description: "Bank-level security with end-to-end encryption, secure key management, and SOC2 compliance.",
			gradient: "from-blue-500 to-cyan-600",
			details: [
				"End-to-end encryption",
				"SOC2 Type II compliant",
				"Secure key management",
				"Regular security audits"
			]
		},
		{
			icon: Globe,
			title: "Unlimited Scale, Decentralized Compute",
			description: "Leverage our global network of GPU clusters for unlimited scaling without infrastructure concerns.",
			gradient: "from-purple-500 to-pink-600",
			details: [
				"Global GPU network",
				"Auto-scaling infrastructure",
				"99.9% uptime SLA",
				"Edge computing support"
			]
		}
	];
	
	const stats = [
		{ number: "99.9%", label: "Uptime SLA" },
		{ number: "<50ms", label: "Average Latency" },
		{ number: "3,500+", label: "Businesses Onboarded" },
		{ number: "50M+", label: "API Calls Processed" }
	];
</script>

<section class="py-20 relative">
	<div class="container mx-auto px-6">
		<div
			in:fly={{ y: 30, duration: 800, opacity: 0 }}
			class="text-center mb-16"
		>
			<h2 class="text-4xl font-bold mb-6">Why Choose Unreal AI</h2>
			<p class="text-xl text-slate-300 max-w-3xl mx-auto">
				Built for developers who demand transparency, security, and scale. 
				Experience the future of AI infrastructure.
			</p>
		</div>

		<div class="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
			{#each features as feature, index}
				<div 
					in:fly={{ y: 30, duration: 600, delay: index * 100, opacity: 0 }}
					class="feature-card"
				>
					<Card class="bg-slate-900/50 border-slate-700 hover:border-slate-600 transition-all duration-300 h-full group">
						<CardContent class="p-8">
							<div class="flex items-start space-x-4 mb-6">
								<div class={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
									<svelte:component this={feature.icon} class="w-6 h-6 text-white" />
								</div>
								<div class="flex-1">
									<h3 class="text-xl font-semibold mb-3 group-hover:text-blue-400 transition-colors">
										{feature.title}
									</h3>
									<p class="text-slate-300 leading-relaxed mb-6">
										{feature.description}
									</p>
								</div>
							</div>

							<div class="space-y-3">
								{#each feature.details as detail, detailIndex}
									<div 
										in:fly={{ x: -20, duration: 300, delay: 100 * detailIndex + 300, opacity: 0 }}
										class="flex items-center space-x-3"
									>
										<div class={`w-2 h-2 rounded-full bg-gradient-to-r ${feature.gradient}`}></div>
										<span class="text-sm text-slate-400">{detail}</span>
									</div>
								{/each}
							</div>

							<!-- Hover effect overlay -->
							<div class="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
						</CardContent>
					</Card>
				</div>
			{/each}
		</div>

		<!-- Stats Section -->
		<div
			in:fly={{ y: 30, duration: 800, delay: 400, opacity: 0 }}
			class="mt-20 grid md:grid-cols-4 gap-8 max-w-4xl mx-auto"
		>
			{#each stats as stat, index}
				<div 
					in:scale={{ duration: 400, delay: index * 100 + 500, opacity: 0, start: 0.8 }}
					class="text-center"
				>
					<div class="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
						{stat.number}
					</div>
					<div class="text-slate-400 text-sm">{stat.label}</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<style>
	.feature-card {
		transition: transform 0.3s ease;
	}
	
	.feature-card:hover {
		transform: translateY(-5px);
	}
	
	:global(.bg-clip-text) {
		-webkit-background-clip: text;
		background-clip: text;
	}
</style>
