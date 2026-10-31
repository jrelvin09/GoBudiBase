<script lang="ts" module>
	export type SearchItem = { id: string; title: string };
	export type SearchGroup = { resource: string; label: string; items: SearchItem[]; more: boolean };
</script>

<script lang="ts">
	import { tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { Dialog, DialogContent } from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { t } from '$lib/i18n/index.svelte';
	import { cn } from '$lib/utils';

	// Command palette (F5-06): Ctrl+K search across resources. The data source
	// is injected, so the organism knows nothing about the API (like
	// PopupLovItem); navigation happens here so the shell only wires the key.
	let {
		open = $bindable(false),
		search
	}: {
		open?: boolean;
		search: (q: string) => Promise<SearchGroup[]>;
	} = $props();

	const MIN_CHARS = 2;
	const DEBOUNCE_MS = 250;

	let query = $state('');
	let groups = $state<SearchGroup[]>([]);
	let loading = $state(false);
	let active = $state(0);
	let inputEl = $state<HTMLInputElement | null>(null);

	const term = $derived(query.trim().length >= MIN_CHARS ? query.trim() : '');
	type Row =
		| { kind: 'item'; group: SearchGroup; item: SearchItem }
		| { kind: 'more'; group: SearchGroup };

	const rows = $derived.by(() => {
		const out: Row[] = [];
		for (const group of groups) {
			for (const item of group.items) out.push({ kind: 'item', group, item });
			if (group.more) out.push({ kind: 'more', group });
		}
		return out;
	});
	const indices = $derived(new Map(rows.map((row, index) => [rowKey(row), index])));

	function rowKey(row: Row): string {
		return row.kind === 'item' ? row.item.id : `more:${row.group.resource}`;
	}

	// A new term starts a fresh, debounced search; under two characters the
	// list stays empty (F5-06).
	$effect(() => {
		const current = term;
		if (!open || current === '') {
			groups = [];
			return;
		}
		const timer = setTimeout(() => void run(current), DEBOUNCE_MS);
		return () => clearTimeout(timer);
	});

	async function run(q: string) {
		loading = true;
		try {
			groups = await search(q);
			active = 0;
		} finally {
			loading = false;
		}
	}
	$effect(() => {
		if (!open) return;
		query = '';
		groups = [];
		active = 0;
		void tick().then(() => inputEl?.focus());
	});

	function choose(row: Row) {
		open = false;
		if (row.kind === 'more') {
			void goto(`/r/${row.group.resource}?q=${encodeURIComponent(term)}`);
			return;
		}
		void goto(`/r/${row.group.resource}/${row.item.id}`);
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			active = Math.min(active + 1, Math.max(0, rows.length - 1));
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			active = Math.max(active - 1, 0);
		} else if (event.key === 'Enter') {
			event.preventDefault();
			const row = rows[active];
			if (row) choose(row);
		}
	}
</script>
<Dialog bind:open>
	<DialogContent title={t('kit.search.title')}>
		<div class="flex flex-col gap-2">
			<Input
				bind:ref={inputEl}
				bind:value={query}
				role="combobox"
				aria-expanded="true"
				aria-controls="command-palette-list"
				aria-activedescendant={rows[active] ? `cp-opt-${active}` : undefined}
				aria-autocomplete="list"
				aria-label={t('kit.search.title')}
				placeholder={t('kit.search.placeholder')}
				onkeydown={onKeydown}
			/>
			<div class="max-h-72 overflow-y-auto">
				{#if term === ''}
					<p class="text-muted-foreground p-2 text-sm">{t('kit.search.placeholder')}</p>
				{:else if rows.length === 0}
					<p class="text-muted-foreground p-2 text-sm">
						{loading ? t('kit.common.loading') : t('kit.msg.no_data_found')}
					</p>
				{:else}
					<ul id="command-palette-list" role="listbox" aria-label={t('kit.search.title')}>
						{#each groups as group (group.resource)}
							<li role="presentation" class="text-muted-foreground px-2 pt-2 text-xs font-medium">
								{group.label}
							</li>
							{#each group.items as item (item.id)}
								{@const index = indices.get(item.id) ?? 0}
								<li
									id={`cp-opt-${index}`}
									role="option"
									aria-selected={index === active}
									class={cn(
										'cursor-pointer rounded-md px-2 py-1 text-sm',
										index === active ? 'bg-muted' : 'hover:bg-muted/50'
									)}
									onmouseenter={() => (active = index)}
									onclick={() => choose({ kind: 'item', group, item })}
									onkeydown={(event) => {
										if (event.key === 'Enter' || event.key === ' ') choose({ kind: 'item', group, item });
									}}
								>
									{item.title}
								</li>
							{/each}							{#if group.more}
								{@const moreIndex = indices.get(`more:${group.resource}`) ?? 0}
								<li
									id={`cp-opt-${moreIndex}`}
									role="option"
									aria-selected={moreIndex === active}
									class={cn(
										'text-primary cursor-pointer rounded-md px-2 py-1 text-sm',
										moreIndex === active ? 'bg-muted' : 'hover:bg-muted/50'
									)}
									onmouseenter={() => (active = moreIndex)}
									onclick={() => choose({ kind: 'more', group })}
									onkeydown={(event) => {
										if (event.key === 'Enter' || event.key === ' ') choose({ kind: 'more', group });
									}}
								>
									{t('kit.search.more', { resource: group.label })}
								</li>
							{/if}
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	</DialogContent>
</Dialog>