<script lang="ts">
	import { ApiError, type AdminContext } from '$lib/api/client';
	import { getDashboardWidget, type StatWidgetData } from '$lib/api/resources';
	import { formatNumber } from '$lib/i18n/format';
	import { t } from '$lib/i18n/index.svelte';
	import Region from '$lib/kit/organisms/Region.svelte';
	import { sessionStore } from '$lib/stores/session.svelte';

	// Stat widget (F5-03): one number. It loads its own data, so a failing widget
	// never breaks its neighbours.
	let { dashboardId, name, label }: { dashboardId: string; name: string; label: string } = $props();

	let value = $state<number | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let reloadToken = $state(0);

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
				const resp = await getDashboardWidget<StatWidgetData>(context(), d, n);
				if (!cancelled) value = resp.data.value;
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
		<div class="bg-muted h-8 w-24 animate-pulse rounded" aria-hidden="true"></div>
	{:else if error}
		<p class="text-destructive text-sm" role="alert">{error}</p>
	{:else}
		<p class="text-3xl font-semibold">{formatNumber(value)}</p>
	{/if}
</Region>
