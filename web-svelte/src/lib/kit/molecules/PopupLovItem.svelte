<script lang="ts" module>
	export type LovItem = { id: string; label: string };
</script>

<script lang="ts">
	import { tick } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Dialog, DialogContent } from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { t } from '$lib/i18n/index.svelte';
	import { cn } from '$lib/utils';
	import DisplayOnly from './DisplayOnly.svelte';
	import Item, { type ItemLabelPosition, type ItemSize } from './Item.svelte';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';

	// APEX Popup LOV (F2-05): a read-only box with the chosen label, a Search
	// button that opens a debounced listbox, and a Clear button. The data source
	// is injected so the molecule knows nothing about the API.
	let {
		id,
		value = $bindable<string | null>(null),
		valueLabel = null,
		label,
		required = false,
		help,
		inlineHelp,
		error,
		labelPosition = 'above',
		preText,
		postText,
		size = 'md',
		stretch = false,
		readOnly = false,
		disabled = false,
		placeholder,
		search,
		onchange,
		class: className
	}: {
		id: string;
		value?: string | null;
		/** Label of the current value; `null` while it is still unknown. */
		valueLabel?: string | null;
		label?: string;
		required?: boolean;
		help?: string;
		inlineHelp?: string;
		error?: string;
		labelPosition?: ItemLabelPosition;
		preText?: string;
		postText?: string;
		size?: ItemSize;
		stretch?: boolean;
		readOnly?: boolean;
		disabled?: boolean;
		placeholder?: string;
		search?: (q: string, page: number) => Promise<{ items: LovItem[]; total: number }>;
		onchange?: (id: string | null, label: string | null) => void;
		class?: string;
	} = $props();
	let open = $state(false);
	let query = $state('');
	let page = $state(1);
	let items = $state<LovItem[]>([]);
	let total = $state(0);
	let loading = $state(false);
	let active = $state(0);
	let searchEl = $state<HTMLInputElement | null>(null);

	const placeholderText = $derived(placeholder ?? t('kit.select.null_display'));

	// Debounced search (250 ms); a new query starts again from page 1.
	$effect(() => {
		if (!open) return;
		const term = setTimeout(() => void runSearch(query, 1), 250);
		return () => clearTimeout(term);
	});

	$effect(() => {
		if (!open) return;
		void tick().then(() => searchEl?.focus());
	});

	async function runSearch(q: string, nextPage: number) {
		if (!search) {
			items = [];
			total = 0;
			return;
		}
		loading = true;
		try {
			const resp = await search(q, nextPage);
			items = nextPage === 1 ? resp.items : [...items, ...resp.items];
			total = resp.total;
			page = nextPage;
			active = 0;
		} finally {
			loading = false;
		}
	}

	function openDialog() {
		if (disabled) return;
		query = '';
		page = 1;
		items = [];
		total = 0;
		active = 0;
		open = true;
	}

	function choose(item: LovItem) {
		value = item.id;
		onchange?.(item.id, item.label);
		open = false;
	}

	function clear() {
		value = null;
		onchange?.(null, null);
	}

	function onKeydown(event: KeyboardEvent) {
		if (items.length === 0) return;
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			active = Math.min(active + 1, items.length - 1);
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			active = Math.max(active - 1, 0);
		} else if (event.key === 'Enter') {
			event.preventDefault();
			const item = items[active];
			if (item) choose(item);
		}
	}
</script>
{#if readOnly}
	<DisplayOnly
		{id}
		type="text"
		value={valueLabel ?? value ?? ''}
		{label}
		{required}
		{help}
		{inlineHelp}
		{error}
		{labelPosition}
		{preText}
		{postText}
		{size}
		{stretch}
		class={className}
	/>
{:else}
	<Item {id} {label} {required} {help} {inlineHelp} {error} {labelPosition} {preText} {postText} {size} {stretch} class={className}>
		{#snippet children(ctx)}
			<div class="flex items-stretch gap-1">
				<Input
					id={ctx.id}
					readonly
					{disabled}
					value={valueLabel ?? ''}
					placeholder={placeholderText}
					aria-describedby={ctx.describedBy}
					aria-invalid={ctx.invalid}
					class={cn('h-(--control-h) cursor-pointer')}
					onclick={openDialog}
				/>
				<Button
					variant="outline"
					size="icon"
					aria-label={t('kit.lov.search')}
					{disabled}
					onclick={openDialog}
				>
					<SearchIcon />
				</Button>
				{#if !required && value}
					<Button variant="ghost" size="icon" aria-label={t('kit.lov.clear')} {disabled} onclick={clear}>
						<XIcon />
					</Button>
				{/if}
			</div>
		{/snippet}
	</Item>
{/if}
<Dialog bind:open>
	<DialogContent title={label ?? t('kit.lov.title')}>
		<div class="flex flex-col gap-2">
			<Input
				bind:ref={searchEl}
				bind:value={query}
				placeholder={t('kit.ir.search.placeholder')}
				aria-label={t('kit.ir.search.placeholder')}
				aria-controls="{id}-lov-list"
				onkeydown={onKeydown}
			/>
			<ul
				id="{id}-lov-list"
				role="listbox"
				class="border-border max-h-60 min-h-9 overflow-y-auto rounded-md border p-1"
			>
				{#each items as item, index (item.id)}
					<li
						role="option"
						aria-selected={index === active}
						class={cn(
							'flex cursor-pointer items-center rounded-md px-2 py-1 text-sm',
							index === active ? 'bg-muted' : 'hover:bg-muted/50'
						)}
						onclick={() => choose(item)}
						onkeydown={(event) => {
							if (event.key === 'Enter' || event.key === ' ') choose(item);
						}}
					>
						{item.label}
					</li>
				{/each}
			</ul>
			{#if loading}
				<p class="text-muted-foreground text-sm" role="status">{t('kit.common.loading')}</p>
			{:else if items.length === 0}
				<p class="text-muted-foreground text-sm">{t('kit.msg.no_data_found')}</p>
			{:else if items.length < total}
				<Button variant="outline" size="sm" class="self-start" onclick={() => void runSearch(query, page + 1)}>
					{t('kit.lov.load_more')}
				</Button>
			{/if}
		</div>
	</DialogContent>
</Dialog>