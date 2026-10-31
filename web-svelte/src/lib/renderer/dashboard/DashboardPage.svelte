<script lang="ts">
	import { APP_NAME } from '$lib/app';
	import { ApiError, type AdminContext } from '$lib/api/client';
	import { getDashboard, type DashboardMeta } from '$lib/api/resources';
	import { t } from '$lib/i18n/index.svelte';
	import { sessionStore } from '$lib/stores/session.svelte';
	import ChartWidget from './ChartWidget.svelte';
	import StatWidget from './StatWidget.svelte';
	import TableWidget from './TableWidget.svelte';
	import ApprovalsWidget from './ApprovalsWidget.svelte';

	// Dashboard page (F5-03): the widgets and their spans come from the server,
	// which already left out the ones the caller may not view.
	let { id }: { id: string } = $props();

	let meta = $state<DashboardMeta | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Kelas ditulis eksplisit agar pemindai Tailwind menemukannya.
	const SPAN_CLASSES: Record<number, string> = {
		1: 'col-span-1',
		2: 'col-span-1 sm:col-span-2',
		3: 'col-span-1 sm:col-span-2 xl:col-span-3',
		4: 'col-span-1 sm:col-span-2 xl:col-span-4'
	};

	function spanClass(span: number): string {
		return SPAN_CLASSES[Math.min(4, Math.max(1, span))];
	}

	function context(): AdminContext {
		return {
			companyId: sessionStore.context.company_id ?? '',
			locationId: sessionStore.context.location_id ?? null,
			contextVersion: sessionStore.context.context_version
		};
	}

	$effect(() => {
		const dashboardId = id;
		if (!dashboardId) return;
		let cancelled = false;
		loading = true;
		error = null;
		void (async () => {
			try {
				const resp = await getDashboard(context(), dashboardId);
				if (!cancelled) meta = resp.data;
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

<svelte:head>
	<title>{meta?.label ?? t('kit.dashboard.title')} — {APP_NAME}</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<h1 class="text-lg font-semibold">{meta?.label ?? t('kit.dashboard.title')}</h1>
	{#if loading}
		<p class="text-muted-foreground text-sm" role="status">{t('kit.common.loading')}</p>
	{:else if error}
		<p class="text-destructive text-sm" role="alert">{error}</p>
	{:else if meta}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
			{#each meta.widgets as widget (widget.name)}
				<div class={spanClass(widget.span)}>
					{#if widget.kind === 'stat'}
						<StatWidget dashboardId={meta.id} name={widget.name} label={widget.label} />
					{:else if widget.kind === 'chart'}
						<ChartWidget
							dashboardId={meta.id}
							name={widget.name}
							label={widget.label}
							chartType={widget.chart_type}
						/>
					{:else if widget.kind === 'approvals'}
						<ApprovalsWidget dashboardId={meta.id} name={widget.name} label={widget.label} />
					{:else}
						<TableWidget
							dashboardId={meta.id}
							name={widget.name}
							label={widget.label}
							resource={widget.resource}
						/>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
