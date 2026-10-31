<script lang="ts">
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { t } from '$lib/i18n/index.svelte';

	const faq = [
		{ q: 'kit.demo.faq_q1', a: 'kit.demo.faq_answer' },
		{ q: 'kit.demo.faq_q2', a: 'kit.demo.faq_answer' },
		{ q: 'kit.demo.faq_q3', a: 'kit.demo.faq_answer' }
	];
</script>

<div class="flex max-w-xl flex-col gap-6">
	<section class="flex flex-col gap-2">
		<h2 class="text-muted-foreground text-sm font-medium">{t('kit.demo.bordered')}</h2>
		<details class="group border-border rounded-lg border" open>
			<summary
				class="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-sm font-medium [&::-webkit-details-marker]:hidden"
			>
				{t('kit.demo.faq_q1')}
				<ChevronDownIcon class="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
			</summary>
			<div class="text-muted-foreground border-border border-t px-3 py-2 text-sm">
				{t('kit.demo.faq_answer')}
			</div>
		</details>
	</section>

	<section class="flex flex-col gap-2">
		<h2 class="text-muted-foreground text-sm font-medium">{t('kit.demo.flush')}</h2>
		<div class="divide-border divide-y">
			{#each faq as row (row.q)}
				<details class="group">
					<summary
						class="flex cursor-pointer list-none items-center justify-between gap-2 py-2 text-sm font-medium [&::-webkit-details-marker]:hidden"
					>
						{t(row.q)}
						<ChevronDownIcon class="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
					</summary>
					<p class="text-muted-foreground pb-2 text-sm">{t(row.a)}</p>
				</details>
			{/each}
		</div>
	</section>

	<section class="flex flex-col gap-2">
		<h2 class="text-muted-foreground text-sm font-medium">{t('kit.demo.faq_card')}</h2>
		<div class="border-border divide-border divide-y rounded-lg border bg-card">
			{#each faq as row (row.q)}
				<details class="group">
					<summary
						class="hover:bg-muted/50 flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-sm [&::-webkit-details-marker]:hidden"
					>
						{t(row.q)}
						<ChevronDownIcon class="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
					</summary>
					<p class="text-muted-foreground px-3 pb-3 text-sm">{t(row.a)}</p>
				</details>
			{/each}
		</div>
	</section>
</div>
