import { ApiError, apiRequest, apiRequestBlob, type AdminContext } from './client';
import type { ApiErrorEnvelope, DataEnvelope } from './types';
import type { ApprovalEntry, PendingApproval, ResourceMeta, ResourceRecord } from './resource-types';
import type {
	DistinctResponse,
	ReportCreateRequest,
	ReportGroupPage,
	ReportPage,
	ReportPivotPage,
	ReportSettings,
	ReportUpdateRequest,
	SavedReport
} from '$lib/kit/organisms/ir/types';
import type { HistoryEntry } from '$lib/kit/organisms/history/history';

/** Headers konteks (X-Company-ID/X-Location-ID/X-Context-Version) yang sama
 * dengan `/admin/*`; lihat catatan `AdminContext` di client.ts. */
export function contextHeaders(ctx: AdminContext) {
	return { companyId: ctx.companyId, locationId: ctx.locationId ?? undefined, contextVersion: ctx.contextVersion };
}

export interface MetaResourcesResponse {
	locale: string;
	resources: ResourceMeta[];
}

export function fetchResourceMeta(
	ctx: AdminContext,
	signal?: AbortSignal
): Promise<DataEnvelope<MetaResourcesResponse>> {
	return apiRequest<DataEnvelope<MetaResourcesResponse>>('/meta/resources', {
		...contextHeaders(ctx),
		signal
	});
}

export interface ListRecordsParams {
	page?: number;
	pageSize?: number;
	sort?: string;
	q?: string;
	filters?: Record<string, string | boolean>;
}

export function listRecords(
	ctx: AdminContext,
	resId: string,
	params: ListRecordsParams = {},
	signal?: AbortSignal
): Promise<DataEnvelope<ResourceRecord[]>> {
	const usp = new URLSearchParams();
	if (params.page !== undefined) usp.set('page', String(params.page));
	if (params.pageSize !== undefined) usp.set('page_size', String(params.pageSize));
	if (params.sort) usp.set('sort', params.sort);
	if (params.q) usp.set('q', params.q);
	for (const [field, value] of Object.entries(params.filters ?? {})) {
		usp.set(`filter[${field}]`, String(value));
	}
	const qs = usp.toString();
	return apiRequest<DataEnvelope<ResourceRecord[]>>(`/r/${resId}${qs ? `?${qs}` : ''}`, {
		...contextHeaders(ctx),
		signal
	});
}

export function getRecord(
	ctx: AdminContext,
	resId: string,
	id: string,
	signal?: AbortSignal
): Promise<DataEnvelope<ResourceRecord>> {
	return apiRequest<DataEnvelope<ResourceRecord>>(`/r/${resId}/${id}`, {
		...contextHeaders(ctx),
		signal
	});
}

export function createRecord(
	ctx: AdminContext,
	resId: string,
	values: Record<string, unknown>,
	csrfToken: string,
	signal?: AbortSignal
): Promise<DataEnvelope<ResourceRecord>> {
	return apiRequest<DataEnvelope<ResourceRecord>>(`/r/${resId}`, {
		method: 'POST',
		body: values,
		csrfToken,
		...contextHeaders(ctx),
		signal
	});
}

export function updateRecord(
	ctx: AdminContext,
	resId: string,
	id: string,
	expectedVersion: number,
	values: Record<string, unknown>,
	csrfToken: string,
	signal?: AbortSignal
): Promise<DataEnvelope<ResourceRecord>> {
	return apiRequest<DataEnvelope<ResourceRecord>>(`/r/${resId}/${id}`, {
		method: 'PATCH',
		body: { expected_version: expectedVersion, values },
		csrfToken,
		...contextHeaders(ctx),
		signal
	});
}

export function deleteRecord(
	ctx: AdminContext,
	resId: string,
	id: string,
	expectedVersion: number,
	csrfToken: string,
	signal?: AbortSignal
): Promise<void> {
	return apiRequest<void>(`/r/${resId}/${id}?expected_version=${expectedVersion}`, {
		method: 'DELETE',
		csrfToken,
		...contextHeaders(ctx),
		signal
	});
}

// ---- Interactive Report (K3 §2.2, F01) ------------------------------------

/** One operation of `_batch` (K5-07); mirrors the Interactive Grid model. */
export type BatchOpPayload =
	| { op: 'create'; tmp_id: string; values: Record<string, unknown> }
	| { op: 'update'; id: string; expected_version: number; values: Record<string, unknown> }
	| { op: 'delete'; id: string; expected_version: number };

