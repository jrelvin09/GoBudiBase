<script lang="ts">
	import type { ResourceMeta } from '$lib/api/resource-types';
	import { queryReport } from '$lib/api/resources';
	import { t } from '$lib/i18n/index.svelte';
	import { normalizeSettings, withLockedFilters } from '$lib/kit/organisms/ir/model';
	import { sessionStore } from '$lib/stores/session.svelte';
	import type { MetricFn } from './page-definition';

	// Region runtime `kpi`: satu agregat atas resource. Nilai dibaca lewat query
	// laporan yang sama (scope + RBAC tidak berubah); `count` memakai total baris.
	let {
		meta,
		metric,
		filters
	}: {
		meta: ResourceMeta;
		metric?: { fn: MetricFn; field?: string };
		filters?: { field: string; op: 'eq'; value: string }[];
	} = $props();

	const AGG_ID = 'kpi';
	let value = $state<unknown>(null);
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
		const field = metric?.field;
		const locked = (filters ?? []).map((f) => ({ column: f.field, value: typed(f.field, f.value) }));
		const controller = new AbortController();
		loading = true;
		failed = false;
		const base = normalizeSettings({
			columns: [meta.fields[0]?.name ?? 'id'],
			page_size: 5,
			aggregates: fn === 'count' || !field ? [] : [{ id: AGG_ID, fn, column: field, enabled: true }]
		});
		void queryReport(
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
				value = fn === 'count' || !field ? resp.data.total : (resp.data.aggregates.overall[AGG_ID] ?? null);
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

	const label = $derived(
		metric?.fn === 'count' || !metric?.field
			? `${meta.plural}`
			: `${metric.fn}(${meta.fields.find((f) => f.name === metric?.field)?.label ?? metric.field})`
	);
</script>

<div class="flex flex-col gap-1 rounded-md border p-4" role="group" aria-label={label}>
	<span class="text-muted-foreground text-sm">{label}</span>
	{#if failed}
		<span class="text-destructive text-sm" role="alert">{t('kit.msg.request_failed')}</span>
	{:else if loading}
		<span class="text-muted-foreground text-sm" role="status">{t('kit.common.loading')}</span>
	{:else}
		<span class="text-3xl font-semibold tabular-nums" data-testid="kpi-value">{value ?? '—'}</span>
	{/if}
</div>
