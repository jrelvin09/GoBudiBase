<script lang="ts">
	import { ApiError, type AdminContext } from '$lib/api/client';
	import { getDashboardWidget, type TableWidgetData } from '$lib/api/resources';
	import { t } from '$lib/i18n/index.svelte';
	import Region from '$lib/kit/organisms/Region.svelte';
	import ReportTable from '$lib/kit/organisms/ir/ReportTable.svelte';
	import type { ReportAggregates, ReportSettings } from '$lib/kit/organisms/ir/types';
	import { resolveLabels, type LabelMap } from '$lib/renderer/labels';
	import { resourcesStore } from '$lib/stores/resources.svelte';
	import { sessionStore } from '$lib/stores/session.svelte';

	// Table widget (F5-03): the first page of a fixed report. The widget's own
	// settings stay in Go (F5-02), so the browser shows the resource's default
	// columns from the metadata it already holds.
	let {
		dashboardId,
		name,
		label,
		resource
	}: { dashboardId: string; name: string; label: string; resource: string } = $props();

	let rows = $state<Record<string, unknown>[]>([]);
	let labels = $state<LabelMap>({});
	let loading = $state(true);
	let error = $state<string | null>(null);
	let reloadToken = $state(0);

	const meta = $derived(resourcesStore.getResource(resource));
	const settings = $derived<ReportSettings | null>(
		meta
			? {
					columns: meta.fields.filter((field) => field.in_table).map((field) => field.name),
					filters: [],
					sort: [],
					breaks: [],
					highlights: [],
					aggregates: [],
					page_size: rows.length || 5,
					view: 'report',
					group_by: null,
					pivot: null,
					chart: null,
					computations: [],
					widths: {},
					frozen: null
				}
			: null
	);
	const aggregates: ReportAggregates = { overall: {}, breaks: [] };

	function context(): AdminContext {
		return {
			companyId: sessionStore.context.company_id ?? '',
			locationId: sessionStore.context.location_id ?? null,
			contextVersion: sessionStore.context.context_version
		};
	}

	$effect(() => {
		const current = reloadToken;
		const d = dashboardId;
		const n = name;
		if (!d || !n || current < 0) return;
		let cancelled = false;
		loading = true;
		error = null;
		void (async () => {
			try {
				const resp = await getDashboardWidget<TableWidgetData>(context(), d, n);
				if (!cancelled) rows = resp.data.rows;
			} catch (err) {
				if (!cancelled) error = err instanceof ApiError ? err.message : t('kit.dashboard.load_failed');
			} finally {
				if (!cancelled) loading = false;
			}
		})();
		return () => {
			cancelled = true;
		};
	});

	// Relation labels for the belongs_to columns (F2-07).
	$effect(() => {
		const currentMeta = meta;
		const currentRows = rows;
		if (!currentMeta || currentRows.length === 0) return;
		let cancelled = false;
		void resolveLabels(context(), currentMeta, currentRows).then((map) => {
			if (!cancelled) labels = map;
		});
		return () => {
			cancelled = true;
		};
	});
</script>

<Region title={label}>
	{#snippet buttonsRight()}
		<a href={`/r/${resource}`} class="text-primary text-sm underline-offset-4 hover:underline">
			{t('kit.dashboard.view_all')}
		</a>
		<button
			type="button"
			aria-label={t('kit.dashboard.refresh')}
			onclick={() => (reloadToken += 1)}
			class="text-muted-foreground hover:text-foreground rounded-md p-1 leading-none"
		>↻</button>
	{/snippet}
	{#if loading}
		<div class="flex flex-col gap-2" aria-hidden="true">
			<div class="bg-muted h-6 w-full animate-pulse rounded"></div>
			<div class="bg-muted h-6 w-full animate-pulse rounded"></div>
			<div class="bg-muted h-6 w-full animate-pulse rounded"></div>
		</div>
	{:else if error}
		<p class="text-destructive text-sm" role="alert">{error}</p>
	{:else if meta && settings}
		<ReportTable {meta} {settings} {rows} {aggregates} {labels} />
	{/if}
</Region>
