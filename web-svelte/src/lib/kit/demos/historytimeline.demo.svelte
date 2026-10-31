<script lang="ts">
	import type { FieldMeta } from '$lib/kit/fields/types';
	import HistoryTimeline from '$lib/kit/organisms/history/HistoryTimeline.svelte';
	import type { HistoryEntry } from '$lib/kit/organisms/history/history';

	const fields: FieldMeta[] = [
		{ name: 'code', type: 'text', label: 'Kode', required: true, in_table: true },
		{ name: 'name', type: 'text', label: 'Nama', required: true, in_table: true },
		{
			name: 'tier',
			type: 'select',
			label: 'Tier',
			required: false,
			in_table: true,
			options: [
				{ value: 'regular', label: 'Regular' },
				{ value: 'gold', label: 'Gold' }
			]
		},
		{ name: 'active', type: 'toggle', label: 'Aktif', required: false, in_table: true },
		{ name: 'credit_limit', type: 'number', label: 'Limit', required: false, in_table: true }
	];

	const entries: HistoryEntry[] = [
		{
			operation: 'update',
			version: 3,
			actor_name: 'Andi',
			occurred_at: '2026-09-28T03:00:00Z',
			changed_fields: ['name', 'active'],
			snapshot: { code: 'C001', name: 'Beta', tier: 'regular', active: true, credit_limit: 1000 }
		},
		{
			operation: 'update',
			version: 2,
			actor_name: 'Budi',
			occurred_at: '2026-09-27T04:00:00Z',
			changed_fields: ['tier'],
			snapshot: { code: 'C001', name: 'Alpha', tier: 'regular', active: true, credit_limit: 1000 }
		},
		{
			operation: 'create',
			version: 1,
			actor_name: 'Andi',
			occurred_at: '2026-09-26T05:00:00Z',
			snapshot: { code: 'C001', name: 'Alpha', tier: 'regular', active: true, credit_limit: 1000 }
		}
	];

	const current = { code: 'C001', name: 'Gamma', tier: 'gold', active: false, credit_limit: 2000 };
	let restored = $state('');
</script>

<div class="flex flex-col gap-4">
	<HistoryTimeline
		{entries}
		{fields}
		{current}
		canRestore
		onrestore={(entry) => (restored = `v${entry.version}`)}
	/>
	<p class="text-muted-foreground text-sm">restore: {restored || '-'}</p>
</div>