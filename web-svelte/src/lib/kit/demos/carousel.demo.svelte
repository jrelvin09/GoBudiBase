<script lang="ts">
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { Button } from '$lib/components/ui/button';
	import { t } from '$lib/i18n/index.svelte';

	const slides = [1, 2, 3, 4];
	const tones = ['bg-palette-1-subtle', 'bg-palette-3-subtle', 'bg-palette-5-subtle', 'bg-palette-7-subtle'];

	let track: HTMLDivElement | undefined = $state();

	function slide(direction: number) {
		const el = track;
		if (!el) return;
		el.scrollBy({ left: direction * el.clientWidth, behavior: 'smooth' });
	}
</script>

<div class="flex max-w-xl flex-col gap-3">
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -- wadah gulir harus bisa difokuskan agar panah keyboard menggulir slide (WCAG 2.1.1). -->
	<div
		bind:this={track}
		class="border-border flex w-full snap-x snap-mandatory overflow-x-auto rounded-lg border"
		tabindex="0"
		role="region"
		aria-label={t('kit.demo.slide', { n: '1–4' })}
	>
		{#each slides as n (n)}
			<div
				class="flex h-40 w-full shrink-0 snap-center items-center justify-center text-sm font-medium {tones[n - 1]}"
			>
				{t('kit.demo.slide', { n })}
			</div>
		{/each}
	</div>
	<div class="flex items-center justify-end gap-2">
		<Button variant="outline" size="icon-sm" aria-label={t('kit.ir.previous')} onclick={() => slide(-1)}>
			<ChevronLeftIcon />
		</Button>
		<Button variant="outline" size="icon-sm" aria-label={t('kit.ir.next')} onclick={() => slide(1)}>
			<ChevronRightIcon />
		</Button>
	</div>
</div>