export type BatchResult = {
	index: number;
	tmp_id?: string;
	record?: ResourceRecord;
};

/** Applies a whole page of grid changes at once (K5-01, all-or-nothing). */
export function batchRecords(
	ctx: AdminContext,
	resId: string,
	ops: BatchOpPayload[],
	csrfToken: string,
	signal?: AbortSignal
): Promise<DataEnvelope<{ results: BatchResult[] }>> {
	return apiRequest<DataEnvelope<{ results: BatchResult[] }>>(`/r/${resId}/_batch`, {
		method: 'POST',
		body: { ops },
		csrfToken,
		...contextHeaders(ctx),
		signal
	});
}

export function queryReport(
	ctx: AdminContext,
	resId: string,
	settings: ReportSettings,
	page: number,
	csrfToken: string,
	signal?: AbortSignal
): Promise<DataEnvelope<ReportPage>> {
	return apiRequest<DataEnvelope<ReportPage>>(`/r/${resId}/_query`, {
		method: 'POST',
		body: { settings, page },
		csrfToken,
		...contextHeaders(ctx),
		signal
	});
}

/** One Group By page (K4-02). */
export function groupByReport(
	ctx: AdminContext,
	resId: string,
	settings: ReportSettings,
	page: number,
	csrfToken: string,
	signal?: AbortSignal
): Promise<DataEnvelope<ReportGroupPage>> {
	return apiRequest<DataEnvelope<ReportGroupPage>>(`/r/${resId}/_groupby`, {
		method: 'POST',
		body: { settings, page },
		csrfToken,
		...contextHeaders(ctx),
		signal
	});
}

/** One Pivot page (K4-04). */
export function pivotReport(
	ctx: AdminContext,
	resId: string,
	settings: ReportSettings,
	page: number,
	csrfToken: string,
	signal?: AbortSignal
): Promise<DataEnvelope<ReportPivotPage>> {
	return apiRequest<DataEnvelope<ReportPivotPage>>(`/r/${resId}/_pivot`, {
		method: 'POST',
		body: { settings, page },
		csrfToken,
		...contextHeaders(ctx),
		signal
	});
}

export function distinctValues(
	ctx: AdminContext,
	resId: string,
	settings: ReportSettings,
	column: string,
	search: string,
	csrfToken: string,
	signal?: AbortSignal
): Promise<DataEnvelope<DistinctResponse>> {
	return apiRequest<DataEnvelope<DistinctResponse>>(`/r/${resId}/_distinct`, {
		method: 'POST',
		body: { settings, column, search },
		csrfToken,
		...contextHeaders(ctx),
		signal
	});
}

export type ExportStart =
	| { kind: 'file'; blob: Blob; filename: string | null }
	| { kind: 'job'; jobId: string };

/** Starts an export (F4-04/F4-05): a small CSV returns as a file, while an XLSX
 * or a large export returns 202 with the id of the queued job to poll. */
export async function exportReport(
	ctx: AdminContext,
	resId: string,
	settings: ReportSettings,
	format: string,
	separator: string,
	csrfToken: string,
	signal?: AbortSignal
): Promise<ExportStart> {
	const { blob, filename, status } = await apiRequestBlob(`/r/${resId}/_export`, {
		method: 'POST',
		body: { settings, format, separator },
		csrfToken,
		...contextHeaders(ctx),
		signal
	});
	if (status === 202) {
		const env = JSON.parse(await blob.text()) as DataEnvelope<{ job_id: string }>;
		return { kind: 'job', jobId: env.data.job_id };
	}
	return { kind: 'file', blob, filename };
}
/** The 201 answer of `_import` (F4-06): the draft job, the file's header row,
 * the first data rows, and the proposed header -> field mapping (null =
 * unmatched). */
export interface ImportUpload {
	job_id: string;
	columns: string[];
	preview: string[][];
	mapping: Record<string, string | null>;
}

/** `POST /r/{res}/_import` (F4-06): stores the CSV as a draft import job. */
export function uploadImport(
	ctx: AdminContext,
	resId: string,
	file: File,
	csrfToken: string,
	signal?: AbortSignal
): Promise<DataEnvelope<ImportUpload>> {
	const formData = new FormData();
	formData.append('file', file);
	return apiRequest<DataEnvelope<ImportUpload>>(`/r/${resId}/_import`, {
		method: 'POST',
		formData,
		csrfToken,
		...contextHeaders(ctx),
		signal
	});
}
export function listReports(
	ctx: AdminContext,
	resId: string,
	signal?: AbortSignal
): Promise<DataEnvelope<SavedReport[]>> {
	return apiRequest<DataEnvelope<SavedReport[]>>(`/r/${resId}/_reports`, {
		...contextHeaders(ctx),
		signal
	});
}

