<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Dialog, DialogContent } from '$lib/components/ui/dialog';
	import CheckboxItem from '$lib/kit/molecules/CheckboxItem.svelte';
	import TextItem from '$lib/kit/molecules/TextItem.svelte';
	import TextareaItem from '$lib/kit/molecules/TextareaItem.svelte';
	import { t } from '$lib/i18n/index.svelte';

	export type SaveReportInput = {
		name: string;
		description: string;
		public: boolean;
		asDefault: boolean;
	};

	let {
		open = $bindable(false),
		canPublish = false,
		initialName = '',
		initialDescription = '',
		onsave
	}: {
		open?: boolean;
		canPublish?: boolean;
		initialName?: string;
		initialDescription?: string;
		/** Resolves with an error message to show, or null on success. */
		onsave: (input: SaveReportInput) => Promise<string | null>;
	} = $props();

	let name = $state('');
	let description = $state('');
	let isPublic = $state(false);
	let asDefault = $state(false);
	let busy = $state(false);
	let error = $state('');

	$effect(() => {
		if (!open) return;
		name = initialName;
		description = initialDescription;
		isPublic = false;
		asDefault = false;
		error = '';
	});

	async function submit() {
		if (name.trim() === '') return;
		busy = true;
		error = '';
		const message = await onsave({
			name: name.trim(),
			description: description.trim(),
			public: isPublic,
			asDefault
		});
		busy = false;
		if (message) error = message;
		else open = false;
	}
</script>

<Dialog bind:open>
	<DialogContent title={t('kit.ir.save.title')}>
		{#snippet footer()}
			<Button variant="outline" onclick={() => (open = false)}>{t('kit.common.cancel')}</Button>
			<Button disabled={busy || name.trim() === ''} onclick={submit}>{t('kit.common.save')}</Button>
		{/snippet}

		<div class="flex flex-col gap-3">
			<TextItem id="save-name" label={t('kit.ir.save.name')} bind:value={name} required />
			<TextareaItem id="save-description" label={t('kit.ir.save.description')} bind:value={description} />
			{#if canPublish}
				<CheckboxItem
					id="save-public"
					label={t('kit.ir.save.public')}
					checkLabel={t('kit.ir.save.public')}
					bind:checked={isPublic}
				/>
				<CheckboxItem
					id="save-default"
					label={t('kit.ir.save.as_default')}
					checkLabel={t('kit.ir.save.as_default')}
					bind:checked={asDefault}
				/>
			{/if}
			{#if error}
				<p class="text-destructive text-sm">{error}</p>
			{/if}
		</div>
	</DialogContent>
</Dialog>
