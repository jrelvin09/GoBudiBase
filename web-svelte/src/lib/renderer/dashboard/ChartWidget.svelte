<script lang="ts">
	import { ApiError, type AdminContext } from '$lib/api/client';
	import { getDashboardWidget, type ChartWidgetData } from '$lib/api/resources';
	import { t } from '$lib/i18n/index.svelte';
	import Region from '$lib/kit/organisms/Region.svelte';
	import BarChart from '$lib/kit/organisms/chart/BarChart.svelte';
	import LineChart from '$lib/kit/organisms/chart/LineChart.svelte';
	import PieChart from '$lib/kit/organisms/chart/PieChart.svelte';
	import { sessionStore } from '$lib/stores/session.svelte';

	// Chart widget (F5-03): one grouped series, drawn with the K4-06 charts.
	let {
		dashboardId,
		name,
		label,
		chartType
	}: { dashboardId: string; name: string; label: string; chartType?: string } = $props();

	let data = $state<ChartWidgetData | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let reloadToken = $state(0);

	const points = $derived(
		(data?.labels ?? []).map((category, index) => ({
			label: category,
			value: Number(data?.series?.[0]?.values?.[index] ?? 0)
		}))
	);

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
				const resp = await getDashboardWidget<ChartWidgetData>(context(), d, n);
				if (!cancelled) data = resp.data;
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
</script>

<Region title={label}>
	{#snippet buttonsRight()}
		<button
			type="button"
			aria-label={t('kit.dashboard.refresh')}
			onclick={() => (reloadToken += 1)}
			class="text-muted-foreground hover:text-foreground rounded-md p-1 leading-none"
		>↻</button>
	{/snippet}
	{#if loading}
		<div class="bg-muted h-40 w-full animate-pulse rounded" aria-hidden="true"></div>
	{:else if error}
		<p class="text-destructive text-sm" role="alert">{error}</p>
	{:else if chartType === 'line'}
		<LineChart data={points} {label} />
	{:else if chartType === 'pie'}
		<PieChart data={points} {label} />
	{:else}
		<BarChart data={points} {label} />
	{/if}
</Region>
