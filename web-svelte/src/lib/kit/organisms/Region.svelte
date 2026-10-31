<script lang="ts" module>
	export type RegionVariant = 'standard' | 'hidden-header' | 'plain';
	export type RegionBodyHeight = 'auto' | '240' | '320' | '480';
	export type RegionAccent = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
</script>

<script lang="ts">
	import { cn } from '$lib/utils';
	import { t } from '$lib/i18n/index.svelte';
	import type { Component, Snippet } from 'svelte';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

	let {
		title,
		headingLevel = 2,
		icon,
		variant = 'standard',
		accent,
		collapsible = false,
		collapsed = $bindable(false),
		bodyHeight = 'auto',
		noBodyPadding = false,
		buttonsLeft,
		buttonsRight,
		children,
		class: className
	}: {
		title?: string;
		headingLevel?: 1 | 2;
		icon?: Component;
		variant?: RegionVariant;
		accent?: RegionAccent;
		collapsible?: boolean;
		collapsed?: boolean;
		bodyHeight?: RegionBodyHeight;
		noBodyPadding?: boolean;
		buttonsLeft?: Snippet;
		buttonsRight?: Snippet;
		children?: Snippet;
		class?: string;
	} = $props();

	// Kelas ditulis eksplisit agar pemindai Tailwind menemukannya.
	const ACCENTS: Record<RegionAccent, string> = {
		1: 'border-t-palette-1',
		2: 'border-t-palette-2',
		3: 'border-t-palette-3',
		4: 'border-t-palette-4',
		5: 'border-t-palette-5',
		6: 'border-t-palette-6',
		7: 'border-t-palette-7',
		8: 'border-t-palette-8',
		9: 'border-t-palette-9',
		10: 'border-t-palette-10',
		11: 'border-t-palette-11',
		12: 'border-t-palette-12'
	};

	const HEIGHTS: Record<RegionBodyHeight, string> = {
		auto: '',
		'240': 'h-60',
		'320': 'h-80',
		'480': 'h-[30rem]'
	};
</script>

<section
	data-slot="region"
	data-variant={variant}
	class={cn('flex flex-col gap-2', accent && ['border-t-[3px]', ACCENTS[accent]], className)}
>
	{#if variant === 'standard'}
		<div class="flex items-center gap-2">
			<div class="flex min-w-0 flex-1 items-center gap-2">
				{#if collapsible}
					<button
						type="button"
						aria-expanded={!collapsed}
						aria-label={t('kit.region.toggle')}
						onclick={() => (collapsed = !collapsed)}
						class="text-muted-foreground hover:text-foreground shrink-0 rounded-md p-1"
					>
						<ChevronDownIcon class={cn('size-4 transition-transform', collapsed && '-rotate-90')} />
					</button>
				{/if}
				{#if icon}
					{@const Icon = icon}
					<Icon class="text-muted-foreground size-4 shrink-0" />
				{/if}
				<svelte:element this={headingLevel === 1 ? 'h1' : 'h2'} class="truncate text-sm font-semibold">
					{title}
				</svelte:element>
			</div>
			<div class="flex shrink-0 items-center gap-1">
				{@render buttonsLeft?.()}
				{@render buttonsRight?.()}
			</div>
		</div>
	{:else if variant === 'hidden-header'}
		<div class="flex items-center justify-end gap-1">
			{@render buttonsLeft?.()}
			{@render buttonsRight?.()}
		</div>
	{/if}

	{#if !collapsed}
		<div
			data-slot="region-body"
			class={cn(
				HEIGHTS[bodyHeight] && ['overflow-y-auto', HEIGHTS[bodyHeight]],
				variant === 'plain'
					? 'bg-transparent'
					: 'bg-card border-border rounded-lg border',
				variant !== 'plain' && !noBodyPadding && 'p-4',
				variant === 'plain' && !noBodyPadding && 'p-0'
			)}
		>
			{@render children?.()}
		</div>
	{/if}
</section>
