<script lang="ts">
	import { cn } from '$lib/utils';
	import { t } from '$lib/i18n/index.svelte';

	// Palette utilities are spelled out so Tailwind emits them (T0-02).
	const STRONG: Record<number, string> = {
		1: 'bg-palette-1', 2: 'bg-palette-2', 3: 'bg-palette-3', 4: 'bg-palette-4',
		5: 'bg-palette-5', 6: 'bg-palette-6', 7: 'bg-palette-7', 8: 'bg-palette-8',
		9: 'bg-palette-9', 10: 'bg-palette-10', 11: 'bg-palette-11', 12: 'bg-palette-12'
	};
	const SUBTLE: Record<number, string> = {
		1: 'bg-palette-1-subtle', 2: 'bg-palette-2-subtle', 3: 'bg-palette-3-subtle', 4: 'bg-palette-4-subtle',
		5: 'bg-palette-5-subtle', 6: 'bg-palette-6-subtle', 7: 'bg-palette-7-subtle', 8: 'bg-palette-8-subtle',
		9: 'bg-palette-9-subtle', 10: 'bg-palette-10-subtle', 11: 'bg-palette-11-subtle', 12: 'bg-palette-12-subtle'
	};
	const COLORS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

	let {
		value = $bindable<number | null>(null),
		mode = 'subtle'
	}: {
		value?: number | null;
		mode?: 'subtle' | 'strong';
	} = $props();

	function keydown(event: KeyboardEvent) {
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
		event.preventDefault();
		const current = value ?? 0;
		const next = event.key === 'ArrowLeft' ? current - 1 : current + 1;
		value = next < 1 ? null : next > 12 ? 12 : next;
	}
</script>

<div class="flex flex-wrap items-center gap-1" role="radiogroup" tabindex={0} onkeydown={keydown}>
	<button
		type="button"
		role="radio"
		aria-checked={value === null}
		aria-label={t('kit.ir.color_none')}
		title={t('kit.ir.color_none')}
		class={cn(
			'border-input flex size-6 items-center justify-center rounded border text-xs',
			value === null && 'ring-ring ring-2'
		)}
		onclick={() => (value = null)}
	>
		×
	</button>
	{#each COLORS as n (n)}
		<button
			type="button"
			role="radio"
			aria-checked={value === n}
			aria-label={t('kit.ir.color_n', { n })}
			title={t('kit.ir.color_n', { n })}
			class={cn(
				'size-6 rounded border border-transparent',
				mode === 'subtle' ? SUBTLE[n] : STRONG[n],
				value === n && 'ring-ring ring-2'
			)}
			onclick={() => (value = n)}
		></button>
	{/each}
</div>
