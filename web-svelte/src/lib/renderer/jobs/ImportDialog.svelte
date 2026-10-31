<script lang="ts">
	import { ApiError } from '$lib/api/client';
	import { startJob, type Job } from '$lib/api/jobs';
	import type { ResourceMeta } from '$lib/api/resource-types';
	import { uploadImport, type ImportUpload } from '$lib/api/resources';
	import { Button } from '$lib/components/ui/button';
	import { Dialog, DialogContent } from '$lib/components/ui/dialog';
	import { t } from '$lib/i18n/index.svelte';
	import SelectListItem from '$lib/kit/molecules/SelectListItem.svelte';
	import JobProgress from '$lib/renderer/jobs/JobProgress.svelte';
	import { notify } from '$lib/stores/notify.svelte';
	import { sessionStore } from '$lib/stores/session.svelte';

	/** Three-step CSV import (F4-08): upload, map the columns, then validate
	 * (dry run) and import. The server checks the import permission on upload
	 * and again when the job runs. */
	let {
		open = $bindable(false),
		meta,
		onimported
	}: { open?: boolean; meta: ResourceMeta; onimported: () => void } = $props();

	const steps = [1, 2, 3];
	let step = $state(1);
	let busy = $state(false);
	let error = $state('');
	let upload = $state<ImportUpload | null>(null);
	let mapping = $state<Record<string, string | null>>({});
	let jobId = $state<string | null>(null);
	let job = $state<Job | null>(null);
	let completed = $state(false);

	const fieldOptions = $derived(meta.fields.map((field) => ({ value: field.name, label: field.label })));
	const validCount = $derived(job ? Math.max(0, job.processed - job.failed_rows) : 0);
	const settled = $derived(job !== null && ['draft', 'done', 'failed', 'cancelled'].includes(job.state));
	function context() {
		return {
			companyId: sessionStore.context.company_id ?? '',
			locationId: sessionStore.context.location_id ?? null,
			contextVersion: sessionStore.context.context_version
		};
	}

	function message(err: unknown): string {
		return err instanceof ApiError ? err.message : t('kit.import.failed');
	}

	$effect(() => {
		if (!open) return;
		step = 1;
		busy = false;
		error = '';
		upload = null;
		mapping = {};
		jobId = null;
		job = null;
		completed = false;
	});

	async function choose(file: File | undefined) {
		if (!file) return;
		busy = true;
		error = '';
		try {
			const resp = await uploadImport(context(), meta.id, file, sessionStore.csrfToken);
			upload = resp.data;
			mapping = { ...resp.data.mapping };
			step = 2;
		} catch (err) {
			error = message(err);
		} finally {
			busy = false;
		}
	}

	function cleanMapping(): Record<string, string> {
		const out: Record<string, string> = {};
		for (const [header, field] of Object.entries(mapping)) {
			if (field) out[header] = field;
		}
		return out;
	}

	async function start(dryRun: boolean) {
		if (!upload) return;
		busy = true;
		error = '';
		try {
			job = (await startJob(context(), upload.job_id, cleanMapping(), dryRun, sessionStore.csrfToken)).data;
			jobId = job.id;
			step = 3;
		} catch (err) {
			error = message(err);
		} finally {
			busy = false;
		}
	}

	function onJobUpdate(next: Job) {
		job = next;
		if (next.state === 'done' && !completed) {
			completed = true;
			notify.success(t('kit.import.done', { count: next.processed - next.failed_rows }));
			onimported();
		}
	}

	const errorUrl = $derived(jobId ? `/api/v1/jobs/${jobId}/errors` : '');
</script>
<Dialog bind:open>
	<DialogContent title={t('kit.import.title')}>
		{#snippet footer()}
			{#if step === 2}
				<Button variant="outline" onclick={() => (step = 1)}>{t('kit.import.back')}</Button>
				<Button disabled={busy} onclick={() => start(true)}>{t('kit.import.validate')}</Button>
			{:else if step === 3 && job?.state === 'draft'}
				<Button variant="outline" onclick={() => (open = false)}>{t('kit.common.close')}</Button>
				<Button disabled={busy} onclick={() => start(false)}>{t('kit.import.commit', { count: validCount })}</Button>
			{:else if step === 1}
				<Button variant="outline" onclick={() => (open = false)}>{t('kit.common.cancel')}</Button>
			{:else}
				<Button variant="outline" onclick={() => (open = false)}>{t('kit.common.close')}</Button>
			{/if}
		{/snippet}

		<div class="flex flex-col gap-4">
			<ol class="text-muted-foreground flex gap-3 text-sm" aria-label={t('kit.import.steps')}>
				{#each steps as n (n)}
					<li aria-current={step === n ? 'step' : undefined} class={step === n ? 'text-foreground font-medium' : ''}>
						{n}. {t(`kit.import.step.${n}`)}
					</li>
				{/each}
			</ol>

			{#if step === 1}
				<div class="flex flex-col gap-2">
					<label class="text-sm font-medium" for="import-file">{t('kit.import.choose')}</label>
					<input
						id="import-file"
						type="file"
						accept=".csv,text/csv"
						disabled={busy}
						onchange={(event) => choose(event.currentTarget.files?.[0])}
						class="text-sm"
					/>
					<p class="text-muted-foreground text-sm">{t('kit.import.choose_hint')}</p>
				</div>			{:else if step === 2 && upload}
				<div class="flex flex-col gap-3">
					<p class="text-muted-foreground text-sm">{t('kit.import.mapping_hint')}</p>
					{#each upload.columns as column, index (index)}
						<SelectListItem
							id={`import-map-${index}`}
							label={column}
							options={fieldOptions}
							nullDisplay={t('kit.import.none')}
							bind:value={mapping[column]}
						/>
					{/each}
					<div class="overflow-x-auto">
						<p class="mb-1 text-sm font-medium">{t('kit.import.preview')}</p>
						<table class="border-border w-full border text-sm">
							<thead>
								<tr>
									{#each upload.columns as column, index (index)}
										<th class="border-border border px-2 py-1 text-left font-medium">{column}</th>
									{/each}
								</tr>
							</thead>
							<tbody>
								{#each upload.preview as row, rowIndex (rowIndex)}
									<tr>
										{#each row as cell, cellIndex (cellIndex)}
											<td class="border-border border px-2 py-1">{cell}</td>
										{/each}
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>			{:else if step === 3}
				{#if settled}
					<div class="flex flex-col gap-2">
						<p class="text-sm" role="status">
							{job?.state === 'done'
								? t('kit.import.done', { count: validCount })
								: t('kit.import.summary', { valid: validCount, failed: job?.failed_rows ?? 0 })}
						</p>
						{#if job?.has_errors}
							<a class="text-primary text-sm underline" href={errorUrl} download>{t('kit.import.error_file')}</a>
						{/if}
					</div>
				{:else if jobId}
					<JobProgress {jobId} onupdate={onJobUpdate} />
				{/if}
			{/if}

			{#if error}
				<p class="text-destructive text-sm" role="alert">{error}</p>
			{/if}
		</div>
	</DialogContent>
</Dialog>