<script lang="ts">
	import type { PendingApproval } from '$lib/api/resource-types';
	import { t } from '$lib/i18n/index.svelte';
	import { resourcesStore } from '$lib/stores/resources.svelte';

	// Pending approvals as a simple table (F7-04), shared by the /approvals page
	// and the "approvals" dashboard widget. Each row links to its record.
	let { rows }: { rows: PendingApproval[] } = $props();

	function resourceLabel(id: string): string {
		return resourcesStore.getResource(id)?.plural ?? id;
	}

	function humanize(name: string): string {
		return name.replace(/_/g, ' ');
	}
</script>

<div class="overflow-x-auto">
	<table class="w-full text-sm">
		<thead>
			<tr class="border-border border-b text-left">
				<th class="px-2 py-1 font-medium">{t('kit.approvals.table.resource')}</th>
				<th class="px-2 py-1 font-medium">{t('kit.approvals.table.record')}</th>
				<th class="px-2 py-1 font-medium">{t('kit.approvals.table.transition')}</th>
				<th class="px-2 py-1 font-medium">{t('kit.approvals.table.level')}</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as row (`${row.resource}:${row.record_id}`)}
				<tr class="border-border border-b">
					<td class="px-2 py-1">{resourceLabel(row.resource)}</td>
					<td class="px-2 py-1">
						<a
							class="text-primary underline underline-offset-4"
							href={`/r/${row.resource}/${row.record_id}`}
						>
							{row.title || row.record_id}
						</a>
					</td>
					<td class="px-2 py-1">{humanize(row.transition)}</td>
					<td class="px-2 py-1">{t('kit.workflow.level', { n: row.level })}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
