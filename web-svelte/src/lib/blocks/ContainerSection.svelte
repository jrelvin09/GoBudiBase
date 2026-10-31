<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Square } from 'lucide-svelte';

	let {
		title = '',
		direction = 'col', // 'col' | 'row'
		padding = 'p-6',
		border = true,
		background = 'bg-slate-900/60',
		children
	}: {
		title?: string;
		direction?: 'col' | 'row';
		padding?: string;
		border?: boolean;
		background?: string;
		children?: Snippet;
	} = $props();
</script>

<div
	class="rounded-2xl {background} {padding} {border ? 'border border-slate-800' : ''} shadow-xl backdrop-blur transition flex {direction === 'row' ? 'flex-row flex-wrap gap-4 items-center' : 'flex-col gap-4'}"
>
	{#if title}
		<div class="flex items-center gap-2 border-b border-slate-800 pb-2">
			<Square class="h-4 w-4 text-purple-400" />
			<h4 class="text-xs font-bold text-slate-200">{title}</h4>
		</div>
	{/if}

	{#if children}
		{@render children()}
	{:else}
		<div class="rounded-xl border border-dashed border-slate-700/60 p-6 text-center text-xs text-slate-500">
			[ Container Section Slot — Komponen anak dapat diletakkan di dalam wadah ini ]
		</div>
	{/if}
</div>
