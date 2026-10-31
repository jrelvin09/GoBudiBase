<script lang="ts">
	import TextItem from '$lib/kit/molecules/TextItem.svelte';
	import { t } from '$lib/i18n/index.svelte';

	let website = $state<string | null>(null);
	let amount = $state<string | null>(null);
	let floating = $state<string | null>(null);
	let large = $state<string | null>(null);
	let disabled = $state<string | null>('ABC-123');
</script>

<div class="grid max-w-xl gap-4">
	<TextItem
		id="ig-website"
		label={t('kit.demo.website')}
		preText="https://"
		postText=".example.com"
		bind:value={website}
		placeholder={t('kit.ir.filter.name')}
	/>
	<TextItem
		id="ig-amount"
		label={t('kit.demo.amount')}
		preText={t('kit.demo.currency_prefix')}
		bind:value={amount}
		placeholder="0"
	/>
	<TextItem
		id="ig-floating"
		label={t('kit.demo.floating_name')}
		labelPosition="floating"
		inlineHelp={t('kit.demo.input_help')}
		bind:value={floating}
	/>
	<TextItem id="ig-large" label={t('kit.demo.large')} size="lg" bind:value={large} />
	<TextItem id="ig-disabled" label={t('kit.ir.break.disabled')} disabled bind:value={disabled} />
</div>
