<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import Sparkline from '$lib/kit/organisms/chart/Sparkline.svelte';
	import { formatNumber } from '$lib/i18n/format';
	import { t } from '$lib/i18n/index.svelte';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import UsersIcon from '@lucide/svelte/icons/users';
	import WalletIcon from '@lucide/svelte/icons/wallet';
	import ShoppingCartIcon from '@lucide/svelte/icons/shopping-cart';
	import PercentIcon from '@lucide/svelte/icons/percent';

	const trend = [12, 18, 15, 22, 26, 24, 31];
	const trendDown = [30, 28, 29, 24, 25, 21, 19];
</script>

<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
	<div class="border-border flex items-center justify-between gap-3 rounded-lg border p-4">
		<div class="flex flex-col gap-1">
			<span class="text-muted-foreground flex items-center gap-1.5 text-xs">
				<WalletIcon class="size-3.5" aria-hidden="true" />
				{t('kit.demo.kpi_revenue')}
			</span>
			<span class="text-xl font-semibold">{formatNumber(1284000)}</span>
			<span class="text-muted-foreground text-xs">
				<Badge variant="success" class="mr-1">+{formatNumber(8.2, { decimals: 1 })}%</Badge>{t('kit.demo.vs_last_month')}
			</span>
		</div>
		<Sparkline values={trend} label="{t('kit.demo.kpi_revenue')} — {t('kit.demo.trend')}" tone={3} />
	</div>

	<div class="border-border flex items-center justify-between gap-3 rounded-lg border p-4">
		<div class="flex flex-col gap-1">
			<span class="text-muted-foreground flex items-center gap-1.5 text-xs">
				<ShoppingCartIcon class="size-3.5" aria-hidden="true" />
				{t('kit.demo.kpi_orders')}
			</span>
			<span class="text-xl font-semibold">{formatNumber(1284)}</span>
			<span class="text-muted-foreground flex items-center gap-1 text-xs">
				<TrendingUpIcon class="size-3.5" aria-hidden="true" />
				{t('kit.demo.vs_last_month')}
			</span>
		</div>
		<Sparkline values={trend} label="{t('kit.demo.kpi_orders')} — {t('kit.demo.trend')}" tone={1} />
	</div>

	<div class="border-border flex items-center justify-between gap-3 rounded-lg border p-4">
		<div class="flex flex-col gap-1">
			<span class="text-muted-foreground flex items-center gap-1.5 text-xs">
				<UsersIcon class="size-3.5" aria-hidden="true" />
				{t('kit.demo.kpi_customers')}
			</span>
			<span class="text-xl font-semibold">{formatNumber(3902)}</span>
			<span class="text-muted-foreground text-xs">{t('kit.demo.vs_last_month')}</span>
		</div>
		<Sparkline values={trendDown} label="{t('kit.demo.kpi_customers')} — {t('kit.demo.trend')}" tone={5} />
	</div>

	<div class="border-border flex flex-col gap-2 rounded-lg border p-4">
		<span class="text-muted-foreground flex items-center gap-1.5 text-xs">
			<PercentIcon class="size-3.5" aria-hidden="true" />
			{t('kit.demo.kpi_growth')}
		</span>
		<span class="text-xl font-semibold">64%</span>
		<div
			class="bg-muted h-1.5 w-full overflow-hidden rounded-full"
			role="progressbar"
			aria-valuenow="64"
			aria-valuemin="0"
			aria-valuemax="100"
			aria-label={t('kit.demo.kpi_growth')}
		>
			<div class="bg-primary h-full rounded-full" style="width: 64%"></div>
		</div>
		<span class="text-muted-foreground text-xs">{t('kit.demo.vs_last_month')}</span>
	</div>
</div>
