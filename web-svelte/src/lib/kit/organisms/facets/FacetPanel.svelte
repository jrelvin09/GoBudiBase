<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import type { ReportMeta } from '$lib/kit/organisms/ir/types';
	import { t } from '$lib/i18n/index.svelte';
	import CheckboxFacet from './CheckboxFacet.svelte';
	import RangeFacet from './RangeFacet.svelte';
	import { emptyFacetState, facetFields, type FacetCounts, type FacetState } from './facets';

	let {
		meta,
		state,
		counts = {},
		onchange
	}: {
		meta: ReportMeta;
		state: FacetState;
		counts?: FacetCounts;
		onchange: (state: FacetState) => void;
	} = $props();

	const fields = $derived(facetFields(meta));

	function setSearch(search: string) {
		onchange({ ...state, search });
	}

	function setSelected(name: string, values: string[]) {
		onchange({ ...state, selected: { ...state.selected, [name]: values } });
	}

	function setRange(name: string, low: number | string | null, high: number | string | null) {
		onchange({ ...state, ranges: { ...state.ranges, [name]: [low, high] } });
	}

	function clearFacet(name: string) {
		const selected = { ...state.selected };
		const ranges = { ...state.ranges };
		delete selected[name];
		delete ranges[name];
		onchange({ ...state, selected, ranges });
	}

	function clearAll() {
		onchange(emptyFacetState());
	}
</script>
<aside class="flex w-full shrink-0 flex-col gap-4 lg:w-64">
	<Input
		value={state.search}
		placeholder={t('kit.facets.search')}
		aria-label={t('kit.facets.search')}
		oninput={(event) => setSearch((event.currentTarget as HTMLInputElement).value)}
	/>

	{#each fields as field (field.name)}
		{@const selected = state.selected[field.name] ?? []}
		{@const range = state.ranges[field.name] ?? [null, null]}
		<section class="flex flex-col gap-2">
			<div class="flex items-center justify-between gap-2">
				<h3 class="text-sm font-medium">{field.label}</h3>
				<Button variant="ghost" size="sm" onclick={() => clearFacet(field.name)}>
					{t('kit.facets.clear')}
				</Button>
			</div>
			{#if field.type === 'select' || field.type === 'toggle'}
				<CheckboxFacet
					id="facet-{field.name}"
					values={selected}
					options={counts[field.name] ?? []}
					onchange={(values) => setSelected(field.name, values)}
				/>
			{:else}
				<RangeFacet
					id="facet-{field.name}"
					{field}
					low={range[0]}
					high={range[1]}
					onchange={(low, high) => setRange(field.name, low, high)}
				/>
			{/if}
		</section>
	{/each}

	{#if fields.length > 0}
		<Button variant="outline" size="sm" onclick={clearAll}>{t('kit.facets.clear_all')}</Button>
	{/if}
</aside>
