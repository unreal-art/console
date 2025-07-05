<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { spring } from 'svelte/motion';
	
	// Generate random positions for nodes
	const nodes = Array.from({ length: 50 }, (_, i) => ({
		id: i,
		x: Math.random() * 100,
		y: Math.random() * 100,
		size: Math.random() * 4 + 2,
		delay: Math.random() * 2
	}));
	
	// Create connection lines for the first 20 nodes
	const connections = nodes.slice(0, 20).map((node, i) => {
		const nextNode = nodes[(i + 1) % 20];
		return {
			id: i,
			x1: `${node.x}%`,
			y1: `${node.y}%`,
			x2: `${nextNode.x}%`,
			y2: `${nextNode.y}%`,
			delay: node.delay
		};
	});
	
	// Floating tokens
	const tokens = Array.from({ length: 8 }, (_, i) => ({
		id: i,
		x: `${20 + i * 10}%`,
		y: '50%',
		delay: i * 2
	}));
	
	// Floating particles
	const particles = Array.from({ length: 30 }, (_, i) => ({
		id: i,
		left: `${Math.random() * 100}%`,
		top: `${Math.random() * 100}%`,
		delay: Math.random() * 4
	}));
	
	let mounted = false;

	onMount(() => {
		mounted = true;
	});
</script>

<div class="fixed inset-0 overflow-hidden pointer-events-none">
	{#if mounted}
		<!-- Gradient overlay -->
		<div class="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 opacity-90"></div>
		
		<!-- Neural network nodes and connections -->
		<svg class="absolute inset-0 w-full h-full">
			<defs>
				<radialGradient id="nodeGradient" cx="50%" cy="50%" r="50%">
					<stop offset="0%" stop-color="#3b82f6" stop-opacity="0.8" />
					<stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.2" />
				</radialGradient>
				
				<filter id="glow">
					<feGaussianBlur stdDeviation="3" result="coloredBlur"/>
					<feMerge> 
						<feMergeNode in="coloredBlur"/>
						<feMergeNode in="SourceGraphic"/>
					</feMerge>
				</filter>
			</defs>
	
			<!-- Connection lines -->
			{#each connections as conn}
				<line 
					x1={conn.x1}
					y1={conn.y1}
					x2={conn.x2}
					y2={conn.y2}
					stroke="url(#nodeGradient)"
					stroke-width="1"
					opacity="0.3"
					stroke-dasharray="1"
					class="animate-pulse"
				/>
			{/each}
	
			<!-- Animated nodes -->
			{#each nodes as node}
				<circle
					cx={`${node.x}%`}
					cy={`${node.y}%`}
					r={node.size}
					fill="url(#nodeGradient)"
					filter="url(#glow)"
					class="animate-pulse"
					style={`animation-delay: ${node.delay}s`}
				/>
			{/each}
	
			<!-- Floating $UNREAL tokens -->
			{#each tokens as token}
				<g 
					in:fly={{ y: 500, duration: 8000, delay: token.delay * 1000 }}
					animate:flip={{ duration: 2000 }}
				>
					<circle
						cx={token.x}
						cy={token.y}
						r="3"
						fill="#fbbf24"
						filter="url(#glow)"
					/>
					<text
						x={token.x}
						y={token.y}
						text-anchor="middle"
						dy="0.3em"
						font-size="8"
						fill="#fbbf24"
						font-weight="bold"
					>
						$U
					</text>
				</g>
			{/each}
		</svg>
	
		<!-- Floating particles -->
		<div class="absolute inset-0">
			{#each particles as particle}
				<div 
					class="absolute w-1 h-1 bg-blue-400 rounded-full"
					style={`left: ${particle.left}; top: ${particle.top};`}
					in:fly={{ y: 100, duration: 4000, delay: particle.delay * 1000, opacity: 0 }}
				></div>
			{/each}
		</div>
	{/if}
</div>

<style>
	@keyframes pulse {
		0%, 100% { opacity: 0.5; transform: scale(1); }
		50% { opacity: 1; transform: scale(1.2); }
	}
	
	.animate-pulse {
		animation: pulse 2s infinite ease-in-out;
	}
</style>
