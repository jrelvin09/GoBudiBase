<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { t } from '$lib/i18n/index.svelte';
	import ActionsMenu from '$lib/kit/organisms/ir/ActionsMenu.svelte';
	import SearchBar from '$lib/kit/organisms/ir/SearchBar.svelte';

	// Interactive Grid toolbar (K5-06, K5 §1.1):
	// [search][Go] [Actions] [Edit] [Save] [Add Row] ... [Reset]
	let {
		columns = [],
		search = $bindable(''),
		onsearch,
		pageSize = 25,
		editable = $bindable(false),
		canEdit = false,
		canCreate = false,
		canExport = false,
		canSave = false,
		selectionCount = 0,
		onaction,
		onselection,
		bulkActions = [],
		onbulkaction,
		onsave,
		onaddrow,
		onreset
	}: {
		columns?: { value: string; label: string }[];
		search?: string;
		onsearch: (text: string, column: string | null) => void;
		pageSize?: number;
		editable?: boolean;
		canEdit?: boolean;
		canCreate?: boolean;
		canExport?: boolean;
		canSave?: boolean;
		selectionCount?: number;
		onaction?: (name: string, value?: number) => void;
		onselection?: (name: string) => void;
		bulkActions?: { name: string; label: string; danger?: boolean }[];
		onbulkaction?: (name: string) => void;
		onsave?: () => void;
		onaddrow?: () => void;
		onreset?: () => void;
	} = $props();
</script>

<SearchBar
	{columns}
	bind:text={search}
	{onsearch}
	actions={actionsSnippet}
	right={rightSnippet}
/>

{#snippet actionsSnippet()}
	<ActionsMenu
		{canExport}
		{pageSize}
		onaction={(name, value) => onaction?.(name, value)}
		{selectionCount}
		{onselection}
		{bulkActions}
		{onbulkaction}
	/>
{/snippet}

{#snippet rightSnippet()}
	<div class="flex flex-wrap items-center gap-2">
		{#if canEdit}
			<Button
				variant={editable ? 'default' : 'outline'}
				size="sm"
				aria-pressed={editable}
				onclick={() => (editable = !editable)}
			>
				{t('kit.ig.edit')}
			</Button>
		{/if}
		<Button size="sm" disabled={!canSave} onclick={onsave}>{t('kit.ig.save')}</Button>
		{#if canCreate}
			<Button variant="outline" size="sm" onclick={onaddrow}>{t('kit.ig.add_row')}</Button>
		{/if}
		<Button variant="ghost" size="sm" onclick={onreset}>{t('kit.ig.reset')}</Button>
	</div>
{/snippet}
