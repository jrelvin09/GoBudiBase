<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { confirm } from '$lib/kit/confirm.svelte';
	import { notify } from '$lib/stores/notify.svelte';
	import { t } from '$lib/i18n/index.svelte';

	// ConfirmDialog dipasang sekali di layout (app).
	async function askDelete() {
		const ok = await confirm({
			message: t('kit.msg.confirm_delete'),
			okLabel: t('kit.common.delete'),
			danger: true
		});
		notify.success(ok ? t('kit.common.ok') : t('kit.common.cancel'));
	}

	async function askPlain() {
		const ok = await confirm({ title: 'Reset form', message: 'Reset all fields?', okLabel: t('kit.common.go') });
		notify.success(ok ? t('kit.common.ok') : t('kit.common.cancel'));
	}
</script>

<div class="flex flex-wrap gap-2">
	<Button variant="destructive" onclick={askDelete}>Delete…</Button>
	<Button variant="outline" onclick={askPlain}>Confirm…</Button>
</div>
