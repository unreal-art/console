<script lang="ts">
	import { onMount } from 'svelte';
	// Import UI components
	import { Button } from "$lib/components/ui/button";
	import { Card, CardContent } from "$lib/components/ui/card";
	import { Badge } from "$lib/components/ui/badge";
	import { Tabs, TabsContent, TabsList, TabsTrigger } from "$lib/components/ui/tabs";
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "$lib/components/ui/dialog";
	
	// Import custom components
	import AnimatedBackground from "$lib/components/custom/AnimatedBackground.svelte";
	import CodePlayground from "$lib/components/custom/CodePlayground.svelte";
	import FeatureCards from "$lib/components/custom/FeatureCards.svelte";
	import TestimonialCarousel from "$lib/components/custom/TestimonialCarousel.svelte";
	import FAQ from "$lib/components/custom/FAQ.svelte";
	import OnboardingFlow from "$lib/components/custom/OnboardingFlow.svelte";
	
	// State variables
	let copied = false;
	let currentStep = 0;
	let timeLeft = {
		days: 0,
		hours: 0,
		minutes: 0,
		seconds: 0
	};
	
	// Scroll effects (we'll implement a simpler version than React's framer-motion)
	let scrollY = 0;
	$: heroY = -scrollY / 6; // Simple scroll parallax effect
	$: opacity = 1 - (scrollY / 300) * 0.2; // Simple opacity effect

	function handleScroll() {
		scrollY = window.scrollY;
	}
	
	onMount(() => {
		window.addEventListener('scroll', handleScroll);
		
		// Timer for countdown
		const targetDate = new Date('August 2, 2025 00:00:00').getTime();
		
		const timer = setInterval(() => {
			const now = new Date().getTime();
			const distance = targetDate - now;
			
			const days = Math.floor(distance / (1000 * 60 * 60 * 24));
			const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
			const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
			const seconds = Math.floor((distance % (1000 * 60)) / 1000);
			
			timeLeft = { days, hours, minutes, seconds };
			
			if (distance < 0) {
				clearInterval(timer);
				timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
			}
		}, 1000);
		
		return () => {
			window.removeEventListener('scroll', handleScroll);
			clearInterval(timer);
		};
	});
	
	const trustBadges = [
		"Secured by Blockchain",
		"OpenAI-Compatible",
		"Backed by DecenterAI",
		"3,500+ Businesses Onboarded"
	];
	
	const codeExamples = {
		curl: `curl -X POST "https://openai.unreal.art/v1/chat/completions" \\
  -H "Authorization: Bearer your-api-key-here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "unreal::mixtral-8x22b-instruct",
    "messages": [{"role": "user", "content": "Hello world!"}]
  }'`,
		python: `import openai

client = openai.OpenAI(
    api_key="your-api-key-here",
    base_url="https://openai.unreal.art/v1"
)

response = client.chat.completions.create(
    model="unreal::mixtral-8x22b-instruct",
    messages=[{"role": "user", "content": "Hello world!"}]
)

print(response.choices[0].message.content)`,
		javascript: `import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'your-api-key-here',
  baseURL: 'https://openai.unreal.art/v1'
});

const response = await client.chat.completions.create({
  model: 'unreal::mixtral-8x22b-instruct',
  messages: [{ role: 'user', content: 'Hello world!' }]
});

console.log(response.choices[0].message.content);`
	};
	
	function copyToClipboard(text) {
		navigator.clipboard.writeText(text);
		copied = true;
		setTimeout(() => copied = false, 2000);
	}
	
	function handleWalletConnect() {
		console.log('Connecting wallet...');
		// This would integrate with Blocknative Onboard SDK
	}
	
	function handleViewDocs() {
		// For now, just show the coming soon modal
		// Later this would redirect to docs.openai.unreal.art
	}
</script>

