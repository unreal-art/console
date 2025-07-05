<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';
	import { ChevronLeft, ChevronRight, Quote } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	
	let currentIndex = 0;
	let carouselTimer: ReturnType<typeof setInterval>;
	
	const testimonials = [
		{
			quote: "Unreal AI's on-chain billing gives us complete transparency that we've never had with traditional AI providers. The integration was seamless.",
			author: "Sarah Chen",
			title: "CTO at DeepTech Labs",
			company: "DeepTech Labs",
			avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b734?w=150&h=150&fit=crop&crop=face",
			logo: "🧬"
		},
		{
			quote: "The 1:1 token pricing model is genius. No more surprise bills or complex pricing tiers. Just simple, predictable costs for our AI workloads.",
			author: "Marcus Rodriguez", 
			title: "Lead Developer at BuildBot",
			company: "BuildBot",
			avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
			logo: "🤖"
		},
		{
			quote: "We migrated from OpenAI to Unreal in one afternoon. Zero code changes, better pricing, and blockchain transparency. It's a no-brainer.",
			author: "Elena Vasquez",
			title: "Founder & CEO at DataFlow",
			company: "DataFlow",
			avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
			logo: "📊"
		},
		{
			quote: "The enterprise security features and SOC2 compliance made our legal team happy, while the developer experience made our engineers happy.",
			author: "James Park",
			title: "VP Engineering at FinanceAI",
			company: "FinanceAI",
			avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
			logo: "💰"
		}
	];
	
	const companies = [
		{ name: "Soonami", logo: "🌊" },
		{ name: "Neoma Ventures", logo: "🚀" },
		{ name: "Token2049", logo: "🎯" },
		{ name: "DecenterAI", logo: "🔗" },
		{ name: "BlockTech", logo: "⚡" },
		{ name: "CryptoBuilders", logo: "🔨" }
	];
	
	onMount(() => {
		startCarouselTimer();
	});
	
	onDestroy(() => {
		clearInterval(carouselTimer);
	});
	
	function startCarouselTimer() {
		carouselTimer = setInterval(() => {
			currentIndex = currentIndex === testimonials.length - 1 ? 0 : currentIndex + 1;
		}, 5000);
	}
	
	function nextTestimonial() {
		clearInterval(carouselTimer);
		currentIndex = currentIndex === testimonials.length - 1 ? 0 : currentIndex + 1;
		startCarouselTimer();
	}
	
	function prevTestimonial() {
		clearInterval(carouselTimer);
		currentIndex = currentIndex === 0 ? testimonials.length - 1 : currentIndex - 1;
		startCarouselTimer();
	}
	
	function setTestimonial(index: number) {
		clearInterval(carouselTimer);
		currentIndex = index;
		startCarouselTimer();
	}
</script>

<section class="py-20 relative">
	<div class="container mx-auto px-6">
		<!-- Testimonials -->
		<div
			in:fly={{ y: 30, duration: 800, opacity: 0 }}
			class="text-center mb-16"
		>
			<h2 class="text-4xl font-bold mb-6">Trusted by Builders Worldwide</h2>
			<p class="text-xl text-slate-300 max-w-3xl mx-auto">
				Join thousands of developers and businesses who've made the switch to transparent, on-chain AI infrastructure.
			</p>
		</div>

		<div class="max-w-4xl mx-auto relative">
			<Card class="bg-slate-900/50 border-slate-700 min-h-[300px]">
				<CardContent class="p-8 md:p-12">
					{#key currentIndex}
						<div 
							in:fade={{ duration: 300 }}
							out:fade={{ duration: 200 }}
							class="text-center"
						>
							<Quote class="w-12 h-12 text-blue-500 mx-auto mb-6 opacity-50" />
							
							<blockquote class="text-xl md:text-2xl text-slate-200 mb-8 leading-relaxed">
								"{testimonials[currentIndex].quote}"
							</blockquote>

							<div class="flex items-center justify-center space-x-4">
								<img
									src={testimonials[currentIndex].avatar}
									alt={testimonials[currentIndex].author}
									class="w-16 h-16 rounded-full border-2 border-slate-600"
								/>
								<div class="text-left">
									<div class="font-semibold text-lg text-white">
										{testimonials[currentIndex].author}
									</div>
									<div class="text-slate-400">
										{testimonials[currentIndex].title}
									</div>
									<div class="flex items-center space-x-2 mt-1">
										<span class="text-2xl">{testimonials[currentIndex].logo}</span>
										<span class="text-blue-400 font-medium">
											{testimonials[currentIndex].company}
										</span>
									</div>
								</div>
							</div>
						</div>
					{/key}
				</CardContent>
			</Card>

			<!-- Navigation Buttons -->
			<Button
				variant="outline"
				size="icon"
				on:click={prevTestimonial}
				class="absolute left-4 top-1/2 transform -translate-y-1/2 bg-slate-800 border-slate-600 hover:bg-slate-700"
			>
				<ChevronLeft class="w-4 h-4" />
			</Button>
			
			<Button
				variant="outline"
				size="icon"
				on:click={nextTestimonial}
				class="absolute right-4 top-1/2 transform -translate-y-1/2 bg-slate-800 border-slate-600 hover:bg-slate-700"
			>
				<ChevronRight class="w-4 h-4" />
			</Button>

			<!-- Pagination Dots -->
			<div class="flex justify-center space-x-2 mt-8">
				{#each testimonials as _, index}
					<button
						on:click={() => setTestimonial(index)}
						class={`w-3 h-3 rounded-full transition-all duration-300 ${
							index === currentIndex 
								? 'bg-blue-500 w-8' 
								: 'bg-slate-600 hover:bg-slate-500'
						}`}
						aria-label={`Go to testimonial ${index + 1}`}
					></button>
				{/each}
			</div>
		</div>

		<!-- Company Logos -->
		<div
			in:fly={{ y: 30, duration: 800, delay: 300, opacity: 0 }}
			class="mt-20"
		>
			<div class="text-center mb-8">
				<p class="text-slate-400 text-lg">Mentioned by</p>
			</div>
			
			<div class="flex flex-wrap justify-center items-center gap-8 opacity-60">
				{#each companies as company, index}
					<div
						in:scale={{ delay: index * 100, duration: 300 }}
						class="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors cursor-pointer hover:scale-110"
					>
						<span class="text-2xl">{company.logo}</span>
						<span class="font-medium">{company.name}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Security Badges -->
		<div
			in:fly={{ y: 30, duration: 800, delay: 500, opacity: 0 }}
			class="mt-16 text-center"
		>
			<div class="flex flex-wrap justify-center gap-4">
				<Badge class="bg-green-800/30 text-green-400 border-green-600 px-4 py-2">
					🔒 Audited Smart Contracts
				</Badge>
				<Badge class="bg-blue-800/30 text-blue-400 border-blue-600 px-4 py-2">
					🛡️ SOC2 Type II Compliant
				</Badge>
				<Badge class="bg-purple-800/30 text-purple-400 border-purple-600 px-4 py-2">
					⚡ 99.9% Uptime SLA
				</Badge>
			</div>
		</div>
	</div>
</section>

<style>
	.transform {
		transform: translateY(-50%);
	}
	
	.hover\:scale-110:hover {
		transform: scale(1.1);
	}
</style>
