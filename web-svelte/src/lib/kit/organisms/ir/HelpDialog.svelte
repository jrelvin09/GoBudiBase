<script lang="ts">
	import { Dialog, DialogContent } from '$lib/components/ui/dialog';
	import { t } from '$lib/i18n/index.svelte';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	// One paragraph per feature, in the order a user meets them (§1.2–§1.5).
	const SECTIONS = [
		'search',
		'actions',
		'header',
		'chips',
		'columns',
		'filter',
		'sort',
		'break',
		'highlight',
		'aggregate',
		'rows',
		'save',
		'download',
		'keyboard'
	];
</script>

<Dialog bind:open>
	<DialogContent title={t('kit.ir.help.title')} class="max-w-2xl">
		<div class="flex flex-col gap-3 text-sm">
			<p class="text-muted-foreground">{t('kit.ir.help.intro')}</p>
			{#each SECTIONS as section (section)}
				<div class="flex flex-col gap-0.5">
					<h3 class="font-medium">{t(`kit.ir.help.${section}.title`)}</h3>
					<p class="text-muted-foreground">{t(`kit.ir.help.${section}.body`)}</p>
				</div>
			{/each}
		</div>
	</DialogContent>
</Dialog>
