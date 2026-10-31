<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Dialog, DialogContent } from '$lib/components/ui/dialog';
	import Shuttle from '$lib/kit/molecules/Shuttle.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import type { ReportMeta } from './types';

	let {
		open = $bindable(false),
		meta,
		columns,
		onapply
	}: {
		open?: boolean;
		meta: ReportMeta;
		columns: string[];
		onapply: (columns: string[]) => void;
	} = $props();

	let displayed = $state<string[]>([]);

	// Every resource field, in definition order, so the shuttle shows all of them.
	const available = $derived(meta.fields.map((field) => ({ value: field.name, label: field.label })));

	$effect(() => {
		if (open) displayed = [...columns];
	});

	const canApply = $derived(displayed.length > 0);
</script>

<Dialog bind:open>
	<DialogContent title={t('kit.ir.columns.title')}>
		{#snippet footer()}
			<Button variant="outline" onclick={() => (open = false)}>{t('kit.common.cancel')}</Button>
			<Button
				disabled={!canApply}
				onclick={() => {
					onapply(displayed);
					open = false;
				}}>{t('kit.common.apply')}</Button
			>
		{/snippet}

		<Shuttle {available} bind:value={displayed} />
		{#if !canApply}
			<p class="text-destructive mt-2 text-xs">{t('kit.ir.columns.min')}</p>
		{/if}
	</DialogContent>
</Dialog>
