<script lang="ts">
	import { t } from '$lib/i18n/index.svelte';

	let radius = $state(25);
	let step = $state(60);
	let disabled = $state(40);
</script>

<div class="grid max-w-xl gap-6">
	<label class="flex flex-col gap-1 text-sm">
		<span class="font-medium">{t('kit.demo.range_label')}</span>
		<input
			type="range"
			min="0"
			max="100"
			step="5"
			bind:value={radius}
			class="accent-primary"
			aria-describedby="range-radius-value"
		/>
		<span id="range-radius-value" class="text-muted-foreground text-xs" aria-live="polite">
			{t('kit.demo.range_value', { n: radius })}
		</span>
	</label>

	<label class="flex flex-col gap-1 text-sm">
		<span class="font-medium">{t('kit.demo.step_ten')}</span>
		<input type="range" min="0" max="100" step="10" bind:value={step} class="accent-primary" />
		<span class="text-muted-foreground text-xs">{step}</span>
	</label>

	<label class="flex flex-col gap-1 text-sm opacity-60">
		<span class="font-medium">{t('kit.ir.break.disabled')}</span>
		<input type="range" min="0" max="100" bind:value={disabled} disabled class="accent-primary" />
	</label>
</div>
