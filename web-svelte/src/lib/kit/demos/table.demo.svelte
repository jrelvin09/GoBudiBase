<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Table from '$lib/components/ui/table';
	import { formatNumber } from '$lib/i18n/format';
	import { t } from '$lib/i18n/index.svelte';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import TrashIcon from '@lucide/svelte/icons/trash-2';

	type Row = { id: string; name: string; status: 'active' | 'draft'; amount: number };

	const rows: Row[] = [
		{ id: 'r1', name: 'kit.demo.person_1', status: 'active', amount: 1250000 },
		{ id: 'r2', name: 'kit.demo.person_2', status: 'draft', amount: 840000 },
		{ id: 'r3', name: 'kit.demo.person_3', status: 'active', amount: 2310000 }
	];

	let selected = $state<string[]>([]);
	const allSelected = $derived(rows.length > 0 && selected.length === rows.length);
	const total = $derived(rows.reduce((sum, row) => sum + row.amount, 0));

	function toggleAll() {
		selected = allSelected ? [] : rows.map((row) => row.id);
	}

	function toggle(id: string) {
		selected = selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];
	}
</script>

<div class="flex max-w-2xl flex-col gap-6">
	<Table.Root>
		<Table.Caption class="text-muted-foreground caption-bottom text-xs">
			{t('kit.demo.table_compact')}
		</Table.Caption>
		<Table.Header>
			<Table.Row>
				<Table.Head class="w-10">
					<Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label={t('kit.ig.select_all')} />
				</Table.Head>
				<Table.Head>{t('kit.ir.filter.name')}</Table.Head>
				<Table.Head>{t('kit.demo.col_status')}</Table.Head>
				<Table.Head class="text-right">{t('kit.demo.col_amount')}</Table.Head>
				<Table.Head class="w-20 text-right">{t('kit.ig.row_actions')}</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each rows as row (row.id)}
				<Table.Row
					data-state={selected.includes(row.id) ? 'selected' : undefined}
					class={selected.includes(row.id) ? 'bg-muted' : ''}
				>
					<Table.Cell>
						<Checkbox
							checked={selected.includes(row.id)}
							onCheckedChange={() => toggle(row.id)}
							aria-label="{t('kit.ig.select_row')} {t(row.name)}"
						/>
					</Table.Cell>
					<Table.Cell class="font-medium">{t(row.name)}</Table.Cell>
					<Table.Cell>
						<Badge variant={row.status === 'active' ? 'success' : 'secondary'}>
							{row.status === 'active' ? t('kit.demo.badge_active') : t('kit.demo.badge_draft')}
						</Badge>
					</Table.Cell>
					<Table.Cell class="text-right tabular-nums">{formatNumber(row.amount)}</Table.Cell>
					<Table.Cell>
						<div class="flex justify-end gap-1">
							<Button
								size="icon-sm"
								variant="ghost"
								aria-label="{t('kit.common.edit')} {t(row.name)}"
							>
								<PencilIcon />
							</Button>
							<Button
								size="icon-sm"
								variant="ghost"
								aria-label="{t('kit.common.delete')} {t(row.name)}"
							>
								<TrashIcon />
							</Button>
						</div>
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
		<Table.Footer>
			<Table.Row>
				<Table.Cell colspan={3}>{t('kit.demo.table_selected', { n: selected.length })}</Table.Cell>
				<Table.Cell class="text-right font-medium tabular-nums">{formatNumber(total)}</Table.Cell>
				<Table.Cell></Table.Cell>
			</Table.Row>
		</Table.Footer>
	</Table.Root>

	<Table.Root>
		<Table.Header class="bg-muted">
			<Table.Row>
				<Table.Head>{t('kit.ir.filter.name')}</Table.Head>
				<Table.Head>{t('kit.demo.col_amount')}</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			<Table.Row>
				<Table.Cell colspan={2} class="text-muted-foreground h-24 text-center">
					{t('kit.msg.no_data_found')}
				</Table.Cell>
			</Table.Row>
		</Table.Body>
	</Table.Root>
</div>
