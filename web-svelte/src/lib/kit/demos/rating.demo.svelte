<script lang="ts">
	import Rating from '$lib/kit/molecules/Rating.svelte';
	import { t } from '$lib/i18n/index.svelte';

	let score = $state(0);
	let review = $state(4);
</script>

<div class="flex flex-col gap-6">
	<section class="flex flex-col gap-2">
		<h2 class="text-muted-foreground text-sm font-medium">{t('kit.demo.interactive')}</h2>
		<Rating label={t('kit.demo.rating_label')} bind:value={score} />
		<p class="text-muted-foreground text-xs">{score}/5</p>
	</section>

	<section class="flex flex-col gap-2">
		<h2 class="text-muted-foreground text-sm font-medium">{t('kit.demo.read_only')}</h2>
		<Rating label={t('kit.demo.rating_label')} value={review} readOnly />
		<Rating label={t('kit.demo.rating_label')} value={2} readOnly size="sm" />
	</section>
</div>
