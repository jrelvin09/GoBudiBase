<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { t } from '$lib/i18n/index.svelte';

	let active = $state(1);
	const items = [1, 2, 3];

	function itemLabel(n: number): string {
		return t('kit.demo.list_item', { n });
	}
</script>

<div class="grid max-w-xl gap-6">
	<ul class="divide-border border-border divide-y overflow-hidden rounded-lg border text-sm">
		{#each items as n (n)}
			<li class="px-3 py-2">{itemLabel(n)}</li>
		{/each}
	</ul>

	<ul class="divide-border border-border divide-y overflow-hidden rounded-lg border text-sm">
		{#each items as n (n)}
			<li class="flex items-center justify-between gap-3 px-3 py-2">
				<span>{itemLabel(n)}</span>
				<Badge variant={n === 1 ? 'success' : 'secondary'}>
					{n === 1 ? t('kit.demo.badge_active') : t('kit.demo.badge_draft')}
				</Badge>
			</li>
		{/each}
	</ul>

	<ul class="divide-border border-border divide-y overflow-hidden rounded-lg border text-sm">
		{#each items as n (n)}
			<li>
				<button
					type="button"
					class="hover:bg-muted focus-visible:ring-ring/50 flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left focus-visible:ring-[3px] focus-visible:outline-none {active === n
						? 'bg-muted'
						: ''}"
					aria-pressed={active === n}
					onclick={() => (active = n)}
				>
					<span class="font-medium">{itemLabel(n)}</span>
					<span class="text-muted-foreground text-xs">{t('kit.demo.list_desc')}</span>
				</button>
			</li>
		{/each}
		<li>
			<button
				type="button"
				disabled
				class="text-muted-foreground w-full px-3 py-2 text-left opacity-50"
			>
				{t('kit.demo.list_item', { n: 4 })}
			</button>
		</li>
	</ul>
</div>
