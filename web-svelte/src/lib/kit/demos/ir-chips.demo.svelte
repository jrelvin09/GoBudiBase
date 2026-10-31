<script lang="ts">
	import SettingsChips from '$lib/kit/organisms/ir/SettingsChips.svelte';
	import {
		addBreak,
		removeAggregate,
		removeBreak,
		removeFilter,
		removeHighlight,
		toggleAggregate,
		toggleBreak,
		toggleFilter,
		toggleHighlight
	} from '$lib/kit/organisms/ir/model';
	import { demoMeta } from '$lib/kit/demos/fixtures/customers';
	import type { ReportSettings } from '$lib/kit/organisms/ir/types';

	let settings = $state<ReportSettings>({
		columns: ['code', 'name', 'tier', 'credit_limit'],
		filters: [
			{ id: 'f1', kind: 'search', column: null, op: 'contains', value: 'budi', enabled: true },
			{ id: 'f2', kind: 'column', column: 'tier', op: 'in', value: ['gold', 'platinum'], enabled: true }
		],
		sort: [],
		breaks: [{ column: 'tier', enabled: true }],
		highlights: [
			{ id: 'h1', name: 'VIP', seq: 10, enabled: true, type: 'row', bg: 3, fg: null, column: 'tier', op: 'eq', value: 'platinum' }
		],
		aggregates: [{ id: 'a1', fn: 'sum', column: 'credit_limit', enabled: true }],
		page_size: 15,
		view: 'report',
		group_by: null,
		pivot: null,
		chart: null,
		computations: [],
		widths: {},
		frozen: null
	});

	function toggle(kind: string, id: string) {
		if (kind === 'filter') settings = toggleFilter(settings, id);
		else if (kind === 'break') settings = toggleBreak(settings, id);
		else if (kind === 'highlight') settings = toggleHighlight(settings, id);
		else settings = toggleAggregate(settings, id);
	}

	function remove(kind: string, id: string) {
		if (kind === 'filter') settings = removeFilter(settings, id);
		else if (kind === 'break') settings = removeBreak(settings, id);
		else if (kind === 'highlight') settings = removeHighlight(settings, id);
		else settings = removeAggregate(settings, id);
	}

	function addAnotherBreak() {
		if (!settings.breaks.some((b) => b.column === 'name')) settings = addBreak(settings, 'name');
	}
</script>

<div class="flex flex-col gap-4">
	<SettingsChips
		meta={demoMeta}
		{settings}
		ontoggle={toggle}
		onremove={remove}
		onedit={(kind, id) => console.info('edit', kind, id)}
	/>
	<button type="button" class="text-primary self-start text-sm hover:underline" onclick={addAnotherBreak}>
		+ break on Name
	</button>
</div>
