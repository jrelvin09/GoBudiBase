<script lang="ts">
	import Sparkline from '$lib/kit/organisms/chart/Sparkline.svelte';
	import { t } from '$lib/i18n/index.svelte';

	const up = [4, 6, 5, 8, 7, 11, 13];
	const down = [13, 12, 13, 10, 9, 10, 7];
	const flat = [8, 8, 8, 8, 8, 8, 8];
</script>

<div class="flex flex-col gap-6">
	<section class="flex flex-col gap-2">
		<h2 class="text-muted-foreground text-sm font-medium">{t('kit.demo.tones')}</h2>
		<div class="flex flex-wrap items-center gap-4">
			<Sparkline values={up} label="{t('kit.demo.trend')} 1" tone={1} />
			<Sparkline values={up} label="{t('kit.demo.trend')} 3" tone={3} />
			<Sparkline values={down} label="{t('kit.demo.trend')} 5" tone={5} />
			<Sparkline values={down} label="{t('kit.demo.trend')} 8" tone={8} />
		</div>
	</section>

	<section class="flex flex-col gap-2">
		<h2 class="text-muted-foreground text-sm font-medium">{t('kit.demo.sizes')}</h2>
		<div class="flex flex-wrap items-end gap-4">
			<Sparkline values={up} label="{t('kit.demo.trend')} sm" tone={1} width={64} height={20} />
			<Sparkline values={up} label="{t('kit.demo.trend')} md" tone={1} />
			<Sparkline values={up} label="{t('kit.demo.trend')} lg" tone={1} width={160} height={48} />
		</div>
	</section>

	<section class="flex flex-col gap-2">
		<h2 class="text-muted-foreground text-sm font-medium">{t('kit.demo.flat_series')}</h2>
		<Sparkline values={flat} label="{t('kit.demo.trend')} — {t('kit.demo.flat_series')}" tone={2} width={160} height={32} />
	</section>
</div>
