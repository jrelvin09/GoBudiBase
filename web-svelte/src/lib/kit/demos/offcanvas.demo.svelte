<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Sheet from '$lib/components/ui/sheet';
	import { t } from '$lib/i18n/index.svelte';

	let side = $state<'right' | 'left' | 'bottom'>('right');
	let open = $state(false);

	function show(next: 'right' | 'left' | 'bottom') {
		side = next;
		open = true;
	}
</script>

<div class="flex flex-wrap gap-2">
	<Button variant="outline" onclick={() => show('right')}>{t('kit.demo.open_panel')} ({t('kit.demo.right')})</Button>
	<Button variant="outline" onclick={() => show('left')}>{t('kit.demo.open_panel')} ({t('kit.demo.left')})</Button>
	<Button variant="outline" onclick={() => show('bottom')}>{t('kit.demo.open_panel')} ({t('kit.demo.bottom')})</Button>
</div>

<Sheet.Root bind:open>
	<Sheet.Content {side} class="w-full sm:max-w-sm">
		<Sheet.Header>
			<Sheet.Title>{t('kit.demo.panel_title')}</Sheet.Title>
			<Sheet.Description>{t('kit.demo.panel_body')}</Sheet.Description>
		</Sheet.Header>
		<div class="p-4 text-sm">
			<p class="text-muted-foreground">{t('kit.demo.card_body')}</p>
		</div>
	</Sheet.Content>
</Sheet.Root>
