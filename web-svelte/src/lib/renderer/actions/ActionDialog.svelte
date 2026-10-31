<script lang="ts">
	import { ApiError } from '$lib/api/client';
	import type { ActionMeta } from '$lib/api/resource-types';
	import { Button } from '$lib/components/ui/button';
	import { Dialog, DialogContent } from '$lib/components/ui/dialog';
	import { t } from '$lib/i18n/index.svelte';
	import { getFieldInput } from '$lib/kit/fields/registry';
	import { serverErrorsToMap, type FormErrors } from '$lib/renderer/form-state';

	// Dialog aksi berform (F2-11): field dari field registry, label tombol =
	// label aksi, danger → tombol merah. Kesalahan server tampil di field.
	let {
		open = $bindable(false),
		action,
		onsubmit
	}: {
		open?: boolean;
		action: ActionMeta | null;
		/** Mengembalikan ApiError bila gagal (dialog tetap terbuka), atau null. */
		onsubmit: (values: Record<string, unknown>) => Promise<ApiError | null>;
	} = $props();

	let values = $state<Record<string, unknown>>({});
	let fieldErrors = $state<FormErrors>({});
	let message = $state('');
	let busy = $state(false);

	$effect(() => {
		if (!open || !action) return;
		const next: Record<string, unknown> = {};
		for (const field of action.form ?? []) next[field.name] = field.default ?? null;
		values = next;
		fieldErrors = {};
		message = '';
	});

	function setValue(name: string, value: unknown) {
		values = { ...values, [name]: value };
	}

	async function submit() {
		if (!action || busy) return;
		busy = true;
		message = '';
		fieldErrors = {};
		const err = await onsubmit(values);
		busy = false;
		if (!err) {
			open = false;
			return;
		}
		if (err.fieldErrors.length > 0) {
			fieldErrors = serverErrorsToMap(err.fieldErrors);
			return;
		}
		message = err.message;
	}
</script>

<Dialog bind:open>
	<DialogContent title={action?.label ?? ''}>
		{#snippet footer()}
			<Button variant="outline" onclick={() => (open = false)}>{t('kit.common.cancel')}</Button>
			<Button variant={action?.danger ? 'destructive' : 'default'} disabled={busy} onclick={submit}>
				{action?.label}
			</Button>
		{/snippet}

		<div class="flex flex-col gap-4">
			{#each action?.form ?? [] as field (field.name)}
				{@const Input = getFieldInput(field.type)}
				<Input
					{field}
					id={`A_${field.name}`}
					value={values[field.name]}
					error={fieldErrors[field.name]}
					onchange={(next) => setValue(field.name, next)}
				/>
			{/each}
			{#if message}
				<p class="text-destructive text-sm" role="alert">{message}</p>
			{/if}
		</div>
	</DialogContent>
</Dialog>