export function createReport(
	ctx: AdminContext,
	resId: string,
	body: ReportCreateRequest,
	csrfToken: string,
	signal?: AbortSignal
): Promise<DataEnvelope<SavedReport>> {
	return apiRequest<DataEnvelope<SavedReport>>(`/r/${resId}/_reports`, {
		method: 'POST',
		body,
		csrfToken,
		...contextHeaders(ctx),
		signal
	});
}

export function updateReport(
	ctx: AdminContext,
	resId: string,
	id: string,
	body: ReportUpdateRequest,
	csrfToken: string,
	signal?: AbortSignal
): Promise<DataEnvelope<SavedReport>> {
	return apiRequest<DataEnvelope<SavedReport>>(`/r/${resId}/_reports/${id}`, {
		method: 'PATCH',
		body,
		csrfToken,
		...contextHeaders(ctx),
		signal
	});
}

export function deleteReport(
	ctx: AdminContext,
	resId: string,
	id: string,
	expectedVersion: number,
	csrfToken: string,
	signal?: AbortSignal
): Promise<void> {
	return apiRequest<void>(`/r/${resId}/_reports/${id}?expected_version=${expectedVersion}`, {
		method: 'DELETE',
		csrfToken,
		...contextHeaders(ctx),
		signal
	});
}

// ---- Relations (F2-03, used by F2-06) --------------------------------------

export type LookupItem = { id: string; label: string };

export type LookupResponse = { items: LookupItem[]; total: number };

/** `GET /r/{res}/_lookup/{field}`: candidate records of a belongs_to target. */
export function lookup(
	ctx: AdminContext,
	resId: string,
	field: string,
	q: string,
	page: number,
	signal?: AbortSignal
): Promise<DataEnvelope<LookupResponse>> {
	const usp = new URLSearchParams();
	if (q) usp.set('q', q);
	usp.set('page', String(page));
	return apiRequest<DataEnvelope<LookupResponse>>(`/r/${resId}/_lookup/${field}?${usp}`, {
		...contextHeaders(ctx),
		signal
	});
}

/** `GET /r/{res}/_labels/{field}`: id → label for the ids that still exist. */
export function labels(
	ctx: AdminContext,
	resId: string,
	field: string,
	ids: string[],
	signal?: AbortSignal
): Promise<DataEnvelope<{ labels: Record<string, string> }>> {
	const usp = new URLSearchParams();
	usp.set('ids', ids.join(','));
	return apiRequest<DataEnvelope<{ labels: Record<string, string> }>>(`/r/${resId}/_labels/${field}?${usp}`, {
		...contextHeaders(ctx),
		signal
	});
}

// ---- History (F2-12, used by F2-13) ----------------------------------------

/** `GET /r/{res}/_history/{id}`: one page of a record's history (50 rows). */
export function getHistory(
	ctx: AdminContext,
	resId: string,
	id: string,
	page = 1,
	signal?: AbortSignal
): Promise<DataEnvelope<HistoryEntry[]>> {
	return apiRequest<DataEnvelope<HistoryEntry[]>>(`/r/${resId}/_history/${id}?page=${page}`, {
		...contextHeaders(ctx),
		signal
	});
}
/** `GET /r/{res}/_approvals/{id}`: one record's approval decisions across every
 * transition and cycle, oldest first, with each approver's display name (F7-04). */
export function getApprovals(
	ctx: AdminContext,
	resId: string,
	id: string,
	signal?: AbortSignal
): Promise<DataEnvelope<ApprovalEntry[]>> {
	return apiRequest<DataEnvelope<ApprovalEntry[]>>(`/r/${resId}/_approvals/${id}`, {
		...contextHeaders(ctx),
		signal
	});
}

/** `GET /approvals/pending`: records in the session company whose next approval
 * level the caller may decide (F7-02/F7-04). */
export function listPendingApprovals(
	ctx: AdminContext,
	signal?: AbortSignal
): Promise<DataEnvelope<PendingApproval[]>> {
	return apiRequest<DataEnvelope<PendingApproval[]>>('/approvals/pending', {
		...contextHeaders(ctx),
		signal
	});
}

/** `GET /r/{res}/_deleted`: deleted records, newest first (F2-12/F2-14). */
export function listDeleted(
	ctx: AdminContext,
	resId: string,
	page = 1,
	signal?: AbortSignal
): Promise<DataEnvelope<HistoryEntry[]>> {
	return apiRequest<DataEnvelope<HistoryEntry[]>>(`/r/${resId}/_deleted?page=${page}`, {
		...contextHeaders(ctx),
		signal
	});
}

