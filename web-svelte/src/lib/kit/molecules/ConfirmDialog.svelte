<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { Button } from '$lib/components/ui/button';
	import { t } from '$lib/i18n/index.svelte';
	import { confirmState } from '$lib/kit/confirm.svelte';

	// Tombol Cancel datang lebih dulu di DOM, jadi dialog memberinya fokus awal.
</script>

<DialogPrimitive.Root
	open={confirmState.open}
	onOpenChange={(open) => {
		if (!open) confirmState.respond(false);
	}}
>
	<DialogPrimitive.Portal>
		<DialogPrimitive.Overlay class="bg-overlay fixed inset-0 z-50" />
		<DialogPrimitive.Content
			class="bg-card border-border fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border p-4 shadow-lg"
		>
			<DialogPrimitive.Title class="text-sm font-semibold">
				{confirmState.options?.title ?? t('kit.common.confirm')}
			</DialogPrimitive.Title>
			<DialogPrimitive.Description class="text-muted-foreground mt-2 text-sm">
				{confirmState.options?.message ?? ''}
			</DialogPrimitive.Description>
			<div class="mt-4 flex justify-end gap-2">
				<Button variant="outline" onclick={() => confirmState.respond(false)}>{t('kit.common.cancel')}</Button>
				<Button
					variant={confirmState.options?.danger ? 'destructive' : 'default'}
					onclick={() => confirmState.respond(true)}
				>
					{confirmState.options?.okLabel ?? t('kit.common.ok')}
				</Button>
			</div>
		</DialogPrimitive.Content>
	</DialogPrimitive.Portal>
</DialogPrimitive.Root>
