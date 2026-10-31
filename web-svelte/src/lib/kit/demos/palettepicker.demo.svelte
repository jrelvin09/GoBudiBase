<script lang="ts">
	import PalettePicker from '$lib/kit/molecules/PalettePicker.svelte';
	import { cn } from '$lib/utils';

	let bg = $state<number | null>(3);
	let fg = $state<number | null>(null);

	const BG: Record<number, string> = {
		1: 'bg-palette-1-subtle', 2: 'bg-palette-2-subtle', 3: 'bg-palette-3-subtle', 4: 'bg-palette-4-subtle'
	};
	const FG: Record<number, string> = { 1: 'text-palette-1', 2: 'text-palette-2', 3: 'text-palette-3', 4: 'text-palette-4' };
</script>

<div class="flex flex-col gap-4">
	<div class="flex flex-col gap-1">
		<span class="text-sm font-medium">Background (subtle)</span>
		<PalettePicker bind:value={bg} mode="subtle" />
	</div>
	<div class="flex flex-col gap-1">
		<span class="text-sm font-medium">Text (strong)</span>
		<PalettePicker bind:value={fg} mode="strong" />
	</div>
	<div class={cn('rounded-md border border-border px-3 py-2 text-sm', bg ? BG[bg] : '', fg ? FG[fg] : '')}>
		Sample row
	</div>
</div>
