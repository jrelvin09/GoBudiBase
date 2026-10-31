<script lang="ts">
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import { t } from '$lib/i18n/index.svelte';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import InfoIcon from '@lucide/svelte/icons/info';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import XIcon from '@lucide/svelte/icons/x';

	let visible = $state(true);

	const tones = [
		{ key: 'success', icon: CircleCheckIcon, cls: 'text-success border-success/40' },
		{ key: 'info', icon: InfoIcon, cls: 'text-info border-info/40' },
		{ key: 'warning', icon: TriangleAlertIcon, cls: 'text-warning border-warning/40' }
	] as const;
</script>

<div class="flex max-w-xl flex-col gap-4">
	<Alert.Root>
		<InfoIcon />
		<Alert.Title>{t('kit.demo.alert_title')}</Alert.Title>
		<Alert.Description>{t('kit.demo.alert_body')}</Alert.Description>
	</Alert.Root>

	{#each tones as tone (tone.key)}
		<Alert.Root class={tone.cls}>
			<tone.icon />
			<Alert.Title>{t(tone.key === 'success' ? 'kit.msg.changes_saved' : 'kit.demo.alert_title')}</Alert.Title>
			<Alert.Description>{t('kit.demo.alert_body')}</Alert.Description>
			<Alert.Action>
				<Button size="sm" variant="outline">{t('kit.demo.alert_action')}</Button>
			</Alert.Action>
		</Alert.Root>
	{/each}

	{#if visible}
		<Alert.Root variant="destructive">
			<TriangleAlertIcon />
			<Alert.Title>{t('kit.demo.error_title')}</Alert.Title>
			<Alert.Description>{t('kit.demo.error_body')}</Alert.Description>
			<Alert.Action>
				<Button
					size="icon-sm"
					variant="ghost"
					aria-label={t('kit.common.close')}
					onclick={() => (visible = false)}
				>
					<XIcon />
				</Button>
			</Alert.Action>
		</Alert.Root>
	{/if}
</div>
