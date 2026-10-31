<script lang="ts">
	import TextItem from '$lib/kit/molecules/TextItem.svelte';
	import NumberItem from '$lib/kit/molecules/NumberItem.svelte';
	import { t } from '$lib/i18n/index.svelte';

	let required = $state<string | null>(null);
	let invalid = $state<string | null>('99');
	let help = $state<string | null>(null);
	let maxed = $state<string | null>('123456789012345678');
	let bounded = $state<number | null>(120);
</script>

<div class="grid max-w-xl gap-4">
	<TextItem
		id="val-required"
		label={t('kit.demo.floating_name')}
		required
		error={required ? undefined : t('kit.item.required_value')}
		bind:value={required}
	/>
	<TextItem
		id="val-invalid"
		label={t('kit.demo.server_error')}
		error={t('kit.item.max_value', { max: 10 })}
		bind:value={invalid}
	/>
	<TextItem
		id="val-help"
		label={t('kit.demo.inline_help')}
		inlineHelp={t('kit.demo.input_help')}
		help={t('kit.demo.input_help')}
		bind:value={help}
	/>
	<TextItem
		id="val-counter"
		label={t('kit.demo.max_length')}
		maxLength={20}
		inlineHelp={t('kit.item.char_counter', { count: maxed?.length ?? 0, max: 20 })}
		bind:value={maxed}
	/>
	<NumberItem
		id="val-bounded"
		label={t('kit.demo.bounded_step', { min: 10, max: 100 })}
		min={10}
		max={100}
		required
		error={bounded !== null && (bounded < 10 || bounded > 100) ? t('kit.item.max_value', { max: 100 }) : undefined}
		bind:value={bounded}
	/>
</div>
