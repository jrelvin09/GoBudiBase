<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Dialog, DialogContent } from '$lib/components/ui/dialog';
	import SelectListItem from '$lib/kit/molecules/SelectListItem.svelte';
	import { getLocale, t } from '$lib/i18n/index.svelte';
	import type { Snippet } from 'svelte';

	/** Result of ondownload: null = a file was saved, a job id = the export runs
	 * in the background, an error message = show it (F4-05). */
	export type DownloadStart = { jobId: string } | { error: string } | null;

	let {
		open = $bindable(false),
		ondownload,
		progress
	}: {
		open?: boolean;
		ondownload: (format: string, separator: string) => Promise<DownloadStart>;
		/** In-dialog job progress, rendered with the started job's id. */
		progress?: Snippet<[string]>;
	} = $props();

	// `;` is the default in the id locale (Excel id), `,` in en (K3-F17).
	const defaultSeparator = getLocale() === 'id' ? ';' : ',';
	let separator = $state(defaultSeparator);
	let format = $state('csv');
	let busy = $state(false);
	let error = $state('');
	let jobId = $state<string | null>(null);

	$effect(() => {
		if (!open) return;
		format = 'csv';
		separator = defaultSeparator;
		error = '';
		jobId = null;
	});

	async function download() {
		busy = true;
		error = '';
		const result = await ondownload(format, separator);
		busy = false;
		if (result === null) {
			open = false;
		} else if ('jobId' in result) {
			jobId = result.jobId;
		} else {
			error = result.error;
		}
	}
</script>
<Dialog bind:open>
	<DialogContent title={t('kit.ir.download.title')}>
		{#snippet footer()}
			{#if jobId}
				<Button variant="outline" onclick={() => (open = false)}>{t('kit.common.close')}</Button>
			{:else}
				<Button variant="outline" onclick={() => (open = false)}>{t('kit.common.cancel')}</Button>
				<Button disabled={busy} onclick={download}>
					{format === 'pdf' ? t('kit.common.print') : t('kit.ir.download.title')}
				</Button>
			{/if}
		{/snippet}

		<div class="flex flex-col gap-3">
			{#if jobId && progress}
				{@render progress(jobId)}
			{:else}
				<SelectListItem
					id="dl-format"
					label={t('kit.ir.download.format')}
					options={[
						{ value: 'csv', label: t('kit.ir.download.csv') },
						{ value: 'xlsx', label: t('kit.ir.download.xlsx') },
						{ value: 'pdf', label: t('kit.ir.download.pdf') }
					]}
					bind:value={format}
					required
				/>
				{#if format === 'csv'}
					<SelectListItem
						id="dl-separator"
						label={t('kit.ir.download.separator')}
						options={[
							{ value: ';', label: ';' },
							{ value: ',', label: ',' }
						]}
						bind:value={separator}
						required
					/>
				{/if}
				{#if error}
					<p class="text-destructive text-sm">{error}</p>
				{/if}
			{/if}
		</div>
	</DialogContent>
</Dialog>