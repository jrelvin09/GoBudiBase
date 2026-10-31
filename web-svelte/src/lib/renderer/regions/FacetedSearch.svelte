<script lang="ts">
	import { onMount } from 'svelte';
	import { ApiError } from '$lib/api/client';
	import { distinctValues, listReports, queryReport } from '$lib/api/resources';
import { resolveLabels, type LabelMap } from '$lib/renderer/labels';
	import type { ResourceMeta } from '$lib/api/resource-types';
	import { t } from '$lib/i18n/index.svelte';
	import FacetPanel from '$lib/kit/organisms/facets/FacetPanel.svelte';
	import {
		emptyFacetState,
		facetFields,
		facetFilters,
		settingsForCounts,
		type FacetCounts,
		type FacetState
	} from '$lib/kit/organisms/facets/facets';
	import { normalizeSettings } from '$lib/kit/organisms/ir/model';
	import Pagination from '$lib/kit/organisms/ir/Pagination.svelte';
	import ReportTable from '$lib/kit/organisms/ir/ReportTable.svelte';
	import type { ReportSettings } from '$lib/kit/organisms/ir/types';
	import { notify } from '$lib/stores/notify.svelte';
	import { sessionStore } from '$lib/stores/session.svelte';

	// Region Faceted Search (K6-03): facet kiri menyaring lewat `_query` yang sama
	// dengan IR; count tiap facet dari `_distinct` dengan facet lain tetap aktif.
	let { meta }: { meta: ResourceMeta } = $props();

	const storageKey = $derived(`bb.facets.${meta.id}`);
	const fields = $derived(facetFields(meta));

	function context() {
		return {
			companyId: sessionStore.context.company_id ?? '',
			locationId: sessionStore.context.location_id ?? null,
			contextVersion: sessionStore.context.context_version
		};
	}
	let base = $state<ReportSettings | null>(null);
	let facetState = $state<FacetState>(emptyFacetState());
	let page = $state(1);
	let rows = $state<Record<string, unknown>[]>([]);
	let labels = $state<LabelMap>({});
	let total = $state(0);
	let counts = $state<FacetCounts>({});
	let loading = $state(false);
	let rowController: AbortController | null = null;
	let countController: AbortController | null = null;
	let countTimer: ReturnType<typeof setTimeout> | null = null;

	// Kolom dan sortir mengikuti laporan primary; filter datang dari facet.
	const settings = $derived<ReportSettings | null>(
		base ? { ...base, filters: facetFilters(facetState, meta) } : null
	);

	function readStored(): FacetState | null {
		try {
			const raw = sessionStorage.getItem(storageKey);
			if (!raw) return null;
			const parsed = JSON.parse(raw) as FacetState;
			return {
				search: typeof parsed.search === 'string' ? parsed.search : '',
				selected: parsed.selected ?? {},
				ranges: parsed.ranges ?? {}
			};
		} catch {
			return null;
		}
	}

	function writeStored(value: FacetState) {
		try {
			sessionStorage.setItem(storageKey, JSON.stringify(value));
		} catch {
			// preferensi tampilan saja
		}
	}

	function reportError(err: unknown) {
		if (err instanceof ApiError) notify.errors([{ text: err.message }]);
		else notify.errors([{ text: t('kit.ir.load_failed') }]);
	}
	onMount(() => {
		void (async () => {
			try {
				const resp = await listReports(context(), meta.id);
				const primary = resp.data.find((report) => report.id === 'primary') ?? resp.data[0];
				base = primary ? normalizeSettings(primary.settings) : null;
				facetState = readStored() ?? emptyFacetState();
			} catch (err) {
				reportError(err);
			}
		})();
	});

	function onStateChange(next: FacetState) {
		facetState = next;
		page = 1;
		writeStored(next);
	}

	$effect(() => {
		const current = settings;
		const currentPage = page;
		if (!current) return;
		rowController?.abort();
		const request = new AbortController();
		rowController = request;
		loading = true;
		void (async () => {
			try {
				const resp = await queryReport(context(), meta.id, current, currentPage, sessionStore.csrfToken, request.signal);
				rows = resp.data.rows;
				const map = await resolveLabels(context(), meta, resp.data.rows);
				if (rowController === request) labels = map;
				total = resp.data.total;
			} catch (err) {
				if (err instanceof DOMException && err.name === 'AbortError') return;
				reportError(err);
			} finally {
				if (rowController === request) loading = false;
			}
		})();
	});

	// Count dihitung dengan facet lain tetap aktif, tanpa facet yang dihitung.
	async function loadCounts(current: FacetState) {
		const names = fields.filter((field) => field.type === 'select' || field.type === 'toggle');
		if (names.length === 0) return;
		countController?.abort();
		const request = new AbortController();
		countController = request;
		try {
			const results = await Promise.all(
				names.map(async (field) => {
					const settings = settingsForCounts(current, meta, field.name);
					const resp = await distinctValues(context(), meta.id, settings, field.name, '', sessionStore.csrfToken, request.signal);
					return [
						field.name,
						resp.data.values.map((value) => ({ value: String(value.value), label: value.label, count: value.count }))
					] as const;
				})
			);
			counts = Object.fromEntries(results);
		} catch (err) {
			if (err instanceof DOMException && err.name === 'AbortError') return;
			reportError(err);
		}
	}

	// Count dimuat ulang 300 ms setelah perubahan facet terakhir (K6-03 step 4).
	$effect(() => {
		const current = facetState;
		if (countTimer) clearTimeout(countTimer);
		countTimer = setTimeout(() => void loadCounts(current), 300);
		return () => {
			if (countTimer) clearTimeout(countTimer);
		};
	});
</script>
<div class="flex flex-col gap-4 lg:flex-row">
	<FacetPanel {meta} state={facetState} {counts} onchange={onStateChange} />
	<div class="flex min-w-0 flex-1 flex-col gap-3">
		{#if settings}
			<ReportTable
				{meta}
				{settings}
				{rows}
				{labels}
				aggregates={{ overall: {}, breaks: [] }}
				isLastPage={page * settings.page_size >= total}
				linkHref={meta.capabilities.view ? (row) => `/r/${meta.id}/${row.id}` : undefined}
			/>
			<p class="text-muted-foreground text-sm">{t('kit.facets.results', { n: total })}</p>
			<div class="flex items-center justify-end">
				<Pagination {page} pageSize={settings.page_size} {total} onpage={(next) => (page = next)} />
			</div>
		{/if}
		{#if loading}
			<p class="text-muted-foreground text-sm" role="status">{t('kit.common.loading')}</p>
		{/if}
	</div>
</div>
