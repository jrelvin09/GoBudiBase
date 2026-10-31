<script lang="ts">
	import { goto } from '$app/navigation';
	import { ApiError } from '$lib/api/client';
	import { queryReport } from '$lib/api/resources';
import { resolveLabels, type LabelMap } from '$lib/renderer/labels';
	import type { ResourceMeta } from '$lib/api/resource-types';
	import { getLocale, t } from '$lib/i18n/index.svelte';
	import MonthCalendar from '$lib/kit/organisms/calendar/MonthCalendar.svelte';
	import { monthGrid, visibleRange, weekStartFor } from '$lib/kit/organisms/calendar/month';
	import type { ReportSettings } from '$lib/kit/organisms/ir/types';
	import { notify } from '$lib/stores/notify.svelte';
	import { sessionStore } from '$lib/stores/session.svelte';

	// Region Calendar (K6-04): `_query` yang sama dengan IR, difilter between pada
	// `calendar_field` sesuai bulan yang tampil.
	let {
		meta,
		onedit,
		oncreate
	}: {
		meta: ResourceMeta;
		onedit?: (id: string) => void;
		oncreate?: (prefill: Record<string, unknown>) => void;
	} = $props();

	const field = $derived(meta.calendar_field ?? '');
	const weekStart = $derived(weekStartFor(getLocale()));
	const canCreate = $derived(meta.capabilities.create === true);
	const today = new Date();
	let year = $state(today.getFullYear());
	let month = $state(today.getMonth() + 1);
	let rows = $state<Record<string, unknown>[]>([]);
	let labels = $state<LabelMap>({});
	let loading = $state(false);
	let controller: AbortController | null = null;

	const range = $derived(visibleRange(monthGrid(year, month, weekStart)));
	const settings = $derived<ReportSettings>({
		columns: meta.fields.filter((f) => f.in_table).map((f) => f.name),
		filters: field
			? [{ id: 'calendar_range', kind: 'column', column: field, op: 'between', value: range, enabled: true }]
			: [],
		sort: [],
		breaks: [],
		highlights: [],
		aggregates: [],
		page_size: 1000,
		view: 'report',
		group_by: null,
		pivot: null,
		chart: null,
		computations: [],
		widths: {},
		frozen: null
	});

	function context() {
		return {
			companyId: sessionStore.context.company_id ?? '',
			locationId: sessionStore.context.location_id ?? null,
			contextVersion: sessionStore.context.context_version
		};
	}
	$effect(() => {
		const current = settings;
		if (!field || current.columns.length === 0) return;
		controller?.abort();
		const request = new AbortController();
		controller = request;
		loading = true;
		void (async () => {
			try {
				const resp = await queryReport(context(), meta.id, current, 1, sessionStore.csrfToken, request.signal);
				rows = resp.data.rows;
				const map = await resolveLabels(context(), meta, resp.data.rows);
				if (controller === request) labels = map;
			} catch (err) {
				if (err instanceof DOMException && err.name === 'AbortError') return;
				notify.errors([{ text: err instanceof ApiError ? err.message : t('kit.ir.load_failed') }]);
			} finally {
				if (controller === request) loading = false;
			}
		})();
	});

	function edit(row: Record<string, unknown>) {
		if (onedit) onedit(String(row.id));
		else void goto(`/r/${meta.id}/${row.id}`);
	}

	function create(day: string) {
		if (!canCreate) return;
		if (oncreate) oncreate({ [field]: day });
		else void goto(`/r/${meta.id}/new?${field}=${day}`);
	}
</script><div class="flex flex-col gap-3">
	{#if field}
		<MonthCalendar
			bind:year
			bind:month
			{weekStart}
			{rows}
			{labels}
			dateField={field}
			titleField={meta.title_field}
			{canCreate}
			onedit={edit}
			oncreate={create}
		/>
		{#if loading}
			<p class="text-muted-foreground text-sm" role="status">{t('kit.common.loading')}</p>
		{/if}
	{:else}
		<p class="text-destructive text-sm">{t('kit.ir.load_failed')}</p>
	{/if}
</div>