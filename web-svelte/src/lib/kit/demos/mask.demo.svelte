<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import Item from '$lib/kit/molecules/Item.svelte';
	import { applyMask } from '$lib/kit/molecules/mask';
	import { t } from '$lib/i18n/index.svelte';

	const phonePattern = '9999-9999-9999';
	const datePattern = '99/99/9999';
	const groupedPattern = '999.999.999';

	let phone = $state('');
	let date = $state('');
	let grouped = $state('');

	function masked(raw: string, pattern: string): string {
		return applyMask(raw, pattern);
	}
</script>

<div class="grid max-w-xl gap-4">
	<Item id="mask-phone" label={t('kit.demo.mask_phone')} inlineHelp="0812-3456-7890">
		{#snippet children(ctx)}
			<Input
				id={ctx.id}
				value={phone}
				inputmode="numeric"
				maxlength={phonePattern.length}
				aria-describedby={ctx.describedBy}
				oninput={(event) => (phone = masked(event.currentTarget.value, phonePattern))}
			/>
		{/snippet}
	</Item>

	<Item id="mask-date" label={t('kit.demo.mask_date')} inlineHelp="31/12/2026">
		{#snippet children(ctx)}
			<Input
				id={ctx.id}
				value={date}
				inputmode="numeric"
				maxlength={datePattern.length}
				aria-describedby={ctx.describedBy}
				oninput={(event) => (date = masked(event.currentTarget.value, datePattern))}
			/>
		{/snippet}
	</Item>

	<Item id="mask-grouped" label={t('kit.demo.mask_grouped')} inlineHelp="999.999.999">
		{#snippet children(ctx)}
			<Input
				id={ctx.id}
				value={grouped}
				inputmode="numeric"
				maxlength={groupedPattern.length}
				aria-describedby={ctx.describedBy}
				oninput={(event) => (grouped = masked(event.currentTarget.value, groupedPattern))}
			/>
		{/snippet}
	</Item>
</div>
