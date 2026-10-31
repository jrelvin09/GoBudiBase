<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { notify } from '$lib/stores/notify.svelte';
	import { t } from '$lib/i18n/index.svelte';

	// Notification dipasang sekali di layout (app); demo ini hanya memicu
	// pesannya — kotak error muncul di atas konten, toast di pojok kanan atas.
	function showFieldError() {
		notify.errors([{ text: 'Kode wajib diisi.', fieldId: 'notification-demo-field' }]);
	}
</script>

<div class="flex flex-col gap-4">
	<div class="flex flex-wrap gap-2">
		<Button onclick={() => notify.success(t('kit.common.save'))}>Success</Button>
		<Button
			variant="outline"
			onclick={() => notify.errors([{ text: 'Kode wajib diisi.' }, { text: 'Nama wajib diisi.' }])}
		>
			2 errors
		</Button>
		<Button variant="outline" onclick={showFieldError}>1 error with field link</Button>
		<Button variant="ghost" onclick={() => notify.clearErrors()}>{t('kit.common.reset')}</Button>
	</div>

	<label class="flex flex-col gap-1 text-sm">
		Focus target
		<input
			id="notification-demo-field"
			class="border-input h-(--control-h) w-64 rounded-lg border bg-transparent px-2.5 text-sm"
		/>
	</label>
</div>
