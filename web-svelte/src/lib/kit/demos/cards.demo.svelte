<script lang="ts">
	import CardsGrid, {
		type CardsMeta,
		type CardsColumns,
		type CardsVariant
	} from '$lib/kit/organisms/cards/CardsGrid.svelte';
	import type { ReportMeta } from '$lib/kit/organisms/ir/types';

	const meta: ReportMeta = {
		fields: [
			{ name: 'name', type: 'text', label: 'Name', required: false, in_table: true },
			{ name: 'code', type: 'text', label: 'Code', required: false, in_table: true },
			{
				name: 'tier',
				type: 'select',
				label: 'Tier',
				required: false,
				in_table: true,
				options: [
					{ value: 'gold', label: 'Gold' },
					{ value: 'platinum', label: 'Platinum' },
					{ value: 'regular', label: 'Regular' }
				]
			},
			{ name: 'notes', type: 'textarea', label: 'Notes', required: false, in_table: true }
		]
	};

	const rows: Record<string, unknown>[] = [
		{ id: 'r1', name: 'Acme Corp', code: 'C-001', tier: 'gold', notes: 'Long-standing customer with several subsidiaries and a dedicated account manager.' },
		{ id: 'r2', name: 'Bumi Retail', code: 'C-002', tier: 'platinum', notes: 'High volume. Prefers consolidated monthly invoicing across all outlets.' },
		{ id: 'r3', name: 'Cahaya Niaga', code: 'C-003', tier: 'regular', notes: 'New this year; the credit limit is reviewed every quarter.' },
		{ id: 'r4', name: 'Delta Karya', code: 'C-004', tier: 'gold', notes: 'Signed the annual framework agreement in January.' },
		{ id: 'r5', name: 'Eka Jaya', code: 'C-005', tier: 'regular', notes: '' },
		{ id: 'r6', name: 'Fajar Sentosa', code: 'C-006', tier: 'platinum', notes: 'Priority support tier with a named contact.' }
	];

	const cards: CardsMeta = { title: 'name', subtitle: 'code', badge: 'tier', body: 'notes' };
	const variants: CardsVariant[] = ['basic', 'compact', 'featured'];
	const columnCounts: CardsColumns[] = [2, 3, 4, 5];
</script>
<div class="flex flex-col gap-8">
	{#each variants as variant (variant)}
		<section class="flex flex-col gap-3">
			<h2 class="text-muted-foreground text-sm font-medium">variant: {variant} · 3 columns</h2>
			<CardsGrid
				{rows}
				{meta}
				{cards}
				{variant}
				columns={3}
				linkHref={(row) => `/r/sales.customer/${row.id}`}
			/>
		</section>
	{/each}

	{#each columnCounts as columns (columns)}
		<section class="flex flex-col gap-3">
			<h2 class="text-muted-foreground text-sm font-medium">basic · {columns} columns</h2>
			<CardsGrid {rows} {meta} {cards} {columns} />
		</section>
	{/each}
</div>
