<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import { t } from '$lib/i18n/index.svelte';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';

	// Per-row actions (K5-06, K5 §1.2).
	let {
		canCreate = false,
		canEdit = false,
		onaction
	}: {
		canCreate?: boolean;
		canEdit?: boolean;
		onaction: (name: string) => void;
	} = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="icon" aria-label={t('kit.ig.row_actions')}>
				<EllipsisIcon />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="start" class="w-48">
		{#if canEdit}
			<DropdownMenu.Item onclick={() => onaction('row_edit')}>{t('kit.ig.edit')}</DropdownMenu.Item>
		{/if}
		{#if canCreate}
			<DropdownMenu.Item onclick={() => onaction('row_add')}>{t('kit.ig.row_add')}</DropdownMenu.Item>
			<DropdownMenu.Item onclick={() => onaction('row_duplicate')}>{t('kit.ig.row_duplicate')}</DropdownMenu.Item>
		{/if}
		<DropdownMenu.Item onclick={() => onaction('row_delete')}>{t('kit.ig.row_delete')}</DropdownMenu.Item>
		<DropdownMenu.Separator />
		<DropdownMenu.Item onclick={() => onaction('row_refresh')}>{t('kit.ig.row_refresh')}</DropdownMenu.Item>
		<DropdownMenu.Item onclick={() => onaction('row_revert')}>{t('kit.ig.row_revert')}</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
