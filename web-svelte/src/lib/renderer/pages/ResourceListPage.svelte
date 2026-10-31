<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { APP_NAME } from '$lib/app';
	import type { ResourceMeta } from '$lib/api/resource-types';
	import { Button } from '$lib/components/ui/button';
	import { t } from '$lib/i18n/index.svelte';
	import Region from '$lib/kit/organisms/Region.svelte';
	import CalendarRegion from '$lib/renderer/regions/CalendarRegion.svelte';
	import CardsRegion from '$lib/renderer/regions/CardsRegion.svelte';
	import FacetedSearch from '$lib/renderer/regions/FacetedSearch.svelte';
	import FormDrawer from '$lib/renderer/regions/FormDrawer.svelte';
	import InteractiveGrid from '$lib/renderer/regions/InteractiveGrid.svelte';
	import InteractiveReport from '$lib/renderer/regions/InteractiveReport.svelte';

	let {
		meta,
		fields,
		sort,
		pageSize,
		filters,
		rowAction
	}: { meta: ResourceMeta; rowAction?: 'edit' | 'none'; fields?: string[]; sort?: { field: string; dir: 'asc' | 'desc' }; pageSize?: number; filters?: { field: string; op: 'eq'; value: string }[] } = $props();

	// "More in ..." from the command palette opens the list with ?q=; the search
	// box starts filled with it (F5-06).
	const initialSearch = $derived(page.url.searchParams.get('q') ?? '');

	// Mode drawer (K6-05): form dibuka di Sheet, bukan pindah halaman.
	const drawerForm = $derived(meta.form_mode === 'drawer');
	let drawerOpen = $state(false);
	let drawerMode = $state<'create' | 'edit'>('create');
	let drawerId = $state<string | null>(null);
	let drawerPrefill = $state<Record<string, unknown> | null>(null);
	let reloadToken = $state(0);

	function openEdit(id: string) {
		drawerId = id;
		drawerPrefill = null;
		drawerMode = 'edit';
		drawerOpen = true;
	}
	function openCreate(prefill?: Record<string, unknown>) {
		drawerId = null;
		drawerPrefill = prefill ?? null;
		drawerMode = 'create';
		drawerOpen = true;
	}
	function onDrawerSaved() {
		drawerOpen = false;
		reloadToken += 1;
	}
</script>

<svelte:head>
	<title>{meta.plural} — {APP_NAME}</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<nav aria-label="Breadcrumb" class="text-muted-foreground text-sm">
		<span>{meta.plural}</span>
	</nav>

	<Region title={meta.plural} headingLevel={1}>
		{#snippet buttonsRight()}
			{#if meta.capabilities.history}
				<a href={`/r/${meta.id}/deleted`} class="text-primary text-sm underline-offset-4 hover:underline">
					{t('kit.history.deleted_link')}
				</a>
			{/if}
		{/snippet}
		{#key `${meta.id}:${reloadToken}`}
			{#if meta.list_view === 'grid'}
				<InteractiveGrid {meta} onedit={drawerForm ? openEdit : undefined} />
			{:else if meta.list_view === 'cards'}
				<CardsRegion {meta} onedit={drawerForm ? openEdit : undefined} oncreate={drawerForm ? openCreate : undefined} />
			{:else if meta.list_view === 'faceted'}
				<FacetedSearch {meta} />
			{:else if meta.list_view === 'calendar'}
				<CalendarRegion {meta} onedit={drawerForm ? openEdit : undefined} oncreate={drawerForm ? openCreate : undefined} />
			{:else}
				<InteractiveReport {meta} allowedColumns={fields} initialSort={sort} initialPageSize={pageSize} rowAction={rowAction} lockedFilters={filters?.map((f) => ({ column: f.field, value: f.value }))} initialSearch={initialSearch} onedit={drawerForm ? openEdit : undefined}>
					{#snippet right()}
						{#if meta.capabilities.create}
							<Button onclick={() => (drawerForm ? openCreate() : goto(`/r/${meta.id}/new`))}>{t('kit.common.create')}</Button>
						{/if}
					{/snippet}
				</InteractiveReport>
			{/if}
		{/key}
	</Region>

	{#if drawerForm}
		<FormDrawer
			bind:open={drawerOpen}
			{meta}
			mode={drawerMode}
			recordId={drawerId}
			prefill={drawerPrefill}
			onsaved={onDrawerSaved}
		/>
	{/if}
</div>
