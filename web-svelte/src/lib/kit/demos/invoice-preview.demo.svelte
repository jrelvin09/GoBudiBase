<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { formatDate, formatNumber } from '$lib/i18n/format';
	import { t } from '$lib/i18n/index.svelte';
	import PrinterIcon from '@lucide/svelte/icons/printer';

	const lines = [
		{ id: 'l1', name: 'kit.demo.plan_growth', qty: 2, price: 499000 },
		{ id: 'l2', name: 'kit.demo.plan_scale', qty: 1, price: 1290000 },
		{ id: 'l3', name: 'kit.demo.feature_3', qty: 3, price: 150000 }
	];

	const subtotal = lines.reduce((sum, line) => sum + line.qty * line.price, 0);
	const tax = Math.round(subtotal * 0.11);
</script>

<div class="max-w-2xl">
	<article class="border-border bg-card flex flex-col gap-4 rounded-lg border p-6 text-sm">
		<header class="flex flex-wrap items-start justify-between gap-3">
			<div class="flex flex-col gap-0.5">
				<h2 class="text-lg font-semibold">{t('kit.demo.invoice_title')}</h2>
				<span class="text-muted-foreground text-xs">INV-2026-000431</span>
			</div>
			<div class="text-muted-foreground flex flex-col gap-0.5 text-right text-xs">
				<span>{t('kit.demo.invoice_no')}: INV-2026-000431</span>
				<span>{t('kit.demo.invoice_date')}: {formatDate('2026-09-30')}</span>
			</div>
		</header>

		<section class="rounded-md bg-muted/50 p-3">
			<p class="text-muted-foreground text-xs">{t('kit.demo.invoice_bill_to')}</p>
			<p class="font-medium">{t('kit.demo.person_1')}</p>
			<p class="text-muted-foreground text-xs">{t('kit.demo.invoice_address')}</p>
		</section>

		<table class="w-full text-left">
			<thead>
				<tr class="text-muted-foreground border-b">
					<th class="py-1.5 font-medium">{t('kit.demo.invoice_item')}</th>
					<th class="py-1.5 text-right font-medium">{t('kit.demo.invoice_qty')}</th>
					<th class="py-1.5 text-right font-medium">{t('kit.demo.invoice_price')}</th>
					<th class="py-1.5 text-right font-medium">{t('kit.demo.col_amount')}</th>
				</tr>
			</thead>
			<tbody>
				{#each lines as line (line.id)}
					<tr class="border-b last:border-0">
						<td class="py-2">{t(line.name)}</td>
						<td class="py-2 text-right tabular-nums">{line.qty}</td>
						<td class="py-2 text-right tabular-nums">{formatNumber(line.price)}</td>
						<td class="py-2 text-right tabular-nums">{formatNumber(line.qty * line.price)}</td>
					</tr>
				{/each}
			</tbody>
		</table>

		<dl class="ml-auto flex w-full max-w-56 flex-col gap-1">
			<div class="flex justify-between">
				<dt class="text-muted-foreground">{t('kit.demo.invoice_subtotal')}</dt>
				<dd class="tabular-nums">{formatNumber(subtotal)}</dd>
			</div>
			<div class="flex justify-between">
				<dt class="text-muted-foreground">{t('kit.demo.invoice_tax')}</dt>
				<dd class="tabular-nums">{formatNumber(tax)}</dd>
			</div>
			<div class="border-border flex justify-between border-t pt-1 font-semibold">
				<dt>{t('kit.demo.invoice_total')}</dt>
				<dd class="tabular-nums">{formatNumber(subtotal + tax)}</dd>
			</div>
		</dl>
	</article>

	<div class="mt-3 flex justify-end gap-2 print:hidden">
		<Button variant="outline" size="sm">{t('kit.common.edit')}</Button>
		<Button size="sm" onclick={() => window.print()}>
			<PrinterIcon />
			{t('kit.common.print')}
		</Button>
	</div>
</div>
