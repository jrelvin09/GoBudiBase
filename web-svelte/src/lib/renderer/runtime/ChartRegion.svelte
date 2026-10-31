<script lang="ts">
	import type { ResourceMeta } from '$lib/api/resource-types';
	import { groupByReport } from '$lib/api/resources';
	import { t } from '$lib/i18n/index.svelte';
	import BarChart from '$lib/kit/organisms/chart/BarChart.svelte';
	import { chartPoints, normalizeSettings, withLockedFilters } from '$lib/kit/organisms/ir/model';
	import { sessionStore } from '$lib/stores/session.svelte';
	import type { MetricFn } from './page-definition';

	// Region runtime `chart`: satu agregat per kelompok (groupBy). Data dibaca lewat
	// query group-by laporan yang sama, jadi scope dan RBAC tidak berubah.
	let {
		meta,
		metric,
		groupBy,
		filters
	}: {
		meta: ResourceMeta;
		metric?: { fn: MetricFn; field?: string };
		groupBy?: string;
		filters?: { field: string; op: 'eq'; value: string }[];
	} = $props();

	let points = $state<{ label: string; value: number }[]>([]);
	let failed = $state(false);
	let loading = $state(true);

	function typed(column: string, raw: string): unknown {
		const type = meta.fields.find((f) => f.name === column)?.type;
		if (type === 'toggle') return raw === 'true';
		if (type === 'number') return Number(raw);
		return raw;
	}

	$effect(() => {
		const fn = metric?.fn ?? 'count';
		const valueColumn = fn === 'count' || !metric?.field ? (groupBy ?? '') : metric.field;
		const locked = (filters ?? []).map((f) => ({ column: f.field, value: typed(f.field, f.value) }));
		if (!groupBy) {
			loading = false;
			return;
		}
		const controller = new AbortController();
		loading = true;
		failed = false;
		const base = normalizeSettings({
			columns: [groupBy],
			page_size: 1000,
			view: 'group_by',
			group_by: { columns: [groupBy], functions: [{ id: '', fn, column: valueColumn, label: '' }], sort: [] }
		});
		void groupByReport(
			{
				companyId: sessionStore.context.company_id ?? '',
				locationId: sessionStore.context.location_id ?? null,
				contextVersion: sessionStore.context.context_version
			},
			meta.id,
			withLockedFilters(base, locked),
			1,
			sessionStore.csrfToken,
			controller.signal
		)
			.then((resp) => {
				if (controller.signal.aborted) return;
				points = chartPoints(meta, { type: 'bar', label_column: groupBy, fn, value_column: valueColumn, orientation: 'vertical', sort: 'label_asc' } as never, resp.data.rows);
			})
			.catch((err) => {
				// Permintaan basi (efek dijalankan ulang) tidak boleh menimpa hasil permintaan baru.
				if (!controller.signal.aborted && (err as Error)?.name !== 'AbortError') failed = true;
			})
			.finally(() => {
				if (!controller.signal.aborted) loading = false;
			});
		return () => controller.abort();
	});

	const label = $derived(`${meta.plural} · ${meta.fields.find((f) => f.name === groupBy)?.label ?? groupBy ?? ''}`);
</script>

<div class="flex flex-col gap-2 rounded-md border p-4" role="group" aria-label={label}>
	<span class="text-muted-foreground text-sm">{label}</span>
	{#if failed}
		<span class="text-destructive text-sm" role="alert">{t('kit.msg.request_failed')}</span>
	{:else if loading}
		<span class="text-muted-foreground text-sm" role="status">{t('kit.common.loading')}</span>
	{:else if points.length === 0}
		<span class="text-muted-foreground text-sm">—</span>
	{:else}
		<BarChart data={points} {label} />
	{/if}
</div>
