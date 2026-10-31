<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { t } from '$lib/i18n/index.svelte';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import EyeOffIcon from '@lucide/svelte/icons/eye-off';
	import AlignLeftIcon from '@lucide/svelte/icons/align-left';
	import PinIcon from '@lucide/svelte/icons/pin';
	import PinOffIcon from '@lucide/svelte/icons/pin-off';
	import type { DistinctResponse, DistinctValue, FieldMeta } from './types';

	// The Interactive Report uses every action; the Interactive Grid passes only
	// sort and freeze, so the rest stay optional (K5-08).
	let {
		column,
		anchor,
		onclose,
		onsort,
		onhide,
		onbreak,
		onvalue,
		loadValues,
		onfreeze,
		frozen = false
	}: {
		column: FieldMeta;
		anchor: HTMLElement | null;
		onclose: () => void;
		onsort?: (dir: 'asc' | 'desc') => void;
		onhide?: () => void;
		onbreak?: () => void;
		onvalue?: (value: unknown) => void;
		loadValues?: (search: string) => Promise<DistinctResponse>;
		onfreeze?: () => void;
		frozen?: boolean;
	} = $props();

	const isTextarea = $derived(column.type === 'textarea');
	const canSort = $derived(!isTextarea && onsort !== undefined);
	const showValues = $derived(!isTextarea && loadValues !== undefined);

	let search = $state('');
	let debounced = $state('');
	let values = $state<DistinctValue[]>([]);
	let truncated = $state(false);
	let loading = $state(false);
	let loadError = $state(false);
	let panel = $state<HTMLElement | null>(null);

	// Keyboard users land on the first action so Escape works immediately
	// (K3-F10a step 4).
	$effect(() => {
		panel?.querySelector('button')?.focus();
	});

	const position = $derived.by(() => {
		const rect = anchor?.getBoundingClientRect();
		return { left: `${rect?.left ?? 0}px`, top: `${rect?.bottom ?? 0}px` };
	});

	// The value list is only fetched while the popup is mounted; the text box
	// debounces 300 ms (K3 §1.3).
	$effect(() => {
		const timer = setTimeout(() => (debounced = search), 300);
		return () => clearTimeout(timer);
	});

	$effect(() => {
		if (!showValues || !loadValues) return;
		const query = debounced;
		let cancelled = false;
		loading = true;
		loadError = false;
		void (async () => {
			try {
				const resp = await loadValues(query);
				if (cancelled) return;
				values = resp.values;
				truncated = resp.truncated;
			} catch {
				if (!cancelled) {
					values = [];
					truncated = false;
					loadError = true;
				}
			} finally {
				if (!cancelled) loading = false;
			}
		})();
		return () => {
			cancelled = true;
		};
	});

	function keydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.stopPropagation();
			onclose();
		}
	}
</script>

<svelte:window onclick={onclose} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={panel}
	class="bg-popover text-popover-foreground ring-foreground/10 fixed z-50 w-64 rounded-lg p-2 shadow-md ring-1"
	style="left: {position.left}; top: {position.top}"
	onclick={(event) => event.stopPropagation()}
	onkeydown={keydown}
	role="dialog"
	tabindex={-1}
	aria-label={column.label}
>
	<div class="flex items-center gap-1">
		{#if canSort}
			<button
				type="button"
				class="hover:bg-muted rounded-md p-1"
				aria-label={t('kit.ir.sort_asc')}
				onclick={() => onsort?.('asc')}
			>
				<ArrowUpIcon class="size-4" />
			</button>
			<button
				type="button"
				class="hover:bg-muted rounded-md p-1"
				aria-label={t('kit.ir.sort_desc')}
				onclick={() => onsort?.('desc')}
			>
				<ArrowDownIcon class="size-4" />
			</button>
		{/if}
		{#if onhide}
			<button
				type="button"
				class="hover:bg-muted rounded-md p-1"
				aria-label={t('kit.ir.hide_column')}
				onclick={onhide}
			>
				<EyeOffIcon class="size-4" />
			</button>
		{/if}
		{#if onbreak && !isTextarea}
			<button
				type="button"
				class="hover:bg-muted rounded-md p-1"
				aria-label={t('kit.ir.action.break')}
				onclick={onbreak}
			>
				<AlignLeftIcon class="size-4" />
			</button>
		{/if}
		{#if onfreeze}
			<button
				type="button"
				class="hover:bg-muted rounded-md p-1"
				aria-pressed={frozen}
				aria-label={frozen ? t('kit.ig.unfreeze') : t('kit.ig.freeze')}
				onclick={onfreeze}
			>
				{#if frozen}
					<PinOffIcon class="size-4" />
				{:else}
					<PinIcon class="size-4" />
				{/if}
			</button>
		{/if}
	</div>

	{#if showValues}
		<div class="mt-2 flex flex-col gap-2">
			<Input bind:value={search} class="h-7" placeholder={t('kit.ir.search.placeholder')} />
			{#if loading}
				<p class="text-muted-foreground text-xs">{t('kit.common.loading')}</p>
			{/if}
			{#if loadError}
				<p class="text-destructive text-xs">{t('kit.ir.load_failed')}</p>
			{/if}
			<ul class="flex max-h-48 flex-col overflow-y-auto">
				{#each values as item, i (i)}
					<li>
						<button
							type="button"
							class="hover:bg-muted flex w-full items-center justify-between gap-2 rounded-md px-1.5 py-1 text-left text-sm"
							onclick={() => onvalue?.(item.value)}
						>
							<span class="truncate">{item.label}</span>
							<span class="text-muted-foreground text-xs">{item.count}</span>
						</button>
					</li>
				{/each}
			</ul>
			{#if truncated}
				<p class="text-muted-foreground text-xs">{t('kit.ir.distinct_truncated')}</p>
			{/if}
		</div>
	{/if}
</div>
