<script lang="ts">
	import { ApiError, type AdminContext } from '$lib/api/client';
	import { getDashboardWidget, type ApprovalsWidgetData } from '$lib/api/resources';
	import type { PendingApproval } from '$lib/api/resource-types';
	import { t } from '$lib/i18n/index.svelte';
	import Region from '$lib/kit/organisms/Region.svelte';
	import PendingApprovalsTable from '$lib/renderer/workflow/PendingApprovalsTable.svelte';
	import { sessionStore } from '$lib/stores/session.svelte';

	// Approvals widget (F7-04): the caller's pending approval list as a simple
	// table. The layout matches the other dashboard widgets (Region + refresh).
	let { dashboardId, name, label }: { dashboardId: string; name: string; label: string } = $props();

	let rows = $state<PendingApproval[]>([]);
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
				const resp = await getDashboardWidget<ApprovalsWidgetData>(context(), d, n);
				if (!cancelled) rows = resp.data.rows;
			} catch (err) {
				if (!cancelled) error = err instanceof ApiError ? err.message : t('kit.approvals.load_failed');
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
		<a href="/approvals" class="text-primary text-sm underline-offset-4 hover:underline">
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
		<p class="text-muted-foreground text-sm">{t('kit.common.loading')}</p>
	{:else if error}
		<p class="text-destructive text-sm" role="alert">{error}</p>
	{:else if rows.length === 0}
		<p class="text-muted-foreground text-sm">{t('kit.approvals.empty')}</p>
	{:else}
		<PendingApprovalsTable {rows} />
	{/if}
</Region>
