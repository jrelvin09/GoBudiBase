<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { t } from '$lib/i18n/index.svelte';
	import CheckIcon from '@lucide/svelte/icons/check';
	import CopyIcon from '@lucide/svelte/icons/copy';

	const sampleKey = 'INV-2026-000431';
	let copied = $state('');

	async function copy(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			copied = text;
			setTimeout(() => (copied = ''), 1500);
		} catch {
			copied = '';
		}
	}
</script>

<div class="flex max-w-xl flex-col gap-4">
	<div class="border-border flex items-center justify-between gap-3 rounded-lg border p-3">
		<code class="font-mono text-sm">{sampleKey}</code>
		<Button size="sm" variant="outline" onclick={() => copy(sampleKey)}>
			{#if copied === sampleKey}
				<CheckIcon />
				{t('kit.demo.copied')}
			{:else}
				<CopyIcon />
				{t('kit.demo.copy')}
			{/if}
		</Button>
	</div>

	<div class="border-border flex items-center justify-between gap-3 rounded-lg border p-3">
		<span class="text-sm">{t('kit.demo.copy_body')}</span>
		<Button
			size="icon-sm"
			variant="ghost"
			aria-label={t('kit.demo.copy')}
			onclick={() => copy(t('kit.demo.copy_body'))}
		>
			{#if copied === t('kit.demo.copy_body')}
				<CheckIcon />
			{:else}
				<CopyIcon />
			{/if}
		</Button>
	</div>

	<p class="text-muted-foreground h-4 text-xs" aria-live="polite">
		{copied ? t('kit.demo.copied') : ''}
	</p>
</div>
