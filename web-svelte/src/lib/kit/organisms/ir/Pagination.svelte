<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { t } from '$lib/i18n/index.svelte';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	let {
		page,
		pageSize,
		total,
		onpage
	}: {
		page: number;
		pageSize: number;
		total: number;
		onpage: (page: number) => void;
	} = $props();

	const from = $derived(total === 0 ? 0 : (page - 1) * pageSize + 1);
	const to = $derived(Math.min(page * pageSize, total));
	const hasNext = $derived(to < total);
</script>

{#if total > 0}
	<div class="text-muted-foreground flex items-center justify-end gap-2 text-sm">
		<span>{t('kit.ir.row_range', { from, to, total })}</span>
		<Button
			variant="ghost"
			size="icon-sm"
			aria-label={t('kit.ir.previous')}
			disabled={page <= 1}
			onclick={() => onpage(page - 1)}
		>
			<ChevronLeftIcon />
		</Button>
		<Button
			variant="ghost"
			size="icon-sm"
			aria-label={t('kit.ir.next')}
			disabled={!hasNext}
			onclick={() => onpage(page + 1)}
		>
			<ChevronRightIcon />
		</Button>
	</div>
{/if}
