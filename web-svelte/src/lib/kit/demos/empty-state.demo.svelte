<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { t } from '$lib/i18n/index.svelte';
	import FolderOpenIcon from '@lucide/svelte/icons/folder-open';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
</script>

<div class="grid gap-6 md:grid-cols-2">
	<div class="border-border flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
		<FolderOpenIcon class="text-muted-foreground size-8" aria-hidden="true" />
		<p class="text-sm font-medium">{t('kit.demo.empty_title')}</p>
		<p class="text-muted-foreground text-sm">{t('kit.demo.empty_body')}</p>
		<Button size="sm" class="mt-2">{t('kit.common.create')}</Button>
	</div>

	<div class="border-destructive/40 flex flex-col items-center gap-2 rounded-lg border p-8 text-center">
		<TriangleAlertIcon class="text-destructive size-8" aria-hidden="true" />
		<p class="text-sm font-medium">{t('kit.demo.error_title')}</p>
		<p class="text-muted-foreground text-sm">{t('kit.demo.error_body')}</p>
		<p class="text-muted-foreground text-xs">{t('kit.demo.error_code', { code: 'HTTP 500' })}</p>
		<div class="mt-2 flex flex-wrap justify-center gap-2">
			<Button size="sm" variant="outline">
				<RefreshCwIcon />
				{t('kit.common.reload')}
			</Button>
			<Button size="sm" variant="ghost">{t('kit.demo.alert_action')}</Button>
		</div>
	</div>
</div>