/** `POST /r/{res}/_restore/{id}`: re-insert a deleted record (F2-12/F2-14). */
export function restoreRecord(
	ctx: AdminContext,
	resId: string,
	id: string,
	csrfToken: string,
	signal?: AbortSignal
): Promise<DataEnvelope<ResourceRecord>> {
	return apiRequest<DataEnvelope<ResourceRecord>>(`/r/${resId}/_restore/${id}`, {
		method: 'POST',
		csrfToken,
		...contextHeaders(ctx),
		signal
	});
}
// ---- Dashboards (F5-03) ----------------------------------------------------

export type DashboardSummary = { id: string; label: string };

export type DashboardWidgetMeta = {
	name: string;
	kind: 'stat' | 'chart' | 'table' | 'approvals';
	label: string;
	span: number;
	chart_type?: string;
	resource: string;
};

export type DashboardMeta = { id: string; label: string; widgets: DashboardWidgetMeta[] };

export type StatWidgetData = { value: number | null };

export type ChartWidgetData = { labels: string[]; series: { label: string; values: number[] }[] };

export type TableWidgetData = { rows: ResourceRecord[]; total: number };

/** Data widget `kind: "approvals"` (F7-04): the caller's pending approval list,
 * the same rows `GET /approvals/pending` returns. */
export type ApprovalsWidgetData = { rows: PendingApproval[]; total: number };

/** `GET /dashboards`: the dashboards the caller may view (F5-02). */
export function listDashboards(
	ctx: AdminContext,
	signal?: AbortSignal
): Promise<DataEnvelope<DashboardSummary[]>> {
	return apiRequest<DataEnvelope<DashboardSummary[]>>('/dashboards', { ...contextHeaders(ctx), signal });
}

/** `GET /dashboards/{id}`: one dashboard's widget metadata (F5-02). */
export function getDashboard(
	ctx: AdminContext,
	id: string,
	signal?: AbortSignal
): Promise<DataEnvelope<DashboardMeta>> {
	return apiRequest<DataEnvelope<DashboardMeta>>(`/dashboards/${encodeURIComponent(id)}`, {
		...contextHeaders(ctx),
		signal
	});
}

/** `GET /dashboards/{id}/widgets/{name}`: one widget's data (F5-02). */
export function getDashboardWidget<T>(
	ctx: AdminContext,
	id: string,
	name: string,
	signal?: AbortSignal
): Promise<DataEnvelope<T>> {
	return apiRequest<DataEnvelope<T>>(
		`/dashboards/${encodeURIComponent(id)}/widgets/${encodeURIComponent(name)}`,
		{ ...contextHeaders(ctx), signal }
	);
}

// ---- Global search (F5-06) -------------------------------------------------

export type SearchItem = { id: string; title: string };

export type SearchGroup = { resource: string; label: string; items: SearchItem[]; more: boolean };

/** `GET /search?q=`: grouped results the caller may view (F5-05). */
export function searchGlobal(
	ctx: AdminContext,
	q: string,
	signal?: AbortSignal
): Promise<DataEnvelope<{ groups: SearchGroup[] }>> {
	return apiRequest<DataEnvelope<{ groups: SearchGroup[] }>>(`/search?q=${encodeURIComponent(q)}`, {
		...contextHeaders(ctx),
		signal
	});
}
// ---- File/image fields (F6-03) --------------------------------------------

export type UploadedFile = { id: string; name: string; size: number; content_type: string };

/** Download URL of one file/image field; the browser sends the session cookies. */
export function fileDownloadUrl(resId: string, recordId: string, field: string): string {
	return `/api/v1/r/${resId}/${recordId}/_files/${field}`;
}

/** `GET ..._files/{field}?meta=1`: name/size/type of the attached file (F6-03). */
export function fileMeta(
	ctx: AdminContext,
	resId: string,
	recordId: string,
	field: string,
	signal?: AbortSignal
): Promise<DataEnvelope<UploadedFile>> {
	return apiRequest<DataEnvelope<UploadedFile>>(`/r/${resId}/${recordId}/_files/${field}?meta=1`, {
		...contextHeaders(ctx),
		signal
	});
}
/** `POST /r/{res}/_upload/{field}` (F6-03): XMLHttpRequest because only it can
 * report upload progress. */
