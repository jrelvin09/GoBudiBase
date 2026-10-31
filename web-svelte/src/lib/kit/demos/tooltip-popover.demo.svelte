<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { t } from '$lib/i18n/index.svelte';
	import InfoIcon from '@lucide/svelte/icons/info';
</script>

<div class="flex max-w-xl flex-col gap-6">
	<section class="flex flex-col gap-2">
		<h2 class="text-muted-foreground text-sm font-medium">{t('kit.demo.native_tooltip')}</h2>
		<p class="text-sm">
			<span class="border-border cursor-help rounded-md border px-2 py-1" title={t('kit.demo.tip_content')}>
				{t('kit.demo.tip_hover')}
			</span>
		</p>
	</section>

	<section class="flex flex-col gap-2">
		<h2 class="text-muted-foreground text-sm font-medium">{t('kit.demo.popover')}</h2>
		<Popover>
			<PopoverTrigger>
				{#snippet child({ props })}
					<Button variant="outline" {...props}>
						<InfoIcon />
						{t('kit.demo.popover_title')}
					</Button>
				{/snippet}
			</PopoverTrigger>
			<PopoverContent class="flex flex-col gap-2">
				<p class="text-sm font-medium">{t('kit.demo.popover_title')}</p>
				<p class="text-muted-foreground text-sm">{t('kit.demo.popover_body')}</p>
				<Button size="sm" variant="outline">{t('kit.common.ok')}</Button>
			</PopoverContent>
		</Popover>
	</section>
</div>
