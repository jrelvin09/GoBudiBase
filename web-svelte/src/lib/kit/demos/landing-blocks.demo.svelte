<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { formatNumber } from '$lib/i18n/format';
	import { t } from '$lib/i18n/index.svelte';
	import CheckIcon from '@lucide/svelte/icons/check';
	import XIcon from '@lucide/svelte/icons/x';

	const plans = [
		{ key: 'kit.demo.plan_starter', price: 0, featured: false },
		{ key: 'kit.demo.plan_growth', price: 499000, featured: true },
		{ key: 'kit.demo.plan_scale', price: 1290000, featured: false }
	];
	const features = ['kit.demo.feature_1', 'kit.demo.feature_2', 'kit.demo.feature_3'];
</script>

<div class="flex flex-col gap-8">
	<section class="flex flex-col items-start gap-3">
		<h2 class="text-2xl font-semibold tracking-tight">{t('kit.demo.cta_title')}</h2>
		<p class="text-muted-foreground max-w-lg text-sm">{t('kit.demo.cta_body')}</p>
		<div class="flex flex-wrap gap-2">
			<Button>{t('kit.demo.cta_button')}</Button>
			<Button variant="outline">{t('kit.demo.link_plain')}</Button>
		</div>
	</section>

	<section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
		{#each plans as plan (plan.key)}
			<div class="border-border flex flex-col gap-3 rounded-lg border p-4 {plan.featured
				? 'border-primary'
				: ''}">
				<div class="flex items-center justify-between gap-2">
					<span class="text-sm font-medium">{t(plan.key)}</span>
					{#if plan.featured}
						<Badge>{t('kit.demo.badge_active')}</Badge>
					{/if}
				</div>
				<p>
					<span class="text-xl font-semibold">IDR {formatNumber(plan.price)}</span>
					<span class="text-muted-foreground text-xs">{t('kit.demo.price_month')}</span>
				</p>
				<ul class="flex flex-col gap-1.5 text-sm">
					{#each features as feature (feature)}
						<li class="flex items-center gap-2">
							<CheckIcon class="text-success size-4 shrink-0" aria-hidden="true" />
							{t(feature)}
						</li>
					{/each}
					<li class="text-muted-foreground flex items-center gap-2">
						<XIcon class="size-4 shrink-0" aria-hidden="true" />
						{t('kit.demo.feature_off')}
					</li>
				</ul>
				<Button variant={plan.featured ? 'default' : 'outline'} class="mt-auto">
					{t('kit.demo.cta_button')}
				</Button>
			</div>
		{/each}
	</section>

	<section class="grid gap-4 md:grid-cols-2">
		<blockquote class="border-border flex flex-col gap-3 rounded-lg border p-4">
			<p class="text-sm">{t('kit.demo.testimonial_quote')}</p>
			<footer class="flex items-center gap-2">
				<span class="bg-palette-3-subtle flex size-9 items-center justify-center rounded-full text-xs font-medium">
					SW
				</span>
				<span class="text-muted-foreground text-xs">{t('kit.demo.testimonial_author')}</span>
			</footer>
		</blockquote>

		<div class="bg-palette-2-subtle flex flex-col items-start justify-center gap-2 rounded-lg p-6">
			<p class="text-lg font-semibold">{t('kit.demo.cta_title')}</p>
			<p class="text-muted-foreground text-sm">{t('kit.demo.cta_body')}</p>
			<Button size="sm" class="mt-1">{t('kit.demo.cta_button')}</Button>
		</div>
	</section>
</div>
