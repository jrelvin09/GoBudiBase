<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Dialog, DialogContent } from '$lib/components/ui/dialog';
	import { t } from '$lib/i18n/index.svelte';
	import type { ReportBreak, ReportMeta } from './types';

	const ROWS = 6;

	let {
		open = $bindable(false),
		meta,
		breaks,
		onapply
	}: {
		open?: boolean;
		meta: ReportMeta;
		breaks: ReportBreak[];
		onapply: (breaks: ReportBreak[]) => void;
	} = $props();

	const fields = $derived(meta.fields.filter((field) => field.type !== 'textarea'));

	// Native <select> binds strings; "enabled"/"disabled" is narrowed on apply.
	type Row = { column: string; status: string };
	let rows = $state<Row[]>([]);

	$effect(() => {
		if (!open) return;
		rows = Array.from({ length: ROWS }, (_, i) => {
			const existing = breaks[i];
			return existing
				? { column: existing.column, status: existing.enabled ? 'enabled' : 'disabled' }
				: { column: '', status: 'enabled' };
		});
	});

	function optionsFor(index: number) {
		const used = new Set(rows.filter((_, i) => i !== index).map((row) => row.column));
		return fields.filter((field) => !used.has(field.name));
	}

	function commit() {
		onapply(
			rows
				.filter((row) => row.column !== '')
				.map((row) => ({ column: row.column, enabled: row.status === 'enabled' }))
		);
		open = false;
	}
</script>

<Dialog bind:open>
	<DialogContent title={t('kit.ir.break.title')} class="max-w-xl">
		{#snippet footer()}
			<Button variant="outline" onclick={() => (open = false)}>{t('kit.common.cancel')}</Button>
			<Button onclick={commit}>{t('kit.common.apply')}</Button>
		{/snippet}

		<div class="grid grid-cols-[1fr_1fr] items-center gap-2 text-sm">
			<span class="text-muted-foreground font-medium">{t('kit.ir.filter.column')}</span>
			<span class="text-muted-foreground font-medium">{t('kit.ir.break.status')}</span>
			{#each rows as row, index (index)}
				<select
					class="border-input h-(--control-h) rounded-lg border bg-transparent px-2"
					bind:value={row.column}
					aria-label="{t('kit.ir.filter.column')} {index + 1}"
				>
					<option value="">{t('kit.ir.none')}</option>
					{#each optionsFor(index) as field (field.name)}
						<option value={field.name}>{field.label}</option>
					{/each}
				</select>
				<select
					class="border-input h-(--control-h) rounded-lg border bg-transparent px-2"
					bind:value={row.status}
					disabled={row.column === ''}
					aria-label="{t('kit.ir.break.status')} {index + 1}"
				>
					<option value="enabled">{t('kit.ir.break.enabled')}</option>
					<option value="disabled">{t('kit.ir.break.disabled')}</option>
				</select>
			{/each}
		</div>
	</DialogContent>
</Dialog>
