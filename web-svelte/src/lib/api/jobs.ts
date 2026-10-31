import { apiRequest, type AdminContext } from './client';
import { contextHeaders } from './resources';
import type { DataEnvelope } from './types';

export type JobState = 'draft' | 'queued' | 'running' | 'done' | 'failed' | 'cancelled';

/** One background job (F4-03/F4-05); mirrors the server's jobDTO. */
export interface Job {
	id: string;
	kind: string;
	resource_id: string;
	state: JobState;
	total: number;
	processed: number;
	failed_rows: number;
	error_code?: string;
	has_result: boolean;
	has_errors: boolean;
	created_at: string;
	finished_at?: string;
}

/** `GET /jobs?page=`: the caller's own jobs in the session company (F4-09). */
export function listJobs(ctx: AdminContext, page = 1, signal?: AbortSignal): Promise<DataEnvelope<Job[]>> {
	return apiRequest<DataEnvelope<Job[]>>(`/jobs?page=${page}`, { ...contextHeaders(ctx), signal });
}

/** `GET /jobs/{id}`: only the caller's own job in the session company. */
export function getJob(ctx: AdminContext, id: string, signal?: AbortSignal): Promise<DataEnvelope<Job>> {
	return apiRequest<DataEnvelope<Job>>(`/jobs/${id}`, { ...contextHeaders(ctx), signal });
}

/** `POST /jobs/{id}/cancel` (CSRF). */
export function cancelJob(ctx: AdminContext, id: string, csrfToken: string, signal?: AbortSignal): Promise<DataEnvelope<Job>> {
	return apiRequest<DataEnvelope<Job>>(`/jobs/${id}/cancel`, { method: 'POST', csrfToken, ...contextHeaders(ctx), signal });
}

/** `POST /jobs/{id}/start` (CSRF, F4-07): validates the mapping and queues a
 * draft import job, dry run or commit. */
export function startJob(
	ctx: AdminContext,
	id: string,
	mapping: Record<string, string>,
	dryRun: boolean,
	csrfToken: string,
	signal?: AbortSignal
): Promise<DataEnvelope<Job>> {
	return apiRequest<DataEnvelope<Job>>(`/jobs/${id}/start`, {
		method: 'POST',
		body: { mapping, dry_run: dryRun },
		csrfToken,
		...contextHeaders(ctx),
		signal
	});
}
/** URL of a job artifact (result or per-row errors). The download anchor also
 * carries the session cookies, so no extra header is needed. */
export function jobFileUrl(id: string, kind: 'result' | 'errors' = 'result'): string {
	return `/api/v1/jobs/${id}/${kind}`;
}