export function uploadFile(
	ctx: AdminContext,
	resId: string,
	field: string,
	file: File,
	onProgress: (percent: number) => void,
	csrfToken: string,
	signal?: AbortSignal
): Promise<DataEnvelope<UploadedFile>> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open('POST', `/api/v1/r/${resId}/_upload/${field}`);
		xhr.withCredentials = true;
		xhr.setRequestHeader('X-CSRF-Token', csrfToken);
		xhr.setRequestHeader('X-Company-ID', ctx.companyId);
		if (ctx.locationId) xhr.setRequestHeader('X-Location-ID', ctx.locationId);
		xhr.setRequestHeader('X-Context-Version', String(ctx.contextVersion));
		xhr.upload.onprogress = (event) => {
			if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
		};
		xhr.onerror = () => reject(new Error('upload failed'));
		xhr.onabort = () => reject(new DOMException('aborted', 'AbortError'));
		xhr.onload = () => {
			let payload: unknown = null;
			try {
				payload = JSON.parse(xhr.responseText);
			} catch {
				// no or invalid body, handled below
			}
			if (xhr.status >= 200 && xhr.status < 300) {
				resolve(payload as DataEnvelope<UploadedFile>);
			} else if (payload && typeof payload === 'object' && 'error' in payload) {
				reject(new ApiError(payload as ApiErrorEnvelope));
			} else {
				reject(
					new ApiError({
						error: {
							status: xhr.status,
							code: 'UNKNOWN_ERROR',
							message: xhr.statusText || 'Upload failed',
							field_errors: [],
							retryable: false
						},
						meta: { request_id: '', timestamp: new Date().toISOString() }
					})
				);
			}
		};
		signal?.addEventListener('abort', () => xhr.abort());
		const form = new FormData();
		form.append('file', file);
		xhr.send(form);
	});
}
/** Draft PageDefinition untuk preview di company workspace (M8-05); butuh izin core.page_draft.preview. */
export function getPageDraftPreview(
	ctx: AdminContext,
	pageId: string,
	signal?: AbortSignal
): Promise<DataEnvelope<import('./types').PageDraftDTO>> {
	return apiRequest<DataEnvelope<import('./types').PageDraftDTO>>(`/page-draft-previews/${encodeURIComponent(pageId)}`, {
		...contextHeaders(ctx),
		signal
	});
}

/** Definisi halaman terbit aktif untuk runtime (B013/B014). */
export function getPublishedPage(
	ctx: AdminContext,
	pageId: string,
	signal?: AbortSignal
): Promise<DataEnvelope<import('./types').PublishedPageDTO>> {
	return apiRequest<DataEnvelope<import('./types').PublishedPageDTO>>(`/page-definitions/${encodeURIComponent(pageId)}`, {
		...contextHeaders(ctx),
		signal
	});
}

/** Menjalankan proses `onSubmit` sebuah form region terbit (F001); satu transaksi di server. */
export function runPageProcess(
	ctx: AdminContext,
	pageId: string,
	regionId: string,
	values: Record<string, unknown>,
	csrfToken: string
): Promise<DataEnvelope<ResourceRecord>> {
	return apiRequest<DataEnvelope<ResourceRecord>>(`/page-processes/${encodeURIComponent(pageId)}/${encodeURIComponent(regionId)}`, {
		method: 'POST',
		body: values,
		csrfToken,
		...contextHeaders(ctx)
	});
}

/** Komponen bersama yang sudah dievaluasi untuk pengguna ini (P7). */
export interface SharedRuntime {
	lov: Record<string, { value: string; label: string }[]>;
	datasource: Record<string, { resourceId: string; fields?: string[]; sort?: { field: string; dir: 'asc' | 'desc' }; pageSize?: number; filters?: { field: string; op: 'eq'; value: string }[] }>;
	auth: Record<string, boolean>;
	navigation: { name: string; entries: { label: string; resourceId: string }[] }[];
}

export function getSharedRuntime(ctx: AdminContext, signal?: AbortSignal): Promise<DataEnvelope<SharedRuntime>> {
	return apiRequest<DataEnvelope<SharedRuntime>>('/shared', { ...contextHeaders(ctx), signal });
}

/** Halaman yang punya definisi terbit aktif (tanpa definisinya): id, revisi, hash. */
export function getPublishedIndex(ctx: AdminContext, signal?: AbortSignal): Promise<DataEnvelope<{ page_id: string; revision: number; hash: string }[]>> {
	return apiRequest<DataEnvelope<{ page_id: string; revision: number; hash: string }[]>>('/page-definitions', { ...contextHeaders(ctx), signal });
}
