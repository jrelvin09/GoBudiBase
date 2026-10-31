<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Dialog, DialogContent } from '$lib/components/ui/dialog';
	import SelectListItem from '$lib/kit/molecules/SelectListItem.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import { newId } from './model';
	import type { AggregateFn, ReportAggregate, ReportMeta } from './types';

	const FNS: AggregateFn[] = ['sum', 'avg', 'count', 'count_distinct', 'min', 'max'];
	const NEW = '__bb_new__';

	let {
		open = $bindable(false),
		meta,
		aggregates,
		onapply,
		ondelete
	}: {
		open?: boolean;
		meta: ReportMeta;
		aggregates: ReportAggregate[];
		onapply: (aggregate: ReportAggregate) => void;
		ondelete?: (id: string) => void;
	} = $props();

	// Editing an existing aggregate is chosen from the "Aggregation" list; the
	// id keeps the chip identity so an edit replaces instead of appends.
	let selectedId = $state(NEW);
	let fn = $state<AggregateFn>('sum');
	let column = $state('');
	let editingId = $state<string | null>(null);

	// Sum and Average only make sense on numeric columns (K3-F15).
	const needsNumber = $derived(fn === 'sum' || fn === 'avg');
	const columns = $derived(needsNumber ? meta.fields.filter((field) => field.type === 'number') : meta.fields);

	function loadAggregate(aggregate: ReportAggregate | null) {
		if (aggregate) {
			editingId = aggregate.id;
			selectedId = aggregate.id;
			fn = aggregate.fn;
			column = aggregate.column;
		} else {
			editingId = null;
			selectedId = NEW;
			fn = 'sum';
			column = columns[0]?.name ?? '';
		}
	}

	$effect(() => {
		if (!open) return;
		loadAggregate(aggregates[0] ?? null);
	});

	$effect(() => {
		if (!columns.some((field) => field.name === column)) column = columns[0]?.name ?? '';
	});

	function commit() {
		if (column === '') return;
		onapply({ id: editingId ?? newId('a'), fn, column, enabled: true });
		open = false;
	}
</script>

<Dialog bind:open>
	<DialogContent title={t('kit.ir.aggregate.title')}>
		{#snippet footer()}
			{#if editingId && ondelete}
				{@const deleting = editingId}
				<Button
					variant="destructive"
					class="mr-auto"
					onclick={() => {
						ondelete(deleting);
						open = false;
					}}>{t('kit.common.delete')}</Button
				>
			{/if}
			<Button variant="outline" onclick={() => (open = false)}>{t('kit.common.cancel')}</Button>
			<Button disabled={column === ''} onclick={commit}>{t('kit.common.apply')}</Button>
		{/snippet}

		<div class="flex flex-col gap-3">
			<SelectListItem
				id="agg-select"
				label={t('kit.ir.aggregate.aggregation')}
				options={[
					{ value: NEW, label: t('kit.ir.aggregate.new') },
					...aggregates.map((entry) => ({
						value: entry.id,
						label: `${t(`kit.ir.agg.${entry.fn}`)} · ${meta.fields.find((field) => field.name === entry.column)?.label ?? entry.column}`
					}))
				]}
				bind:value={selectedId}
				onchange={(value) => loadAggregate(aggregates.find((entry) => entry.id === value) ?? null)}
			/>
			<SelectListItem
				id="agg-fn"
				label={t('kit.ir.aggregate.fn')}
				options={FNS.map((entry) => ({ value: entry, label: t(`kit.ir.agg.${entry}`) }))}
				bind:value={fn}
				required
			/>
			<SelectListItem
				id="agg-column"
				label={t('kit.ir.aggregate.column')}
				options={columns.map((field) => ({ value: field.name, label: field.label }))}
				bind:value={column}
				required
			/>
		</div>
	</DialogContent>
</Dialog>
