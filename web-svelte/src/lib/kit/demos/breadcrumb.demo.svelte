<script lang="ts">
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import HouseIcon from '@lucide/svelte/icons/house';
	import { t } from '$lib/i18n/index.svelte';

	const trail = [
		{ key: 'kit.demo.crumb_reports', href: '/kit' },
		{ key: 'kit.demo.crumb_sales', href: '/kit/breadcrumb' }
	];
</script>

<div class="flex flex-col gap-6">
	<nav aria-label={t('kit.demo.breadcrumb_label')}>
		<ol class="text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm">
			{#each trail as crumb (crumb.key)}
				<li class="flex items-center gap-1.5">
					<a class="hover:text-foreground underline-offset-4 hover:underline" href={crumb.href}>
						{t(crumb.key)}
					</a>
					<ChevronRightIcon class="size-3.5" aria-hidden="true" />
				</li>
			{/each}
			<li aria-current="page" class="text-foreground font-medium">
				{t('kit.demo.crumb_customers')}
			</li>
		</ol>
	</nav>

	<nav aria-label={t('kit.demo.breadcrumb_label')}>
		<ol class="text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm">
			<li>
				<a class="hover:text-foreground flex items-center gap-1.5 underline-offset-4 hover:underline" href="/kit">
					<HouseIcon class="size-4" aria-hidden="true" />
					{t('kit.demo.crumb_home')}
				</a>
			</li>
			<li aria-hidden="true"><ChevronRightIcon class="size-3.5" /></li>
			<li aria-current="page" class="text-foreground font-medium">
				{t('kit.demo.crumb_reports')}
			</li>
		</ol>
	</nav>

	<nav aria-label={t('kit.demo.breadcrumb_label')} class="max-w-xs">
		<ol class="text-muted-foreground flex items-center gap-1.5 text-sm">
			<li class="min-w-0 shrink">
				<a class="hover:text-foreground block truncate underline-offset-4 hover:underline" href="/kit">
					{t('kit.demo.crumb_long')}
				</a>
			</li>
			<li aria-hidden="true"><ChevronRightIcon class="size-3.5 shrink-0" /></li>
			<li aria-current="page" class="text-foreground shrink-0 font-medium">
				{t('kit.demo.crumb_customers')}
			</li>
		</ol>
	</nav>
</div>
