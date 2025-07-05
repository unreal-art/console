<script lang="ts">
	import { onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Play, Copy, Check, Terminal } from 'lucide-svelte';
	
	let isRunning = false;
	let response = '';
	let copied = false;
	
	const sampleCode = `const response = await fetch('https://openai.unreal.art/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-api-key-here',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'unreal::mixtral-8x22b-instruct',
    messages: [{
      role: 'user', 
      content: 'Explain quantum computing in simple terms'
    }]
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);`;

	const mockResponse = `{
  "id": "chatcmpl-7X8Y9Z0A1B2C3D4E5F",
  "object": "chat.completion",
  "created": 1735747200,
  "model": "unreal::mixtral-8x22b-instruct",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Quantum computing uses the strange properties of quantum mechanics to process information in ways that classical computers cannot. Think of it like this: while regular computers use bits that are either 0 or 1, quantum computers use 'qubits' that can be both 0 and 1 simultaneously - like a spinning coin that's both heads and tails until it lands."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 12,
    "completion_tokens": 67,
    "total_tokens": 79
  },
  "billing": {
    "cost_unreal_tokens": 1,
    "transaction_hash": "0xabc123..."
  }
}`;

	function handleRunCode() {
		isRunning = true;
		response = '';
		
		// Simulate API call with streaming effect
		setTimeout(() => {
			const words = mockResponse.split(' ');
			let currentIndex = 0;
			
			const streamInterval = setInterval(() => {
				if (currentIndex < words.length) {
					response += (currentIndex === 0 ? '' : ' ') + words[currentIndex];
					currentIndex++;
				} else {
					clearInterval(streamInterval);
					isRunning = false;
				}
			}, 50);
		}, 500);
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		copied = true;
		setTimeout(() => copied = false, 2000);
	}
</script>

<section class="py-20 relative">
	<div class="container mx-auto px-6">
		<div 
			in:fly={{ y: 30, duration: 800, delay: 100 }}
			class="text-center mb-12"
		>
			<h2 class="text-4xl font-bold mb-6">Try It Live</h2>
			<p class="text-xl text-slate-300 mb-8">
				Test our API with your key and see real-time responses
			</p>
		</div>

		<div class="max-w-6xl mx-auto">
			<div class="grid lg:grid-cols-2 gap-8">
				<!-- Code Editor -->
				<Card class="bg-slate-900/50 border-slate-700">
					<CardContent class="p-0">
						<div class="bg-slate-800 px-4 py-2 flex items-center justify-between border-b border-slate-700">
							<div class="flex items-center space-x-2">
								<Terminal class="w-4 h-4 text-slate-400" />
								<span class="text-sm text-slate-300">API Test</span>
							</div>
							<div class="flex items-center space-x-2">
								<Button
									size="sm"
									variant="ghost"
									on:click={() => copyToClipboard(sampleCode)}
									class="text-slate-400 hover:text-white"
								>
									{#if copied}
										<Check class="w-4 h-4" />
									{:else}
										<Copy class="w-4 h-4" />
									{/if}
								</Button>
								<Button
									size="sm"
									on:click={handleRunCode}
									disabled={isRunning}
									class="bg-green-600 hover:bg-green-700"
								>
									{#if isRunning}
										<div
											class="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2 animate-spin"
										></div>
										Running...
									{:else}
										<Play class="w-4 h-4 mr-2" />
										Run
									{/if}
								</Button>
							</div>
						</div>
						
						<div class="p-6 bg-slate-950">
							<pre class="text-sm text-green-400 overflow-x-auto">
								<code>{sampleCode}</code>
							</pre>
						</div>
					</CardContent>
				</Card>

				<!-- Response Panel -->
				<Card class="bg-slate-900/50 border-slate-700">
					<CardContent class="p-0">
						<div class="bg-slate-800 px-4 py-2 flex items-center justify-between border-b border-slate-700">
							<div class="flex items-center space-x-2">
								<div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
								<span class="text-sm text-slate-300">Live Response</span>
							</div>
							<div class="flex items-center space-x-2">
								<Badge variant="secondary" class="bg-blue-600 text-white">
									1 $UNREAL
								</Badge>
								<Badge variant="secondary" class="bg-slate-700">
									79 tokens
								</Badge>
							</div>
						</div>
						
						<div class="p-6 bg-slate-950 min-h-[300px]">
							{#if response}
								<pre 
									in:fade={{ duration: 300 }}
									class="text-sm text-blue-400 overflow-x-auto whitespace-pre-wrap"
								>
									<code>{response}</code>
								</pre>
							{:else}
								<div class="flex items-center justify-center h-full text-slate-500">
									<div class="text-center">
										<Terminal class="w-12 h-12 mx-auto mb-4 opacity-50" />
										<p>Click "Run" to see the API response</p>
									</div>
								</div>
							{/if}
						</div>
					</CardContent>
				</Card>
			</div>

			<!-- Real-time Features -->
			<div
				in:fly={{ y: 20, duration: 800, delay: 300 }}
				class="mt-8 grid md:grid-cols-3 gap-4"
			>
				<Card class="bg-slate-800/50 border-slate-700 p-4">
					<div class="flex items-center space-x-3">
						<div class="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
							⚡
						</div>
						<div>
							<h4 class="font-semibold">Real-time Streaming</h4>
							<p class="text-sm text-slate-400">Token-by-token responses</p>
						</div>
					</div>
				</Card>

				<Card class="bg-slate-800/50 border-slate-700 p-4">
					<div class="flex items-center space-x-3">
						<div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
							🔗
						</div>
						<div>
							<h4 class="font-semibold">On-chain Billing</h4>
							<p class="text-sm text-slate-400">Transparent transactions</p>
						</div>
					</div>
				</Card>

				<Card class="bg-slate-800/50 border-slate-700 p-4">
					<div class="flex items-center space-x-3">
						<div class="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
							📊
						</div>
						<div>
							<h4 class="font-semibold">Usage Analytics</h4>
							<p class="text-sm text-slate-400">Detailed metrics</p>
						</div>
					</div>
				</Card>
			</div>
		</div>
	</div>
</section>

<style>
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.animate-spin {
		animation: spin 1s linear infinite;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 0.5;
		}
		50% {
			opacity: 1;
		}
	}

	.animate-pulse {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}
</style>
