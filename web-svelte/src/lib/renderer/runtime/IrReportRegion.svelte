<script lang="ts">
	import type { ResourceMeta } from '$lib/api/resource-types';
	import InteractiveReport from '$lib/renderer/regions/InteractiveReport.svelte';

	// Region runtime `ir-report`: adapter tipis yang menerjemahkan properti
	// definisi halaman (fields/sort/pageSize/filters/rowAction) ke props
	// InteractiveReport. Semuanya presentasi; query tetap lewat jalur resource.
	let {
		meta,
		fields,
		sort,
		pageSize,
		filters,
		rowAction,
		onrowselect
	}: {
		meta: ResourceMeta;
		fields?: string[];
		sort?: { field: string; dir: 'asc' | 'desc' };
		pageSize?: number;
		filters?: { field: string; op: 'eq'; value: string }[];
		rowAction?: 'edit' | 'none' | 'select';
		onrowselect?: (id: string) => void;
	} = $props();
</script>

<InteractiveReport
	{meta}
	allowedColumns={fields}
	initialSort={sort}
	initialPageSize={pageSize}
	rowAction={rowAction === 'select' ? 'none' : rowAction}
	onedit={rowAction === 'select' ? onrowselect : undefined}
	lockedFilters={filters?.map((f) => ({ column: f.field, value: f.value }))}
/>
