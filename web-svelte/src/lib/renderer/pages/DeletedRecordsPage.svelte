<script lang="ts">
	import { ApiError } from '$lib/api/client';
	import { listDeleted, restoreRecord } from '$lib/api/resources';
	import type { ResourceMeta } from '$lib/api/resource-types';
	import { APP_NAME } from '$lib/app';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import { formatDateTime } from '$lib/i18n/format';
	import { t } from '$lib/i18n/index.svelte';
	import { confirm } from '$lib/kit/confirm.svelte';
	import type { HistoryEntry } from '$lib/kit/organisms/history/history';
	import Pagination from '$lib/kit/organisms/ir/Pagination.svelte';
	import Region from '$lib/kit/organisms/Region.svelte';
	import { displayText } from '$lib/kit/molecules/display';
	import { notify } from '$lib/stores/notify.svelte';
	import { sessionStore } from '$lib/stores/session.svelte';

	// Deleted records + Restore (F2-14): the newest delete entry per record that
	// no longer exists, one page of 50, each row restorable from its snapshot.
	let { meta }: { meta: ResourceMeta } = $props();

	const columns = $derived(meta.fields.filter((field) => field.in_table));
	const canRestore = $derived(meta.capabilities.restore === true);

	let page = $state(1);
	let pageSize = $state(50);
	let total = $state(0);
	let rows = $state<HistoryEntry[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let restoring = $state<string | null>(null);

	function context() {
		return {
			companyId: sessionStore.context.company_id ?? '',
			locationId: sessionStore.context.location_id ?? null,
			contextVersion: sessionStore.context.context_version
		};
	}
	function valueText(name: string, row: HistoryEntry): string {
		const field = meta.fields.find((entry) => entry.name === name);
		const value = row.snapshot?.[name];
		if (!field) return value == null ? '' : String(value);
		return displayText(field.type, value, field.options);
	}

	async function fetchPage(target: number) {
		loading = true;
		error = null;
		try {
			const resp = await listDeleted(context(), meta.id, target);
			rows = resp.data;
			total = Number(resp.meta.pagination?.total ?? resp.data.length);
			pageSize = resp.meta.pagination?.page_size ?? 50;
		} catch (err) {
			error = err instanceof ApiError ? err.message : t('kit.msg.request_failed');
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		void fetchPage(page);
	});
	async function onRestore(row: HistoryEntry) {
		const id = row.record_id;
		if (!id) return;
		const ok = await confirm({
			message: t('kit.history.restore_confirm'),
			okLabel: t('kit.history.restore'),
			danger: true
		});
		if (!ok) return;
		restoring = id;
		try {
			await restoreRecord(context(), meta.id, id, sessionStore.csrfToken);
			notify.success(t('kit.history.restored'));
			if (rows.length === 1 && page > 1) page -= 1;
			else await fetchPage(page);
		} catch (err) {
			notify.errors([{ text: err instanceof ApiError ? err.message : t('kit.msg.request_failed') }]);
		} finally {
			restoring = null;
		}
	}
</script>
<svelte:head>
	<title>{t('kit.history.deleted_title')} — {APP_NAME}</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<nav aria-label="Breadcrumb" class="text-muted-foreground flex items-center gap-1 text-sm">
		<a href={`/r/${meta.id}`} class="text-primary underline-offset-4 hover:underline">{meta.plural}</a>
		<span aria-hidden="true">›</span>
		<span>{t('kit.history.deleted_title')}</span>
	</nav>

	<Region title={t('kit.history.deleted_title')} headingLevel={1}>
		{#if error}
			<p class="text-destructive text-sm">{error}</p>
		{:else if loading}
			<p class="text-muted-foreground text-sm">{t('kit.common.loading')}</p>
		{:else if rows.length === 0}
			<p class="text-muted-foreground text-sm">{t('kit.msg.no_data_found')}</p>
		{:else}
			<Table.Root>
				<Table.Header>
					<Table.Row>
						{#each columns as column (column.name)}
							<Table.Head>{column.label}</Table.Head>
						{/each}
						<Table.Head>{t('kit.history.deleted_at')}</Table.Head>
						<Table.Head>{t('kit.history.deleted_by')}</Table.Head>
						{#if canRestore}
							<Table.Head class="text-right">{t('kit.history.restore')}</Table.Head>
						{/if}
					</Table.Row>
				</Table.Header>				<Table.Body>
					{#each rows as row, index (row.record_id ?? index)}
						<Table.Row>
							{#each columns as column (column.name)}
								<Table.Cell>{valueText(column.name, row)}</Table.Cell>
							{/each}
							<Table.Cell>{formatDateTime(row.occurred_at)}</Table.Cell>
							<Table.Cell>{row.actor_name}</Table.Cell>
							{#if canRestore}
								<Table.Cell class="text-right">
									<Button
										size="sm"
										variant="outline"
										disabled={restoring === row.record_id}
										onclick={() => void onRestore(row)}
									>
										{t('kit.history.restore')}
									</Button>
								</Table.Cell>
							{/if}
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
			<div class="mt-2">
				<Pagination {page} {pageSize} {total} onpage={(next) => (page = next)} />
			</div>
		{/if}
	</Region>
</div>