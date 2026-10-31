<script lang="ts">
	import { t } from '$lib/i18n/index.svelte';

	const bars: { value: number; tone: string; height: string }[] = [
		{ value: 25, tone: 'bg-primary', height: 'h-1.5' },
		{ value: 50, tone: 'bg-info', height: 'h-2' },
		{ value: 75, tone: 'bg-warning', height: 'h-3' },
		{ value: 100, tone: 'bg-success', height: 'h-4' }
	];

	const steps = 4;
	let current = $state(2);
</script>

<div class="flex max-w-xl flex-col gap-6">
	<section class="flex flex-col gap-3">
		<h2 class="text-muted-foreground text-sm font-medium">{t('kit.demo.progress_label')}</h2>
		{#each bars as bar (bar.value)}
			<div class="flex items-center gap-3">
				<div
					class="bg-muted w-full overflow-hidden rounded-full {bar.height}"
					role="progressbar"
					aria-valuenow={bar.value}
					aria-valuemin="0"
					aria-valuemax="100"
					aria-label={t('kit.demo.progress_label')}
				>
					<div class="{bar.tone} h-full rounded-full" style="width: {bar.value}%"></div>
				</div>
				<span class="text-muted-foreground w-10 text-right text-xs">
					{t('kit.demo.progress_percent', { n: bar.value })}
				</span>
			</div>
		{/each}
	</section>

	<section class="flex flex-col gap-2">
		<h2 class="text-muted-foreground text-sm font-medium">{t('kit.demo.multi_bar')}</h2>
		<div
			class="bg-muted flex h-3 w-full overflow-hidden rounded-full"
			role="progressbar"
			aria-valuenow="70"
			aria-valuemin="0"
			aria-valuemax="100"
			aria-label={t('kit.demo.progress_label')}
		>
			<div class="bg-primary h-full" style="width: 40%"></div>
			<div class="bg-warning h-full" style="width: 20%"></div>
			<div class="bg-success h-full" style="width: 10%"></div>
		</div>
	</section>

	<section class="flex flex-col gap-2">
		<h2 class="text-muted-foreground text-sm font-medium">{t('kit.demo.indeterminate')}</h2>
		<div class="bg-muted h-1.5 w-full overflow-hidden rounded-full">
			<div class="bg-primary h-full w-1/3 animate-pulse rounded-full"></div>
		</div>
	</section>

	<section class="flex flex-col gap-3">
		<h2 class="text-muted-foreground text-sm font-medium">{t('kit.demo.stepper')}</h2>
		<ol class="flex items-center gap-2">
			{#each Array.from({ length: steps }, (_, index) => index + 1) as step (step)}
				<li class="flex flex-1 items-center gap-2">
					<span
						class="flex size-7 shrink-0 items-center justify-center rounded-full border text-xs {step <=
						current
							? 'border-primary bg-primary text-primary-foreground'
							: 'border-border text-muted-foreground'}"
						aria-current={step === current ? 'step' : undefined}
					>
						{step}
					</span>
					<span class="text-xs {step <= current ? 'text-foreground' : 'text-muted-foreground'}">
						{t('kit.demo.progress_step', { n: step })}
					</span>
					{#if step < steps}
						<span class="bg-border h-px flex-1" aria-hidden="true"></span>
					{/if}
				</li>
			{/each}
		</ol>
	</section>
</div>
