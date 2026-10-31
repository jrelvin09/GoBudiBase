<script lang="ts">
	import { t } from '$lib/i18n/index.svelte';
	import { cn } from '$lib/utils';
	import StarIcon from '@lucide/svelte/icons/star';

	// Rating (padanan komponen Rating template): mode baca saja untuk ringkasan,
	// mode interaktif memakai pola radiogroup + panah keyboard.
	let {
		value = $bindable(0),
		max = 5,
		readOnly = false,
		label,
		size = 'md',
		onchange
	}: {
		value?: number;
		max?: number;
		readOnly?: boolean;
		label: string;
		size?: 'sm' | 'md';
		onchange?: (value: number) => void;
	} = $props();

	const steps = $derived(Array.from({ length: max }, (_, index) => index + 1));
	const sizeClass = $derived(size === 'sm' ? 'size-3.5' : 'size-5');
	let group: HTMLSpanElement | undefined = $state();

	function set(next: number) {
		if (readOnly) return;
		value = next;
		onchange?.(next);
	}

	function onKeydown(event: KeyboardEvent) {
		if (readOnly) return;
		let next: number;
		if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = Math.min(max, value + 1);
		else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = Math.max(1, value - 1);
		else if (event.key === 'Home') next = 1;
		else if (event.key === 'End') next = max;
		else return;
		event.preventDefault();
		set(next);
		group?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next - 1]?.focus();
	}
</script>

{#if readOnly}
	<span class="inline-flex items-center gap-0.5" role="img" aria-label={t('kit.demo.rating_value', { n: value, max })}>
		{#each steps as step (step)}
			<StarIcon
				class={cn(sizeClass, step <= value ? 'text-warning fill-current' : 'text-muted-foreground')}
				aria-hidden="true"
			/>
		{/each}
	</span>
{:else}
	<span
		bind:this={group}
		class="inline-flex items-center gap-0.5"
		role="radiogroup"
		aria-label={label}
		tabindex="-1"
		onkeydown={onKeydown}
	>
		{#each steps as step (step)}
			<button
				type="button"
				role="radio"
				aria-checked={step === value}
				tabindex={step === value || (value === 0 && step === 1) ? 0 : -1}
				class="rounded-sm p-0.5 focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
				onclick={() => set(step)}
			>
				<StarIcon
					class={cn(sizeClass, step <= value ? 'text-warning fill-current' : 'text-muted-foreground')}
					aria-hidden="true"
				/>
				<span class="sr-only">{t('kit.demo.rating_value', { n: step, max })}</span>
			</button>
		{/each}
	</span>
{/if}
