<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { t } from '$lib/i18n/index.svelte';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import XIcon from '@lucide/svelte/icons/x';

	let tab = $state<'detail' | 'activity'>('detail');
</script>

<div class="grid gap-4 md:grid-cols-2">
	<Card.Root>
		<Card.Header>
			<Card.Title>{t('kit.demo.card_title')}</Card.Title>
			<Card.Description>{t('kit.demo.card_desc')}</Card.Description>
			<Card.Action>
				<Button size="icon-sm" variant="ghost" aria-label={t('kit.common.reload')}>
					<RefreshCwIcon />
				</Button>
			</Card.Action>
		</Card.Header>
		<Card.Content>{t('kit.demo.card_body')}</Card.Content>
		<Card.Footer class="gap-2">
			<Button size="sm">{t('kit.common.save')}</Button>
			<Button size="sm" variant="outline">{t('kit.common.cancel')}</Button>
		</Card.Footer>
	</Card.Root>

	<Card.Root class="overflow-hidden sm:flex-row">
		<div class="bg-palette-4-subtle h-32 shrink-0 sm:h-auto sm:w-40"></div>
		<div class="flex flex-col gap-2 p-4">
			<Card.Title>{t('kit.demo.card_title')}</Card.Title>
			<Card.Description>{t('kit.demo.card_desc')}</Card.Description>
			<Button size="sm" variant="link" class="self-start px-0">{t('kit.demo.link_plain')}</Button>
		</div>
	</Card.Root>

	<Card.Root class="relative">
		<Card.Header>
			<Card.Title>
				<a href="/kit/card" class="underline-offset-4 after:absolute after:inset-0 hover:underline">
					{t('kit.demo.card_title')}
				</a>
			</Card.Title>
			<Card.Description>{t('kit.demo.card_desc')}</Card.Description>
		</Card.Header>
		<Card.Content>{t('kit.demo.card_body')}</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="border-border gap-2 border-b pb-3">
			<div class="flex gap-1" role="tablist" aria-label={t('kit.demo.card_title')}>
				<button
					type="button"
					role="tab"
					aria-selected={tab === 'detail'}
					class="rounded-md px-2 py-1 text-sm {tab === 'detail' ? 'bg-muted font-medium' : 'text-muted-foreground'}"
					onclick={() => (tab = 'detail')}
				>
					{t('kit.ir.filter.type_row')}
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={tab === 'activity'}
					class="rounded-md px-2 py-1 text-sm {tab === 'activity' ? 'bg-muted font-medium' : 'text-muted-foreground'}"
					onclick={() => (tab = 'activity')}
				>
					{t('kit.history.tab_history')}
				</button>
			</div>
			<Card.Action>
				<Button size="icon-sm" variant="ghost" aria-label={t('kit.common.close')}>
					<XIcon />
				</Button>
			</Card.Action>
		</Card.Header>
		<Card.Content class="text-muted-foreground text-sm">
			{tab === 'detail' ? t('kit.demo.card_body') : t('kit.demo.list_desc')}
		</Card.Content>
	</Card.Root>
</div>
