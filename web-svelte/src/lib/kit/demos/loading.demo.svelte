<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { t } from '$lib/i18n/index.svelte';

	let busy = $state(false);
</script>

<div class="flex max-w-xl flex-col gap-6">
	<section class="flex flex-col gap-2">
		<h2 class="text-muted-foreground text-sm font-medium">{t('kit.demo.skeleton')}</h2>
		<div class="border-border flex flex-col gap-3 rounded-lg border p-4">
			<div class="flex items-center gap-3">
				<Skeleton class="size-10 rounded-full" />
				<div class="flex flex-1 flex-col gap-2">
					<Skeleton class="h-3 w-1/3" />
					<Skeleton class="h-3 w-2/3" />
				</div>
			</div>
			<Skeleton class="h-3 w-full" />
			<Skeleton class="h-3 w-5/6" />
		</div>
	</section>

	<section class="flex flex-col gap-2">
		<h2 class="text-muted-foreground text-sm font-medium">{t('kit.demo.busy_region')}</h2>
		<div class="border-border rounded-lg border p-4" aria-busy={busy}>
			<p class="text-sm">{t('kit.demo.loading_title')}</p>
			<div class="mt-3 flex items-center gap-2">
				<span
					class="border-muted-foreground/30 border-t-primary size-5 animate-spin rounded-full border-2"
					role="status"
					aria-label={t('kit.common.loading')}
				></span>
				<span class="text-muted-foreground text-sm">{t('kit.common.loading')}</span>
			</div>
		</div>
	</section>

	<section class="flex flex-wrap items-center gap-2">
		<Button disabled={busy} onclick={() => (busy = !busy)}>
			{#if busy}
				<span
					class="border-primary-foreground/40 border-t-primary-foreground size-4 animate-spin rounded-full border-2"
					aria-hidden="true"
				></span>
				{t('kit.demo.loading_button')}
			{:else}
				{t('kit.common.save')}
			{/if}
		</Button>
		<Button variant="outline" disabled>{t('kit.common.loading')}</Button>
	</section>

	{#if busy}
		<p class="text-muted-foreground text-xs" role="status">{t('kit.demo.loading_title')}…</p>
	{/if}
</div>
