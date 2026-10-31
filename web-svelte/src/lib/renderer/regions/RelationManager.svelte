<script lang="ts">
	import type { ResourceMeta } from '$lib/api/resource-types';
	import { Button } from '$lib/components/ui/button';
	import { t } from '$lib/i18n/index.svelte';
	import FormDrawer from '$lib/renderer/regions/FormDrawer.svelte';
	import InteractiveGrid from '$lib/renderer/regions/InteractiveGrid.svelte';
	import InteractiveReport from '$lib/renderer/regions/InteractiveReport.svelte';
	import { resourcesStore } from '$lib/stores/resources.svelte';

	// RelationManager (F3-03): one has_many tab of a record edit page. Child rows
	// come from the child resource's own endpoint, scoped to this record by the
	// locked foreign key; that FK is taken from the parent id, never shown.
	type Relation = NonNullable<ResourceMeta['relations']>[number];

	let { relation, parentId }: { relation: Relation; parentId: string } = $props();

	const childMeta = $derived(resourcesStore.getResource(relation.resource));
	const lockedFilter = $derived({ column: relation.foreign_key, value: parentId });

	let drawerOpen = $state(false);
	let drawerMode = $state<'create' | 'edit'>('create');
	let drawerId = $state<string | null>(null);
	let reloadToken = $state(0);

	function openCreate() {
		drawerId = null;
		drawerMode = 'create';
		drawerOpen = true;
	}

	function openEdit(id: string) {
		drawerId = id;
		drawerMode = 'edit';
		drawerOpen = true;
	}

	function onSaved() {
		drawerOpen = false;
		reloadToken += 1;
	}
</script>

{#if childMeta}
	{#key reloadToken}
		{#if relation.grid}
			<InteractiveGrid meta={childMeta} {lockedFilter} />
		{:else}
			<InteractiveReport meta={childMeta} {lockedFilter} onedit={openEdit}>
				{#snippet right()}
					{#if childMeta.capabilities.create}
						<Button onclick={openCreate}>{t('kit.common.create')}</Button>
					{/if}
				{/snippet}
			</InteractiveReport>
		{/if}
	{/key}
	<FormDrawer
		bind:open={drawerOpen}
		meta={childMeta}
		mode={drawerMode}
		recordId={drawerId}
		prefill={{ [relation.foreign_key]: parentId }}
		hiddenFields={[relation.foreign_key]}
		onsaved={onSaved}
	/>
{/if}