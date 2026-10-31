<script lang="ts">
	import { ApiError } from '$lib/api/client';
	import { cancelJob, getJob, jobFileUrl, type Job } from '$lib/api/jobs';
	import { Button } from '$lib/components/ui/button';
	import { t } from '$lib/i18n/index.svelte';
	import { notify } from '$lib/stores/notify.svelte';
	import { sessionStore } from '$lib/stores/session.svelte';

	let { jobId, onupdate }: { jobId: string; onupdate?: (job: Job) => void } = $props();

	let job = $state<Job | null>(null);
	let timer: ReturnType<typeof setInterval> | null = null;
	let notified = false;

	function context() {
		return {
			companyId: sessionStore.context.company_id ?? '',
			locationId: sessionStore.context.location_id ?? null,
			contextVersion: sessionStore.context.context_version
		};
	}

	function stop() {
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
	}

	async function refresh() {
		try {
			job = (await getJob(context(), jobId)).data;
			onupdate?.(job);
			if (job.state === 'queued' || job.state === 'running') return;
			stop();
			if (job.state === 'done' && !notified) {
				notified = true;
				notify.success(t('kit.jobs.done'));
			}
		} catch {
			stop();
		}
	}

	// Poll once a second until the job settles. Closing the dialog unmounts
	// this component, so the cleanup stops polling while the job keeps running.
	$effect(() => {
		void refresh();
		timer = setInterval(refresh, 1000);
		return stop;
	});

	async function cancel() {
		try {
			job = (await cancelJob(context(), jobId, sessionStore.csrfToken)).data;
			stop();
		} catch (err) {
			if (err instanceof ApiError) notify.errors([{ text: err.message }]);
		}
	}

	function failureMessage(current: Job | null): string {
		const code = current?.error_code ?? '';
		return ['FORBIDDEN', 'EXPORT_TOO_LARGE', 'IMPORT_INVALID', 'INTERNAL'].includes(code)
			? t(`kit.jobs.error.${code}`)
			: t('kit.jobs.failed');
	}

	const jobState = $derived(job?.state ?? 'queued');
	const percent = $derived(job && job.total > 0 ? Math.min(100, Math.round((job.processed / job.total) * 100)) : 0);
	const label = $derived(
		job && job.total > 0
			? t('kit.jobs.progress', { processed: job.processed, total: job.total })
			: t('kit.jobs.preparing')
	);
	const resultUrl = $derived(job ? jobFileUrl(job.id) : '');
</script>
<div class="flex flex-col gap-3">
	{#if jobState === 'queued' || jobState === 'running'}
		<div
			class="bg-muted h-2 w-full overflow-hidden rounded-full"
			role="progressbar"
			aria-valuemin="0"
			aria-valuemax={job && job.total > 0 ? job.total : 1}
			aria-valuenow={job?.processed ?? 0}
			aria-label={label}
		>
			<div class="bg-primary h-full transition-all" style={`width: ${percent}%`}></div>
		</div>
		<p class="text-muted-foreground text-sm" role="status">{label}</p>
		<div>
			<Button variant="outline" onclick={cancel}>{t('kit.jobs.cancel')}</Button>
		</div>
	{:else if jobState === 'done'}
		<p class="text-sm">{t('kit.jobs.done')}</p>
		<a class="text-primary text-sm underline" href={resultUrl} download>{t('kit.jobs.download')}</a>
	{:else if jobState === 'cancelled'}
		<p class="text-muted-foreground text-sm">{t('kit.jobs.cancelled')}</p>
	{:else if jobState === 'draft'}
		<p class="text-muted-foreground text-sm">{t('kit.jobs.ready')}</p>
	{:else}
		<p class="text-destructive text-sm" role="alert">{failureMessage(job)}</p>
	{/if}
</div>