<div class="relative min-h-screen bg-slate-950 text-white overflow-hidden">
  <!-- AnimatedBackground Component -->
  <AnimatedBackground />
  
  <!-- Sticky CTA Bar -->
  <div 
    class="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800"
    style="transform: translateY(0); transition: transform 500ms ease-out;"
  >
    <div class="container mx-auto px-6 py-3 flex justify-between items-center">
      <div class="flex items-center space-x-2">
        <!-- Will replace with the actual logo -->
        <div class="w-8 h-8 bg-blue-500 rounded-full"></div>
        <span class="font-bold text-lg">Unreal AI</span>
      </div>
      <Button 
        class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        on:click={handleWalletConnect}
      >
        Connect Wallet & Get API Key
        <!-- ArrowRight icon -->
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-2 w-4 h-4"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
      </Button>
    </div>
  </div>

  <!-- Hero Section -->
  <section 
    class="relative min-h-screen flex items-center justify-center pt-20"
    style="transform: translateY({heroY}px); opacity: {opacity};"
  >
    <div class="container mx-auto px-6 text-center z-10">
      <div
        style="opacity: 1; transform: translateY(0); transition: opacity 800ms ease, transform 800ms ease;"
      >
        <h1 class="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent">
          The Open, On-Chain
          <br />
          AI API for Builders
        </h1>
        
        <p class="text-xl md:text-2xl text-slate-300 mb-8 max-w-4xl mx-auto leading-relaxed">
          Connect your wallet. Register your business. Instantly generate secure API keys 
          for OpenAI-compatible inference—settled transparently on-chain.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button 
            size="lg" 
            class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4"
            on:click={handleWalletConnect}
          >
            Connect Wallet & Get Started
            <!-- ArrowRight icon -->
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-2 w-5 h-5"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
          </Button>
          
          <Dialog>
            <DialogTrigger>
              <Button 
                size="lg" 
                variant="outline" 
                class="border-slate-600 hover:bg-slate-800 text-lg px-8 py-4"
              >
                View API Docs
                <!-- Code icon -->
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-2 w-5 h-5"><path d="m18 16-4-4 4-4"></path><path d="m6 8 4 4-4 4"></path></svg>
              </Button>
            </DialogTrigger>
            <DialogContent class="bg-slate-900 border-slate-700 text-white max-w-md">
              <DialogHeader>
                <DialogTitle class="text-center text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  Coming Soon
                </DialogTitle>
              </DialogHeader>
              <div class="text-center py-6">
                <!-- Clock icon -->
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-16 h-16 mx-auto mb-4 text-blue-500"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <p class="text-slate-300 mb-6">
                  API Documentation launches on
                </p>
                <div class="text-3xl font-bold mb-6 text-blue-400">
                  August 2nd, 2025
                </div>
                <div class="grid grid-cols-4 gap-4 mb-6">
                  <div class="text-center">
                    <div class="text-2xl font-bold text-white">{timeLeft.days}</div>
                    <div class="text-sm text-slate-400">Days</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-bold text-white">{timeLeft.hours}</div>
                    <div class="text-sm text-slate-400">Hours</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-bold text-white">{timeLeft.minutes}</div>
                    <div class="text-sm text-slate-400">Minutes</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-bold text-white">{timeLeft.seconds}</div>
                    <div class="text-sm text-slate-400">Seconds</div>
                  </div>
                </div>
                <p class="text-slate-400 text-sm">
                  Get early access by connecting your wallet now
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <!-- Trust Badges -->
        <div class="flex flex-wrap justify-center gap-4 mb-8">
          {#each trustBadges as badge, index}
            <div
              style="opacity: 1; transform: scale(1); transition: opacity 300ms ease {index * 100}ms, transform 300ms ease {index * 100}ms;"
            >
              <Badge variant="secondary" class="bg-slate-800/50 text-slate-300 px-4 py-2">
                {badge}
              </Badge>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </section>

  <!-- OnboardingFlow Component -->
  <OnboardingFlow />

  <!-- Code Examples Section -->
  <section class="py-20 relative">
    <div class="container mx-auto px-6">
      <div
        style="opacity: 1; transform: translateY(0); transition: opacity 800ms ease, transform 800ms ease;"
        class="text-center mb-12"
      >
        <h2 class="text-4xl font-bold mb-6">Works with Your Favorite SDKs</h2>
        <p class="text-xl text-slate-300 mb-8">
          Drop-in replacement for OpenAI API. Zero code changes required.
        </p>
      </div>

      <Card class="bg-slate-900/50 border-slate-700 backdrop-blur-sm">
        <CardContent class="p-0">
          <Tabs value="curl" class="w-full">
            <TabsList class="grid w-full grid-cols-3 bg-slate-800/50">
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
            </TabsList>
            
            <TabsContent value="curl" class="relative">
              <div class="bg-slate-950 p-6 rounded-b-lg">
                <div class="flex justify-between items-center mb-4">
                  <span class="text-slate-400 text-sm">
                    Works out of the box with your favorite OpenAI SDKs
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    on:click={() => copyToClipboard(codeExamples.curl)}
                    class="text-slate-400 hover:text-white"
                  >
                    {#if copied}
                      <!-- Check icon -->
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M20 6 9 17l-5-5"></path></svg>
                      Copied!
                    {:else}
                      <!-- Copy icon -->
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
                      Copy
                    {/if}
                  </Button>
                </div>
                <pre class="text-sm text-green-400 overflow-x-auto">
                  <code>{codeExamples.curl}</code>
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="python" class="relative">
              <div class="bg-slate-950 p-6 rounded-b-lg">
                <div class="flex justify-between items-center mb-4">
                  <span class="text-slate-400 text-sm">
                    Works out of the box with your favorite OpenAI SDKs
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    on:click={() => copyToClipboard(codeExamples.python)}
                    class="text-slate-400 hover:text-white"
                  >
                    {#if copied}
                      <!-- Check icon -->
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M20 6 9 17l-5-5"></path></svg>
                      Copied!
                    {:else}
                      <!-- Copy icon -->
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
                      Copy
                    {/if}
                  </Button>
                </div>
                <pre class="text-sm text-green-400 overflow-x-auto">
                  <code>{codeExamples.python}</code>
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="javascript" class="relative">
              <div class="bg-slate-950 p-6 rounded-b-lg">
                <div class="flex justify-between items-center mb-4">
                  <span class="text-slate-400 text-sm">
                    Works out of the box with your favorite OpenAI SDKs
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    on:click={() => copyToClipboard(codeExamples.javascript)}
                    class="text-slate-400 hover:text-white"
                  >
                    {#if copied}
                      <!-- Check icon -->
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M20 6 9 17l-5-5"></path></svg>
                      Copied!
                    {:else}
                      <!-- Copy icon -->
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
                      Copy
                    {/if}
                  </Button>
                </div>
                <pre class="text-sm text-green-400 overflow-x-auto">
                  <code>{codeExamples.javascript}</code>
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  </section>

  <!-- CodePlayground Component -->
  <CodePlayground />

  <!-- FeatureCards Component -->
  <FeatureCards />

  <!-- TestimonialCarousel Component -->
  <TestimonialCarousel />

  <!-- App Availability Section -->
  <section class="py-20">
    <div class="container mx-auto px-6 text-center">
      <div
        style="opacity: 1; transform: translateY(0); transition: opacity 800ms ease, transform 800ms ease;"
      >
        <h2 class="text-4xl font-bold mb-6">Available Everywhere</h2>
        <p class="text-xl text-slate-300 mb-12">
          Beta launches August 2nd, 2025. Get early access now.
        </p>

        <div class="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card class="bg-slate-900/50 border-slate-700">
            <CardContent class="p-6 text-center">
              <!-- Globe icon -->
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-12 h-12 mx-auto mb-4 text-blue-500"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path><path d="M2 12h20"></path></svg>
              <h3 class="text-xl font-semibold mb-2">Web Console</h3>
              <p class="text-slate-400 mb-4">Full-featured dashboard</p>
              <Badge class="bg-green-600">Live Now</Badge>
            </CardContent>
          </Card>

          <Card class="bg-slate-900/50 border-slate-700">
            <CardContent class="p-6 text-center">
              <div class="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                📱
              </div>
              <h3 class="text-xl font-semibold mb-2">iOS App</h3>
              <p class="text-slate-400 mb-4">Native mobile experience</p>
              <Button variant="outline" size="sm">Notify Me</Button>
            </CardContent>
          </Card>

          <Card class="bg-slate-900/50 border-slate-700">
            <CardContent class="p-6 text-center">
              <div class="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                🤖
              </div>
              <h3 class="text-xl font-semibold mb-2">Android App</h3>
              <p class="text-slate-400 mb-4">Cross-platform support</p>
              <Button variant="outline" size="sm">Notify Me</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </section>

  <!-- Placeholder for FAQ -->
  <!-- <FAQ /> -->

  <!-- Footer -->
  <footer class="bg-slate-950 border-t border-slate-800 py-12">
    <div class="container mx-auto px-6">
      <div class="grid md:grid-cols-4 gap-8">
        <div>
          <div class="flex items-center space-x-2 mb-4">
            <!-- Will replace with actual logo -->
            <div class="w-8 h-8 bg-blue-500 rounded-full"></div>
            <span class="font-bold text-lg">Unreal AI</span>
          </div>
          <p class="text-slate-400">
            The open, on-chain AI API platform for businesses.
          </p>
        </div>

        <div>
          <h4 class="font-semibold mb-4">Developers</h4>
          <ul class="space-y-2 text-slate-400">
            <li><a href="#" class="hover:text-white transition-colors">API Docs</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Status</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Changelog</a></li>
          </ul>
        </div>

        <div>
          <h4 class="font-semibold mb-4">Community</h4>
          <ul class="space-y-2 text-slate-400">
            <li><a href="https://discord.gg/VzPQBKJ5EK" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors">Discord</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Twitter</a></li>
            <li><a href="#" class="hover:text-white transition-colors">GitHub</a></li>
          </ul>
        </div>

        <div>
          <h4 class="font-semibold mb-4">Legal</h4>
          <ul class="space-y-2 text-slate-400">
            <li><a href="#" class="hover:text-white transition-colors">Privacy</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Terms</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Compliance</a></li>
          </ul>
        </div>
      </div>

      <div class="mt-12 pt-8 border-t border-slate-800 text-center text-slate-400">
        <p> {new Date().getFullYear()} Unreal AI. All rights reserved.</p>
      </div>
    </div>
  </footer>
</div>
