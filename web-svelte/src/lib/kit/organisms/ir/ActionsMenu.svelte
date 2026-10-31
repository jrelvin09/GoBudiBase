<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import { t } from '$lib/i18n/index.svelte';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

	const ROWS_PER_PAGE = [5, 10, 15, 20, 25, 50, 100, 200, 500, 1000];

	let {
		canExport = false,
		canImport = false,
		canDeleteReport = false,
		canSaveReport = true,
		pageSize,
		onaction,
		selectionCount = 0,
		onselection,
		bulkActions = [],
		onbulkaction
	}: {
		canExport?: boolean;
		canImport?: boolean;
		canDeleteReport?: boolean;
		/** false = sembunyikan "Save Report…" (preview baca-saja). */
		canSaveReport?: boolean;
		pageSize: number;
		onaction: (name: string, value?: number) => void;
		/** Interactive Grid only: a Selection submenu acts on the ticked rows (K5-06). */
		selectionCount?: number;
		onselection?: (name: string) => void;
		/** Aksi Bulk (F2-11) muncul di submenu Selection. */
		bulkActions?: { name: string; label: string; danger?: boolean }[];
		onbulkaction?: (name: string) => void;
	} = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="outline" size="sm">
				{t('kit.ir.actions')}
				<ChevronDownIcon data-icon="inline-end" />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="start" class="w-56">
		<DropdownMenu.Item onclick={() => onaction('columns')}>{t('kit.ir.action.columns')}</DropdownMenu.Item>
		<DropdownMenu.Item onclick={() => onaction('filter')}>{t('kit.ir.action.filter')}</DropdownMenu.Item>

		<DropdownMenu.Sub>
			<DropdownMenu.SubTrigger>{t('kit.ir.action.data')}</DropdownMenu.SubTrigger>
			<DropdownMenu.SubContent>
				<DropdownMenu.Item onclick={() => onaction('sort')}>{t('kit.ir.action.sort')}</DropdownMenu.Item>
				<DropdownMenu.Item onclick={() => onaction('aggregate')}>{t('kit.ir.action.aggregate')}</DropdownMenu.Item>
			</DropdownMenu.SubContent>
		</DropdownMenu.Sub>

		<DropdownMenu.Item onclick={() => onaction('group_by')}>{t('kit.ir.action.group_by')}</DropdownMenu.Item>
		<DropdownMenu.Item onclick={() => onaction('pivot')}>{t('kit.ir.action.pivot')}</DropdownMenu.Item>
		<DropdownMenu.Item onclick={() => onaction('chart')}>{t('kit.ir.action.chart')}</DropdownMenu.Item>
		<DropdownMenu.Item onclick={() => onaction('compute')}>{t('kit.ir.action.compute')}</DropdownMenu.Item>

		<DropdownMenu.Sub>
			<DropdownMenu.SubTrigger>{t('kit.ir.action.format')}</DropdownMenu.SubTrigger>
			<DropdownMenu.SubContent>
				<DropdownMenu.Item onclick={() => onaction('break')}>{t('kit.ir.action.break')}</DropdownMenu.Item>
				<DropdownMenu.Item onclick={() => onaction('highlight')}>{t('kit.ir.action.highlight')}</DropdownMenu.Item>
				<DropdownMenu.Sub>
					<DropdownMenu.SubTrigger>{t('kit.ir.action.rows_per_page')}</DropdownMenu.SubTrigger>
					<DropdownMenu.SubContent>
						<!-- RadioGroup reports the change through onValueChange; an
						     onclick on RadioItem never fires (K3-F17a). -->
						<DropdownMenu.RadioGroup
							value={String(pageSize)}
							onValueChange={(value) => onaction('rows', Number(value))}
						>
							{#each ROWS_PER_PAGE as n (n)}
								<DropdownMenu.RadioItem value={String(n)}>
									{n}
								</DropdownMenu.RadioItem>
							{/each}
						</DropdownMenu.RadioGroup>
					</DropdownMenu.SubContent>
				</DropdownMenu.Sub>
			</DropdownMenu.SubContent>
		</DropdownMenu.Sub>

		<DropdownMenu.Separator />

		{#if onselection}
			<DropdownMenu.Sub>
				<DropdownMenu.SubTrigger>{t('kit.ig.selection')}</DropdownMenu.SubTrigger>
				<DropdownMenu.SubContent>
					<DropdownMenu.Item disabled={selectionCount === 0} onclick={() => onselection('selection_duplicate')}>
						{t('kit.ig.selection_duplicate')}
					</DropdownMenu.Item>
					<DropdownMenu.Item disabled={selectionCount === 0} onclick={() => onselection('selection_revert')}>
						{t('kit.ig.selection_revert')}
					</DropdownMenu.Item>
					<DropdownMenu.Item disabled={selectionCount === 0} onclick={() => onselection('selection_delete')}>
						{t('kit.ig.selection_delete')}
					</DropdownMenu.Item>
					{#if bulkActions.length > 0}
						<DropdownMenu.Separator />
						{#each bulkActions as action (action.name)}
							<DropdownMenu.Item variant={action.danger ? 'destructive' : 'default'} disabled={selectionCount === 0} onclick={() => onbulkaction?.(action.name)}>
								{action.label}
							</DropdownMenu.Item>
						{/each}
					{/if}
				</DropdownMenu.SubContent>
			</DropdownMenu.Sub>
		{/if}

		<DropdownMenu.Sub>
			<DropdownMenu.SubTrigger>{t('kit.ir.action.report')}</DropdownMenu.SubTrigger>
			<DropdownMenu.SubContent>
				{#if canSaveReport}
					<DropdownMenu.Item onclick={() => onaction('save')}>{t('kit.ir.action.save')}</DropdownMenu.Item>
				{/if}
				<DropdownMenu.Item onclick={() => onaction('reset')}>{t('kit.ir.action.reset')}</DropdownMenu.Item>
				{#if canDeleteReport}
					<DropdownMenu.Item onclick={() => onaction('delete')}>{t('kit.ir.action.delete')}</DropdownMenu.Item>
				{/if}
			</DropdownMenu.SubContent>
		</DropdownMenu.Sub>

		{#if canExport}
			<DropdownMenu.Item onclick={() => onaction('download')}>{t('kit.ir.action.download')}</DropdownMenu.Item>
		{/if}
		{#if canImport}
			<DropdownMenu.Item onclick={() => onaction('import')}>{t('kit.ir.action.import')}</DropdownMenu.Item>
		{/if}
		<DropdownMenu.Item onclick={() => onaction('help')}>{t('kit.ir.action.help')}</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
