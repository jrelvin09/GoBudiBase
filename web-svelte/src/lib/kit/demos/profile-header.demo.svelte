<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { formatNumber } from '$lib/i18n/format';
	import { t } from '$lib/i18n/index.svelte';
	import MessageIcon from '@lucide/svelte/icons/message-square';

	let tab = $state<'about' | 'activity'>('about');
</script>

<div class="max-w-2xl overflow-hidden rounded-lg border">
	<div class="bg-palette-2-subtle h-24"></div>
	<div class="flex flex-wrap items-end justify-between gap-3 px-4">
		<div class="flex items-end gap-3">
			<span
				class="border-background bg-palette-1-subtle -mt-8 flex size-16 items-center justify-center rounded-full border-4 text-lg font-medium"
			>
				AP
			</span>
			<div class="flex flex-col gap-0.5 pb-1">
				<span class="flex items-center gap-2 font-medium">
					{t('kit.demo.person_1')}
					<Badge variant="success">{t('kit.demo.badge_active')}</Badge>
				</span>
				<span class="text-muted-foreground text-xs">{t('kit.demo.profile_role')}</span>
			</div>
		</div>
		<Button size="sm" variant="outline" class="mb-1">
			<MessageIcon />
			{t('kit.demo.profile_message')}
		</Button>
	</div>

	<dl class="grid grid-cols-3 gap-2 px-4 py-4 text-center">
		<div>
			<dt class="text-muted-foreground text-xs">{t('kit.demo.kpi_orders')}</dt>
			<dd class="text-lg font-semibold">{formatNumber(128)}</dd>
		</div>
		<div>
			<dt class="text-muted-foreground text-xs">{t('kit.demo.kpi_customers')}</dt>
			<dd class="text-lg font-semibold">{formatNumber(42)}</dd>
		</div>
		<div>
			<dt class="text-muted-foreground text-xs">{t('kit.demo.kpi_growth')}</dt>
			<dd class="text-lg font-semibold">+{formatNumber(8.2, { decimals: 1 })}%</dd>
		</div>
	</dl>

	<div class="border-border border-t px-4">
		<div class="flex gap-1 py-2" role="tablist" aria-label={t('kit.demo.person_1')}>
			<button
				type="button"
				role="tab"
				aria-selected={tab === 'about'}
				class="rounded-md px-2 py-1 text-sm {tab === 'about' ? 'bg-muted font-medium' : 'text-muted-foreground'}"
				onclick={() => (tab = 'about')}
			>
				{t('kit.history.tab_details')}
			</button>
			<button
				type="button"
				role="tab"
				aria-selected={tab === 'activity'}
				class="rounded-md px-2 py-1 text-sm {tab === 'activity' ? 'bg-muted font-medium' : 'text-muted-foreground'}"
				onclick={() => (tab = 'activity')}
			>
				{t('kit.history.tab_history')}
			</button>
		</div>
		<p class="text-muted-foreground pb-4 text-sm">
			{tab === 'about' ? t('kit.demo.card_body') : t('kit.demo.list_desc')}
		</p>
	</div>
</div>
