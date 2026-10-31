<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Dialog, DialogContent } from '$lib/components/ui/dialog';
	import { t } from '$lib/i18n/index.svelte';
	import type { NullSorting, ReportMeta, ReportSort, SortDir } from './types';

	const ROWS = 6;

	let {
		open = $bindable(false),
		meta,
		sort,
		onapply
	}: {
		open?: boolean;
		meta: ReportMeta;
		sort: ReportSort[];
		onapply: (sort: ReportSort[]) => void;
	} = $props();

	// Sortable columns only: a textarea has no meaningful ordering (K3 §2.1).
	const fields = $derived(meta.fields.filter((field) => field.type !== 'textarea'));

	// Native <select> binds strings, so the row state is string-based and is
	// narrowed when the dialog is applied.
	type Row = { column: string; dir: string; nulls: string };
	let rows = $state<Row[]>([]);

	$effect(() => {
		if (!open) return;
		rows = Array.from({ length: ROWS }, (_, i) => {
			const existing = sort[i];
			return existing
				? { column: existing.column, dir: existing.dir, nulls: existing.nulls }
				: { column: '', dir: 'asc', nulls: 'default' };
		});
	});

	// A column chosen in another row is not offered again (K3-F13).
	function optionsFor(index: number) {
		const used = new Set(rows.filter((_, i) => i !== index).map((row) => row.column));
		return fields.filter((field) => !used.has(field.name));
	}

	function commit() {
		onapply(
			rows
				.filter((row) => row.column !== '')
				.map((row) => ({
					column: row.column,
					dir: (row.dir === 'desc' ? 'desc' : 'asc') as SortDir,
					nulls: (['last', 'first'].includes(row.nulls) ? row.nulls : 'default') as NullSorting
				}))
		);
		open = false;
	}
</script>

<Dialog bind:open>
	<DialogContent title={t('kit.ir.sort.title')} class="max-w-xl">
		{#snippet footer()}
			<Button variant="outline" onclick={() => (open = false)}>{t('kit.common.cancel')}</Button>
			<Button onclick={commit}>{t('kit.common.apply')}</Button>
		{/snippet}

		<div class="grid grid-cols-[1fr_1fr_1fr] items-center gap-2 text-sm">
			<span class="text-muted-foreground font-medium">{t('kit.ir.filter.column')}</span>
			<span class="text-muted-foreground font-medium">{t('kit.ir.sort.direction')}</span>
			<span class="text-muted-foreground font-medium">{t('kit.ir.sort.null_sorting')}</span>
			{#each rows as row, index (index)}
				<select
					class="border-input h-(--control-h) rounded-lg border bg-transparent px-2"
					bind:value={row.column}
					aria-label="{t('kit.ir.filter.column')} {index + 1}"
				>
					<option value="">{t('kit.ir.none')}</option>
					{#each optionsFor(index) as field (field.name)}
						<option value={field.name}>{field.label}</option>
					{/each}
				</select>
				<select
					class="border-input h-(--control-h) rounded-lg border bg-transparent px-2"
					bind:value={row.dir}
					disabled={row.column === ''}
					aria-label="{t('kit.ir.sort.direction')} {index + 1}"
				>
					<option value="asc">{t('kit.ir.sort.asc')}</option>
					<option value="desc">{t('kit.ir.sort.desc')}</option>
				</select>
				<select
					class="border-input h-(--control-h) rounded-lg border bg-transparent px-2"
					bind:value={row.nulls}
					disabled={row.column === ''}
					aria-label="{t('kit.ir.sort.null_sorting')} {index + 1}"
				>
					<option value="default">{t('kit.ir.nulls.default')}</option>
					<option value="last">{t('kit.ir.nulls.last')}</option>
					<option value="first">{t('kit.ir.nulls.first')}</option>
				</select>
			{/each}
		</div>
	</DialogContent>
</Dialog>
