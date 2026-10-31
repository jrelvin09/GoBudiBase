// ============================================================================
// LEGACY RPC COMPATIBILITY (GoBudiBase APEX Demo Suite)
// ============================================================================

export interface RegistryItem {
	id: number;
	code: string;
	name: string;
	category: string;
	location: string | null;
	status: string;
	value: number | null;
	acquired_at: string | null;
	last_updated: string;
}

export interface PivotResult {
	row_dimension: string;
	col_dimension: string;
	metric: string;
	columns: string[];
	rows: Array<{
		row_key: string;
		cells: Record<string, number>;
		row_total: number;
	}>;
	col_totals: Record<string, number>;
	grand_total: number;
}

export interface DynamicActionRule {
	id: number;
	rule_name: string;
	description: string;
	event_type: string;
	target_field: string;
	condition_operator: string;
	condition_value: string;
	client_actions: Array<{ action: string; field?: string; value?: unknown; css?: string; message?: string }>;
	server_action: string | null;
	is_active: boolean;
}

export interface CalendarEvent {
	id: string;
	title: string;
	start: string;
	end: string;
	backgroundColor: string;
	borderColor: string;
	type: string;
	details: {
		request_no: string;
		state: string;
		priority: string;
		requester: string;
	};
}

export interface MapBuilding {
	id: number;
	name: string;
	code: string;
	lat: number;
	lng: number;
	address: string;
	asset_count: number;
	total_value: number;
}

export interface TreeNode {
	id: string;
	name: string;
	type: 'root' | 'building' | 'floor';
	count?: number;
	value?: number;
	children?: TreeNode[];
}

export async function postRPC<T>(endpoint: string, payload: Record<string, unknown> = {}): Promise<T> {
	const res = await fetch(`/api/v1${endpoint}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(payload)
	});

	if (!res.ok) {
		const errText = await res.text();
		throw new Error(`API Error [${res.status}]: ${errText}`);
	}

	if (res.status === 204) return {} as T;
	return res.json();
}

// ============================================================================
// BAREBONE-SQL ENTERPRISE CLIENT
// ============================================================================

import type {
	AcceptInvitationRequest,
	AcceptInvitationResponseDTO,
	ApiErrorEnvelope,
	ContextDTO,
	ContextSwitchResponse,
	DataEnvelope,
	DatabaseTableDTO,
	DatabaseTableDetailDTO,
	InvitationReceiptDTO,
	InviteRequest,
	LoginResponse,
	MeResponse,
	MemberDTO,
	ModuleDTO,
	ModuleUsageDTO,
	ModulePurgeDTO,
	ModuleDeletePreviewDTO,
	ModuleDeleteResultDTO,
	PageDraftDTO,
	PageDraftOptions,
	PageVersionDetailDTO,
	PageVersionsDTO,
	NotificationDTO,
	PreferencesDTO,
	PreferencesPatch,
	PublishPageDraftDTO,
	ResendInvitationRequest,
	RoleAssignmentDTO,
	RoleAssignmentRequest,
	RoleDTO,
	RollbackPageDTO,
	SQLExecuteRequest,
	SQLExecuteResponseDTO,
	SQLHistoryDTO,
	SQLSavedQueryDTO,
	SQLSavedQueryCreateRequest,
	SQLSavedQueryUpdateRequest
} from './types';
import type { ThemeResponse } from '$lib/theme/types';

const BASE = '/api/v1';

/** Thrown for every non-2xx response. Carries the server's stable `code` so
 * callers can branch (e.g. CONTEXT_VERSION_CONFLICT) instead of parsing message text. */
export class ApiError extends Error {
	status: number;
	code: string;
	fieldErrors: ApiErrorEnvelope['error']['field_errors'];
	/** BATCH_FAILED only: the per-operation errors of a `_batch` call (K5-07). */
	ops: ApiErrorEnvelope['error']['ops'];
	retryable: boolean;

	constructor(envelope: ApiErrorEnvelope) {
		super(envelope.error.message);
		this.name = 'ApiError';
		this.status = envelope.error.status;
		this.code = envelope.error.code;
		this.fieldErrors = envelope.error.field_errors;
		this.ops = envelope.error.ops ?? [];
		this.retryable = envelope.error.retryable;
	}
}

export interface RequestOptions {
	method?: string;
	body?: unknown;
	/** Multipart body (F4-08); the browser sets the boundary, so no
	 * Content-Type is sent. */
	formData?: FormData;
	/** X-CSRF-Token: required for every unsafe (non-GET) request. */
	csrfToken?: string;
	/** X-Company-ID / X-Location-ID / X-Context-Version: the session's
	 * *current* context, required on context-bearing calls (PRD 8.6) — never
	 * the desired target. All three (or none) travel together. */
	companyId?: string | null;
	locationId?: string | null;
	contextVersion?: number;
	signal?: AbortSignal;
}

/**
 * AdminContext is the immutable context snapshot every `/admin/*` call must
 * carry (post-Phase-4 repair, blocker 1): the exact company/location/version
 * triple the caller believes is current, captured once at request-issue
 * time. The server independently verifies this against the authoritative
 * session and returns 409 CONTEXT_VERSION_CONFLICT on any mismatch — this
 * type just makes "which context is this request for" an explicit,
 * un-skippable parameter instead of an ambient global read at call time.
 */
/** Response of POST /auth/refresh (H2-01/H2-02). */
export interface RefreshResponse {
	session: { access_expires_at: string; idle_expires_at: string; credential_generation: number };
	csrf_token: string;
}

/**
 * AuthRefreshBindings lets the session store inject its live state into the
 * client, so apiRequest can retry a 401 without importing the store (which
 * would be an import cycle). Every callback reads the store at call time.
 */
export interface AuthRefreshBindings {
	csrfToken: () => string;
	generation: () => number;
	onRefreshed: (resp: RefreshResponse) => void;
	onRefreshFailed: () => void;
}

let authRefresh: AuthRefreshBindings | null = null;
let fallbackRefresh: Promise<void> | null = null;

export function bindAuthRefresh(bindings: AuthRefreshBindings | null): void {
	authRefresh = bindings;
}

/** Paths whose own 401 must never trigger a refresh-and-retry. */
const REFRESH_EXCLUDED = ['/auth/login', '/auth/refresh', '/auth/logout'];
// All refreshes pass through one lock so two 401s (or two tabs) never run two
// rotations; without navigator.locks a single shared promise per tab does the
// same.
function withRefreshLock(fn: () => Promise<void>): Promise<void> {
	const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
	if (locks) return locks.request('bb-auth-refresh', fn);
	if (!fallbackRefresh) {
		fallbackRefresh = fn().finally(() => {
			fallbackRefresh = null;
		});
	}
	return fallbackRefresh;
}

// Inside the lock a changed generation means another tab (or request) already
// refreshed, so this caller only replays its original request.
async function runAuthRefresh(): Promise<void> {
	const bindings = authRefresh;
	if (!bindings) return;
	const seen = bindings.generation();
	await withRefreshLock(async () => {
		if (bindings.generation() !== seen) return;
		try {
			bindings.onRefreshed(await refreshSession(bindings.csrfToken(), bindings.generation()));
		} catch (err) {
			// 409: another tab rotated first and its cookies are already ours; learn
			// the new generation instead of logging this tab out.
			if (!(err instanceof ApiError) || err.status !== 409) throw err;
			const me = await apiRequest<MeResponse>('/auth/me', {}, true);
			bindings.onRefreshed({ session: me.session, csrf_token: me.csrf_token });
		}
	});
}

/** The session store's proactive timer calls this; it is serialized like the retry path. */
export function requestSessionRefresh(): Promise<void> {
	return runAuthRefresh();
}

export function refreshSession(csrfToken: string, expectedGeneration: number, signal?: AbortSignal): Promise<RefreshResponse> {
	return apiRequest<RefreshResponse>('/auth/refresh', {
		method: 'POST',
		body: { expected_credential_generation: expectedGeneration },
		csrfToken,
		signal
	});
}

export interface AdminContext {
	companyId: string;
	locationId?: string | null;
	contextVersion: number;
}

/**
 * Mode API baca-saja (preview draft, M8-05). Saat aktif, setiap request selain
 * GET ditolak di klien sebelum fetch, kecuali POST baca yang dikenal (`_query`,
 * `_groupby`, `_pivot`, `_distinct`). Ini pagar terakhir; UI juga menyembunyikan
 * kontrol mutasi lewat metadata baca-saja.
 */
let readOnlyApi = false;
const READ_ONLY_POST = /^\/r\/[^/]+\/_(query|groupby|pivot|distinct)$/;

export function setReadOnlyApi(on: boolean): void {
	readOnlyApi = on;
}

export function isMutationBlocked(method: string, path: string): boolean {
	return readOnlyApi && method !== 'GET' && !(method === 'POST' && READ_ONLY_POST.test(path.split('?')[0]));
}

async function apiRequest<T>(path: string, options: RequestOptions = {}, retried = false): Promise<T> {
	if (isMutationBlocked(options.method ?? 'GET', path)) {
		throw new ApiError({
			error: { status: 0, code: 'PREVIEW_READ_ONLY', message: 'Preview is read-only.', field_errors: [], retryable: false },
			meta: { request_id: '', timestamp: new Date().toISOString() }
		});
	}
	const headers: Record<string, string> = {};
	let body: string | FormData | undefined;
	if (options.formData !== undefined) {
		body = options.formData;
	} else if (options.body !== undefined) {
		headers['Content-Type'] = 'application/json';
		body = JSON.stringify(options.body);
	}
	if (options.csrfToken) headers['X-CSRF-Token'] = options.csrfToken;
	if (options.companyId) headers['X-Company-ID'] = options.companyId;
	if (options.locationId) headers['X-Location-ID'] = options.locationId;
	if (options.contextVersion !== undefined) headers['X-Context-Version'] = String(options.contextVersion);

	const response = await fetch(BASE + path, {
		method: options.method ?? 'GET',
		headers,
		body,
		credentials: 'include', // send the HttpOnly session cookies
		signal: options.signal
	});

	if (response.status === 204) {
		return undefined as T;
	}

	let payload: unknown = null;
	try {
		payload = await response.json();
	} catch {
		// no/invalid body — payload stays null, handled below
	}

	if (!response.ok) {
		const error =
			payload && typeof payload === 'object' && 'error' in payload
				? new ApiError(payload as ApiErrorEnvelope)
				: new ApiError({
						error: {
							status: response.status,
							code: 'UNKNOWN_ERROR',
							message: response.statusText || 'Request failed',
							field_errors: [],
							retryable: false
						},
						meta: { request_id: '', timestamp: new Date().toISOString() }
					});
		// H2-02: an expired access token gets one refresh, then the original
		// request is replayed with the rotated cookie. Login/refresh/logout are
		// excluded; a failed refresh keeps the original error and drops the store.
		if (
			!retried &&
			response.status === 401 &&
			error.code === 'INVALID_SESSION' &&
			!REFRESH_EXCLUDED.includes(path) &&
			authRefresh
		) {
			try {
				await runAuthRefresh();
			} catch {
				authRefresh.onRefreshFailed();
				throw error;
			}
			return apiRequest<T>(path, options, true);
		}
		throw error;
	}

	return payload as T;
}

export function login(email: string, password: string, signal?: AbortSignal): Promise<LoginResponse> {
	return apiRequest<LoginResponse>('/auth/login', { method: 'POST', body: { email, password }, signal });
}

export function logout(csrfToken: string, signal?: AbortSignal): Promise<void> {
	return apiRequest<void>('/auth/logout', { method: 'POST', csrfToken, signal });
}

export function fetchMe(signal?: AbortSignal): Promise<MeResponse> {
	return apiRequest<MeResponse>('/auth/me', { signal });
}

/** Installation/user theme resolution (T1-04); callable without a session. */
export function fetchTheme(signal?: AbortSignal): Promise<DataEnvelope<ThemeResponse>> {
	return apiRequest<DataEnvelope<ThemeResponse>>('/theme', { signal });
}

/** Patches only the preferences it carries (T1-03). */
export function patchPreferences(
	patch: PreferencesPatch,
	csrfToken: string,
	signal?: AbortSignal
): Promise<DataEnvelope<PreferencesDTO>> {
	return apiRequest<DataEnvelope<PreferencesDTO>>('/auth/me/preferences', {
		method: 'PATCH',
		body: patch,
		csrfToken,
		signal
	});
}

export interface ContextSwitchRequest {
	kind: ContextDTO['kind'];
	company_id?: string | null;
	location_id?: string | null;
	expected_context_version: number;
	expected_credential_generation: number;
}

/** currentCompanyId/currentLocationId are the session's *current* context
 * (sent as X-Company-ID/X-Location-ID), distinct from the target in `req`. */
export function switchContext(
	req: ContextSwitchRequest,
	csrfToken: string,
	currentCompanyId: string | null,
	currentLocationId: string | null,
	signal?: AbortSignal
): Promise<ContextSwitchResponse> {
	return apiRequest<ContextSwitchResponse>('/auth/context', {
		method: 'POST',
		body: req,
		csrfToken,
		companyId: currentCompanyId,
		locationId: currentLocationId,
		signal
	});
}

export interface ListUsersParams {
	page?: number;
	pageSize?: number;
	sort?: string; // comma-separated, "-" prefix descending — see MemberSortField
	q?: string;
	membershipStatus?: string;
}

function toQueryString(params: Record<string, string | number | undefined>): string {
	const usp = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined && value !== '') usp.set(key, String(value));
	}
	const qs = usp.toString();
	return qs ? `?${qs}` : '';
}

function adminHeaders(ctx: AdminContext): Pick<RequestOptions, 'companyId' | 'locationId' | 'contextVersion'> {
	return { companyId: ctx.companyId, locationId: ctx.locationId ?? undefined, contextVersion: ctx.contextVersion };
}

export function listAdminUsers(ctx: AdminContext, params: ListUsersParams = {}, signal?: AbortSignal): Promise<DataEnvelope<MemberDTO[]>> {
	const qs = toQueryString({
		page: params.page,
		page_size: params.pageSize,
		sort: params.sort,
		q: params.q,
		membership_status: params.membershipStatus
	});
	return apiRequest<DataEnvelope<MemberDTO[]>>(`/admin/users${qs}`, { ...adminHeaders(ctx), signal });
}

export function listRoleAssignments(ctx: AdminContext, userId: string, signal?: AbortSignal): Promise<DataEnvelope<RoleAssignmentDTO[]>> {
	return apiRequest<DataEnvelope<RoleAssignmentDTO[]>>(`/admin/users/${userId}/role-assignments`, { ...adminHeaders(ctx), signal });
}

export function createRoleAssignment(
	ctx: AdminContext,
	userId: string,
	req: RoleAssignmentRequest,
	csrfToken: string,
	signal?: AbortSignal
): Promise<DataEnvelope<RoleAssignmentDTO>> {
	return apiRequest<DataEnvelope<RoleAssignmentDTO>>(`/admin/users/${userId}/role-assignments`, {
		method: 'POST',
		body: req,
		csrfToken,
		...adminHeaders(ctx),
		signal
	});
}

export function listAdminRoles(
	ctx: AdminContext,
	params: { page?: number; pageSize?: number } = {},
	signal?: AbortSignal
): Promise<DataEnvelope<RoleDTO[]>> {
	const qs = toQueryString({ page: params.page, page_size: params.pageSize });
	return apiRequest<DataEnvelope<RoleDTO[]>>(`/admin/roles${qs}`, { ...adminHeaders(ctx), signal });
}

// ---- In-app notifications (F7-05) -----------------------------------------
// Every call is scoped to the session (company, user) and carries the same
// context headers the /admin routes require (see notifications.go).

export interface ListNotificationsParams {
	unread?: boolean;
	page?: number;
	pageSize?: number;
}

export function listNotifications(
	ctx: AdminContext,
	params: ListNotificationsParams = {},
	signal?: AbortSignal
): Promise<DataEnvelope<NotificationDTO[]>> {
	const qs = toQueryString({
		unread: params.unread ? '1' : undefined,
		page: params.page,
		page_size: params.pageSize
	});
	return apiRequest<DataEnvelope<NotificationDTO[]>>(`/notifications${qs}`, { ...adminHeaders(ctx), signal });
}

export function countUnreadNotifications(
	ctx: AdminContext,
	signal?: AbortSignal
): Promise<DataEnvelope<{ unread: number }>> {
	return apiRequest<DataEnvelope<{ unread: number }>>('/notifications/count', { ...adminHeaders(ctx), signal });
}

export function markNotificationRead(
	ctx: AdminContext,
	id: string,
	csrfToken: string,
	signal?: AbortSignal
): Promise<DataEnvelope<{ id: string; read: boolean }>> {
	return apiRequest<DataEnvelope<{ id: string; read: boolean }>>(
		`/notifications/${encodeURIComponent(id)}/read`,
		{ method: 'POST', csrfToken, ...adminHeaders(ctx), signal }
	);
}

export function markAllNotificationsRead(
	ctx: AdminContext,
	csrfToken: string,
	signal?: AbortSignal
): Promise<DataEnvelope<{ read: number }>> {
	return apiRequest<DataEnvelope<{ read: number }>>('/notifications/read-all', {
		method: 'POST',
		csrfToken,
		...adminHeaders(ctx),
		signal
	});
}

export function inviteMember(
	ctx: AdminContext,
	req: InviteRequest,
	csrfToken: string,
	signal?: AbortSignal
): Promise<DataEnvelope<InvitationReceiptDTO>> {
	return apiRequest<DataEnvelope<InvitationReceiptDTO>>('/admin/users', { method: 'POST', body: req, csrfToken, ...adminHeaders(ctx), signal });
}

export function resendInvitation(
	ctx: AdminContext,
	userId: string,
	req: ResendInvitationRequest,
	csrfToken: string,
	signal?: AbortSignal
): Promise<DataEnvelope<InvitationReceiptDTO>> {
	return apiRequest<DataEnvelope<InvitationReceiptDTO>>(`/admin/users/${userId}/invitations/resend`, {
		method: 'POST',
		body: req,
		csrfToken,
		...adminHeaders(ctx),
		signal
	});
}

/** Preauth: no session/context headers — see invitations.go. */
export function acceptInvitation(req: AcceptInvitationRequest, signal?: AbortSignal): Promise<DataEnvelope<AcceptInvitationResponseDTO>> {
	return apiRequest<DataEnvelope<AcceptInvitationResponseDTO>>('/auth/invitations/accept', { method: 'POST', body: req, signal });
}

export { apiRequest };

/**
 * Like apiRequest, but returns the raw response body plus the server's
 * filename. Used by the CSV export, which is not JSON (K3-B08/F01).
 */
export async function apiRequestBlob(
	path: string,
	options: RequestOptions = {}
): Promise<{ blob: Blob; filename: string | null; status: number }> {
	const headers: Record<string, string> = {};
	let body: string | FormData | undefined;
	if (options.formData !== undefined) {
		body = options.formData;
	} else if (options.body !== undefined) {
		headers['Content-Type'] = 'application/json';
		body = JSON.stringify(options.body);
	}
	if (options.csrfToken) headers['X-CSRF-Token'] = options.csrfToken;
	if (options.companyId) headers['X-Company-ID'] = options.companyId;
	if (options.locationId) headers['X-Location-ID'] = options.locationId;
	if (options.contextVersion !== undefined) headers['X-Context-Version'] = String(options.contextVersion);

	const response = await fetch(BASE + path, {
		method: options.method ?? 'GET',
		headers,
		body,
		credentials: 'include',
		signal: options.signal
	});
	if (!response.ok) {
		let payload: unknown = null;
		try {
			payload = await response.json();
		} catch {
			// non-JSON error body — handled below
		}
		if (payload && typeof payload === 'object' && 'error' in payload) {
			throw new ApiError(payload as ApiErrorEnvelope);
		}
		throw new ApiError({
			error: {
				status: response.status,
				code: 'UNKNOWN_ERROR',
				message: response.statusText || 'Request failed',
				field_errors: [],
				retryable: false
			},
			meta: { request_id: '', timestamp: new Date().toISOString() }
		});
	}
	const disposition = response.headers.get('Content-Disposition') ?? '';
	const match = /filename="?([^";]+)"?/.exec(disposition);
	return { blob: await response.blob(), filename: match ? match[1] : null, status: response.status };
}

export function listPlatformModules(contextVersion: number, signal?: AbortSignal): Promise<DataEnvelope<ModuleDTO[]>> {
	return apiRequest<DataEnvelope<ModuleDTO[]>>('/platform/modules', { contextVersion, signal });
}

export function setPlatformModule(
	contextVersion: number,
	csrfToken: string,
	moduleId: string,
	enabled: boolean,
	reason: string
): Promise<DataEnvelope<ModuleDTO>> {
	return apiRequest<DataEnvelope<ModuleDTO>>(`/platform/modules/${encodeURIComponent(moduleId)}`, {
		method: 'PATCH',
		body: { enabled, reason },
		csrfToken,
		contextVersion
	});
}

export function getPlatformModuleUsage(
	contextVersion: number,
	moduleId: string,
	signal?: AbortSignal
): Promise<DataEnvelope<ModuleUsageDTO>> {
	return apiRequest<DataEnvelope<ModuleUsageDTO>>(`/platform/modules/${encodeURIComponent(moduleId)}/usage`, {
		contextVersion,
		signal
	});
}

export function updatePlatformModuleTitle(
	contextVersion: number,
	csrfToken: string,
	moduleId: string,
	title: string,
	reason?: string
): Promise<DataEnvelope<ModuleDTO>> {
	return apiRequest<DataEnvelope<ModuleDTO>>(`/platform/modules/${encodeURIComponent(moduleId)}`, {
		method: 'PATCH',
		body: { title, reason },
		csrfToken,
		contextVersion
	});
}

export function emptyPlatformModule(
	contextVersion: number,
	csrfToken: string,
	moduleId: string,
	confirm: string
): Promise<DataEnvelope<ModulePurgeDTO>> {
	return apiRequest<DataEnvelope<ModulePurgeDTO>>(`/platform/modules/${encodeURIComponent(moduleId)}/empty`, {
		method: 'POST',
		body: { confirm },
		csrfToken,
		contextVersion
	});
}

export function getPlatformModuleDeletePlan(
	contextVersion: number,
	moduleId: string,
	signal?: AbortSignal
): Promise<DataEnvelope<ModuleDeletePreviewDTO>> {
	return apiRequest<DataEnvelope<ModuleDeletePreviewDTO>>(
		`/platform/modules/${encodeURIComponent(moduleId)}/delete-plan`,
		{
			contextVersion,
			signal
		}
	);
}

export function deletePlatformModule(
	contextVersion: number,
	csrfToken: string,
	moduleId: string,
	reason?: string
): Promise<DataEnvelope<ModuleDeleteResultDTO>> {
	return apiRequest<DataEnvelope<ModuleDeleteResultDTO>>(
		`/platform/modules/${encodeURIComponent(moduleId)}/delete-apply`,
		{
			method: 'POST',
			body: { reason },
			csrfToken,
			contextVersion
		}
	);
}


// ---- Page drafts (M8) -----------------------------------------------------

export function getPageDraftOptions(contextVersion: number, signal?: AbortSignal): Promise<DataEnvelope<PageDraftOptions>> {
	return apiRequest<DataEnvelope<PageDraftOptions>>('/platform/page-draft-options', { contextVersion, signal });
}

/** Metadata resource untuk kanvas desain: semua field, hanya-baca, tanpa data dan tanpa konteks company. */
export function getPageDraftMeta(contextVersion: number, signal?: AbortSignal): Promise<DataEnvelope<{ locale: string; resources: import('./resource-types').ResourceMeta[] }>> {
	return apiRequest<DataEnvelope<{ locale: string; resources: import('./resource-types').ResourceMeta[] }>>('/platform/page-draft-meta', { contextVersion, signal });
}

export function listPageDrafts(contextVersion: number, signal?: AbortSignal): Promise<DataEnvelope<PageDraftDTO[]>> {
	return apiRequest<DataEnvelope<PageDraftDTO[]>>('/platform/page-drafts', { contextVersion, signal });
}

export function createPageDraft(
	contextVersion: number,
	csrfToken: string,
	pageId: string,
	definition: PageDraftDTO['definition']
): Promise<DataEnvelope<PageDraftDTO>> {
	return apiRequest<DataEnvelope<PageDraftDTO>>('/platform/page-drafts', {
		method: 'POST',
		body: { page_id: pageId, definition },
		csrfToken,
		contextVersion
	});
}

export function updatePageDraft(
	contextVersion: number,
	csrfToken: string,
	id: string,
	expectedVersion: number,
	definition: PageDraftDTO['definition']
): Promise<DataEnvelope<PageDraftDTO>> {
	return apiRequest<DataEnvelope<PageDraftDTO>>(`/platform/page-drafts/${encodeURIComponent(id)}`, {
		method: 'PATCH',
		body: { expected_version: expectedVersion, definition },
		csrfToken,
		contextVersion
	});
}

export function deletePageDraft(contextVersion: number, csrfToken: string, id: string, expectedVersion: number): Promise<void> {
	return apiRequest<void>(`/platform/page-drafts/${encodeURIComponent(id)}?expected_version=${expectedVersion}`, {
		method: 'DELETE',
		csrfToken,
		contextVersion
	});
}

export function publishPageDraft(
	contextVersion: number,
	csrfToken: string,
	id: string,
	expectedVersion: number,
	note: string
): Promise<DataEnvelope<PublishPageDraftDTO>> {
	return apiRequest<DataEnvelope<PublishPageDraftDTO>>(`/platform/page-drafts/${encodeURIComponent(id)}/publish`, {
		method: 'POST',
		body: { expected_version: expectedVersion, note },
		csrfToken,
		contextVersion
	});
}

export function listPageVersions(
	contextVersion: number,
	pageId: string,
	signal?: AbortSignal
): Promise<DataEnvelope<PageVersionsDTO>> {
	return apiRequest<DataEnvelope<PageVersionsDTO>>(`/platform/pages/${encodeURIComponent(pageId)}/versions`, {
		contextVersion,
		signal
	});
}

export function rollbackPage(
	contextVersion: number,
	csrfToken: string,
	pageId: string,
	revision: number,
	expectedActiveVersion: number
): Promise<DataEnvelope<RollbackPageDTO>> {
	return apiRequest<DataEnvelope<RollbackPageDTO>>(`/platform/pages/${encodeURIComponent(pageId)}/rollback`, {
		method: 'POST',
		body: { revision, expected_active_version: expectedActiveVersion },
		csrfToken,
		contextVersion
	});
}

export function getPageVersion(
	contextVersion: number,
	pageId: string,
	revision: number,
	signal?: AbortSignal
): Promise<DataEnvelope<PageVersionDetailDTO>> {
	return apiRequest<DataEnvelope<PageVersionDetailDTO>>(
		`/platform/pages/${encodeURIComponent(pageId)}/versions/${revision}`,
		{ contextVersion, signal }
	);
}

export interface GeneratedDrafts {
	draft: PageDraftDTO;
	drafts: PageDraftDTO[];
	suggested_permissions: string[];
	navigation?: string;
}

/** Satu resource, atau beberapa resource sebagai aplikasi (opsional dengan navigasi bersama bernama `app`). */
export function generatePageDraft(
	contextVersion: number,
	csrfToken: string,
	resourceIds: string[],
	app?: string
): Promise<DataEnvelope<GeneratedDrafts>> {
	return apiRequest<DataEnvelope<GeneratedDrafts>>('/platform/page-drafts/generate', {
		method: 'POST',
		body: { resource_ids: resourceIds, ...(app ? { app } : {}) },
		csrfToken,
		contextVersion
	});
}

// ---- Shared components and theme studio (P7/P8) ---------------------------

export interface SharedComponentDTO {
	kind: string;
	name: string;
	version: number;
	definition: Record<string, unknown>;
}

export function listSharedComponents(contextVersion: number, signal?: AbortSignal): Promise<DataEnvelope<SharedComponentDTO[]>> {
	return apiRequest<DataEnvelope<SharedComponentDTO[]>>('/platform/shared', { contextVersion, signal });
}

/** expectedVersion 0 membuat komponen baru; selain itu harus cocok dengan versi tersimpan. */
export function saveSharedComponent(
	contextVersion: number,
	csrfToken: string,
	kind: string,
	name: string,
	expectedVersion: number,
	definition: Record<string, unknown>
): Promise<DataEnvelope<SharedComponentDTO>> {
	return apiRequest<DataEnvelope<SharedComponentDTO>>(`/platform/shared/${encodeURIComponent(kind)}/${encodeURIComponent(name)}`, {
		method: 'PUT',
		body: { expected_version: expectedVersion, definition },
		csrfToken,
		contextVersion
	});
}

export function deleteSharedComponent(contextVersion: number, csrfToken: string, kind: string, name: string, expectedVersion: number): Promise<void> {
	return apiRequest<void>(`/platform/shared/${encodeURIComponent(kind)}/${encodeURIComponent(name)}?expected_version=${expectedVersion}`, {
		method: 'DELETE',
		csrfToken,
		contextVersion
	});
}

export function publishTheme(contextVersion: number, csrfToken: string, name: string, expectedVersion: number, note: string): Promise<DataEnvelope<{ revision: number }>> {
	return apiRequest<DataEnvelope<{ revision: number }>>(`/platform/themes/${encodeURIComponent(name)}/publish`, {
		method: 'POST',
		body: { expected_version: expectedVersion, note },
		csrfToken,
		contextVersion
	});
}

export function rollbackTheme(contextVersion: number, csrfToken: string, revision: number): Promise<DataEnvelope<{ revision: number }>> {
	return apiRequest<DataEnvelope<{ revision: number }>>('/platform/themes/rollback', {
		method: 'POST',
		body: { revision },
		csrfToken,
		contextVersion
	});
}

export interface WizardField {
	name: string;
	type: string;
	required: boolean;
	search: boolean;
	sort: boolean;
	filter: boolean;
	max: number;
	options: string[];
	default: string;
	ref: string;
	accept: string[];
}

export interface WizardSourceSpec {
	table: string;
	key?: string;
	company?: string;
	mode: 'link' | 'copy';
	broken?: boolean;
	broken_reason?: string;
}

export interface WizardSpec {
	module: string;
	name: string;
	table: string;
	title: string;
	nav_group: string;
	icon: string;
	fields: WizardField[];
	source?: WizardSourceSpec;
}

export interface WizardInfo {
	/** Server started with SCAFFOLD_ROOT: file previews and writing are available. */
	enabled: boolean;
	modules: { id: string; resources: string[]; dynamic?: boolean }[];
	field_types: string[];
}

export interface WizardFile {
	path: string;
	content: string;
	action: 'create' | 'update';
}

export interface WizardPreview {
	command: string;
	enabled: boolean;
	files: WizardFile[];
	warnings: string[];
}

export interface WizardWriteResult {
	created: string[];
	updated: string[];
	warnings: string[];
}

export function getResourceWizard(contextVersion: number, signal?: AbortSignal): Promise<DataEnvelope<WizardInfo>> {
	return apiRequest<DataEnvelope<WizardInfo>>('/platform/resource-wizard', { contextVersion, signal });
}

export function previewResource(contextVersion: number, csrfToken: string, spec: WizardSpec): Promise<DataEnvelope<WizardPreview>> {
	return apiRequest<DataEnvelope<WizardPreview>>('/platform/resource-wizard/preview', { method: 'POST', body: spec, csrfToken, contextVersion });
}

export function writeResource(contextVersion: number, csrfToken: string, spec: WizardSpec): Promise<DataEnvelope<WizardWriteResult>> {
	return apiRequest<DataEnvelope<WizardWriteResult>>('/platform/resource-wizard/write', { method: 'POST', body: spec, csrfToken, contextVersion });
}

// ---- Dynamic resources (P12) -----------------------------------------------

export interface DynamicResourceDTO {
	id: string;
	module: string;
	name: string;
	spec: WizardSpec;
	status: 'active' | 'disabled' | 'broken';
	version: number;
	created_at: string;
	updated_at: string;
	created_by?: string;
	updated_by?: string;
}

export interface PatchDynamicResourceRequest {
	fields?: WizardField[];
	spec?: WizardSpec;
	reason?: string;
}

export function listDynamicResources(contextVersion: number, signal?: AbortSignal): Promise<DataEnvelope<DynamicResourceDTO[]>> {
	return apiRequest<DataEnvelope<DynamicResourceDTO[]>>('/platform/dynamic-resources', { contextVersion, signal });
}

export function createDynamicResource(
	contextVersion: number,
	csrfToken: string,
	spec: WizardSpec
): Promise<DataEnvelope<DynamicResourceDTO>> {
	return apiRequest<DataEnvelope<DynamicResourceDTO>>('/platform/dynamic-resources', {
		method: 'POST',
		body: spec,
		csrfToken,
		contextVersion
	});
}

export function patchDynamicResource(
	contextVersion: number,
	csrfToken: string,
	id: string,
	req: PatchDynamicResourceRequest
): Promise<DataEnvelope<DynamicResourceDTO>> {
	return apiRequest<DataEnvelope<DynamicResourceDTO>>(`/platform/dynamic-resources/${encodeURIComponent(id)}`, {
		method: 'PATCH',
		body: req,
		csrfToken,
		contextVersion
	});
}

export function disableDynamicResource(
	contextVersion: number,
	csrfToken: string,
	id: string
): Promise<DataEnvelope<DynamicResourceDTO>> {
	return apiRequest<DataEnvelope<DynamicResourceDTO>>(`/platform/dynamic-resources/${encodeURIComponent(id)}/disable`, {
		method: 'POST',
		csrfToken,
		contextVersion
	});
}

export function enableDynamicResource(
	contextVersion: number,
	csrfToken: string,
	id: string
): Promise<DataEnvelope<DynamicResourceDTO>> {
	return apiRequest<DataEnvelope<DynamicResourceDTO>>(`/platform/dynamic-resources/${encodeURIComponent(id)}/enable`, {
		method: 'POST',
		csrfToken,
		contextVersion
	});
}

export function deleteDynamicResource(
	contextVersion: number,
	csrfToken: string,
	id: string
): Promise<DataEnvelope<{ id: string; deleted: boolean }>> {
	return apiRequest<DataEnvelope<{ id: string; deleted: boolean }>>(`/platform/dynamic-resources/${encodeURIComponent(id)}`, {
		method: 'DELETE',
		csrfToken,
		contextVersion
	});
}

// ---- Database source adoption (P13) ----------------------------------------

export interface DatabaseSourceDTO {
	name: string;
	row_count: number;
	can_link: boolean;
	link_blockers: string[];
	can_copy: boolean;
	copy_blockers: string[];
	has_company_column: boolean;
}

export interface DatabaseSourceColumnDTO {
	name: string;
	type: string;
	proposed_type: string;
	valid_types: string[];
	nullable: boolean;
	primary_key: boolean;
}

export interface DatabaseSourceDetailDTO {
	name: string;
	row_count: number;
	columns: DatabaseSourceColumnDTO[];
	key_candidates: string[];
	has_company_column: boolean;
	company_column?: string;
	can_link: boolean;
	link_blockers: string[];
	can_copy: boolean;
	copy_blockers: string[];
}

export function listPlatformDatabaseSources(
	contextVersion: number,
	signal?: AbortSignal
): Promise<DataEnvelope<DatabaseSourceDTO[]>> {
	return apiRequest<DataEnvelope<DatabaseSourceDTO[]>>('/platform/db/sources', { contextVersion, signal });
}

export function getPlatformDatabaseSource(
	contextVersion: number,
	name: string,
	signal?: AbortSignal
): Promise<DataEnvelope<DatabaseSourceDetailDTO>> {
	return apiRequest<DataEnvelope<DatabaseSourceDetailDTO>>(`/platform/db/sources/${encodeURIComponent(name)}`, { contextVersion, signal });
}

export function linkDynamicResource(
	contextVersion: number,
	csrfToken: string,
	payload: { spec: WizardSpec; shared_accepted?: boolean }
): Promise<DataEnvelope<DynamicResourceDTO>> {
	return apiRequest<DataEnvelope<DynamicResourceDTO>>('/platform/dynamic-resources/link', {
		method: 'POST',
		body: payload,
		csrfToken,
		contextVersion
	});
}

export function copyDynamicResource(
	contextVersion: number,
	csrfToken: string,
	payload: { spec: WizardSpec; company_id?: string }
): Promise<DataEnvelope<DynamicResourceDTO>> {
	return apiRequest<DataEnvelope<DynamicResourceDTO>>('/platform/dynamic-resources/copy', {
		method: 'POST',
		body: payload,
		csrfToken,
		contextVersion
	});
}

// ---- Dynamic modules (P12 Stage 2) -------------------------------------------

export interface DynamicModuleDTO {
	id: string;
	title: string;
	status: 'active' | 'disabled';
	version: number;
	created_at: string;
	updated_at: string;
	created_by?: string;
	updated_by?: string;
}

export function listDynamicModules(contextVersion: number, signal?: AbortSignal): Promise<DataEnvelope<DynamicModuleDTO[]>> {
	return apiRequest<DataEnvelope<DynamicModuleDTO[]>>('/platform/dynamic-modules', { contextVersion, signal });
}

export function createDynamicModule(
	contextVersion: number,
	csrfToken: string,
	req: { id: string; title: string }
): Promise<DataEnvelope<DynamicModuleDTO>> {
	return apiRequest<DataEnvelope<DynamicModuleDTO>>('/platform/dynamic-modules', {
		method: 'POST',
		body: req,
		csrfToken,
		contextVersion
	});
}

export function updateDynamicModuleTitle(
	contextVersion: number,
	csrfToken: string,
	id: string,
	title: string
): Promise<DataEnvelope<DynamicModuleDTO>> {
	return apiRequest<DataEnvelope<DynamicModuleDTO>>(`/platform/dynamic-modules/${encodeURIComponent(id)}`, {
		method: 'PATCH',
		body: { title },
		csrfToken,
		contextVersion
	});
}

export function disableDynamicModule(
	contextVersion: number,
	csrfToken: string,
	id: string
): Promise<DataEnvelope<DynamicModuleDTO>> {
	return apiRequest<DataEnvelope<DynamicModuleDTO>>(`/platform/dynamic-modules/${encodeURIComponent(id)}/disable`, {
		method: 'POST',
		csrfToken,
		contextVersion
	});
}

export function enableDynamicModule(
	contextVersion: number,
	csrfToken: string,
	id: string
): Promise<DataEnvelope<DynamicModuleDTO>> {
	return apiRequest<DataEnvelope<DynamicModuleDTO>>(`/platform/dynamic-modules/${encodeURIComponent(id)}/enable`, {
		method: 'POST',
		csrfToken,
		contextVersion
	});
}

export function deleteDynamicModule(
	contextVersion: number,
	csrfToken: string,
	id: string
): Promise<DataEnvelope<{ id: string; deleted: boolean }>> {
	return apiRequest<DataEnvelope<{ id: string; deleted: boolean }>>(`/platform/dynamic-modules/${encodeURIComponent(id)}`, {
		method: 'DELETE',
		csrfToken,
		contextVersion
	});
}



export interface ModuleWizardSpec {
	id: string;
	title?: string;
}

export interface ModuleWizardInfo {
	enabled: boolean;
}

export function getModuleWizard(contextVersion: number, signal?: AbortSignal): Promise<DataEnvelope<ModuleWizardInfo>> {
	return apiRequest<DataEnvelope<ModuleWizardInfo>>('/platform/module-wizard', { contextVersion, signal });
}

export function previewModule(contextVersion: number, csrfToken: string, spec: ModuleWizardSpec): Promise<DataEnvelope<WizardPreview>> {
	return apiRequest<DataEnvelope<WizardPreview>>('/platform/module-wizard/plan', { method: 'POST', body: spec, csrfToken, contextVersion });
}

export function writeModule(contextVersion: number, csrfToken: string, spec: ModuleWizardSpec): Promise<DataEnvelope<WizardWriteResult>> {
	return apiRequest<DataEnvelope<WizardWriteResult>>('/platform/module-wizard/apply', { method: 'POST', body: spec, csrfToken, contextVersion });
}

// ---- Platform database explorer (X3) ---------------------------------------

export function listPlatformDatabaseTables(contextVersion: number, signal?: AbortSignal): Promise<DataEnvelope<DatabaseTableDTO[]>> {
	return apiRequest<DataEnvelope<DatabaseTableDTO[]>>('/platform/db/tables', { contextVersion, signal });
}

export function getPlatformDatabaseTable(
	contextVersion: number,
	name: string,
	page: number,
	size: number,
	signal?: AbortSignal
): Promise<DataEnvelope<DatabaseTableDetailDTO>> {
	const qs = toQueryString({ page, size });
	return apiRequest<DataEnvelope<DatabaseTableDetailDTO>>(`/platform/db/tables/${encodeURIComponent(name)}${qs}`, { contextVersion, signal });
}

// ---- Platform SQL console (P14) -------------------------------------------

export function executePlatformSQL(
	contextVersion: number,
	csrfToken: string,
	req: SQLExecuteRequest,
	signal?: AbortSignal
): Promise<DataEnvelope<SQLExecuteResponseDTO>> {
	return apiRequest<DataEnvelope<SQLExecuteResponseDTO>>('/platform/sql/execute', {
		method: 'POST',
		body: req,
		csrfToken,
		contextVersion,
		signal
	});
}

export function listPlatformSQLHistory(
	contextVersion: number,
	signal?: AbortSignal
): Promise<DataEnvelope<SQLHistoryDTO[]>> {
	return apiRequest<DataEnvelope<SQLHistoryDTO[]>>('/platform/sql/history', {
		contextVersion,
		signal
	});
}

export function listPlatformSQLSaved(
	contextVersion: number,
	signal?: AbortSignal
): Promise<DataEnvelope<SQLSavedQueryDTO[]>> {
	return apiRequest<DataEnvelope<SQLSavedQueryDTO[]>>('/platform/sql/saved', {
		contextVersion,
		signal
	});
}

export function createPlatformSQLSaved(
	contextVersion: number,
	csrfToken: string,
	req: SQLSavedQueryCreateRequest
): Promise<DataEnvelope<SQLSavedQueryDTO>> {
	return apiRequest<DataEnvelope<SQLSavedQueryDTO>>('/platform/sql/saved', {
		method: 'POST',
		body: req,
		csrfToken,
		contextVersion
	});
}

export function updatePlatformSQLSaved(
	contextVersion: number,
	csrfToken: string,
	id: string,
	req: SQLSavedQueryUpdateRequest
): Promise<DataEnvelope<SQLSavedQueryDTO>> {
	return apiRequest<DataEnvelope<SQLSavedQueryDTO>>(`/platform/sql/saved/${encodeURIComponent(id)}`, {
		method: 'PUT',
		body: req,
		csrfToken,
		contextVersion
	});
}

export function deletePlatformSQLSaved(
	contextVersion: number,
	csrfToken: string,
	id: string
): Promise<DataEnvelope<{ deleted: boolean }>> {
	return apiRequest<DataEnvelope<{ deleted: boolean }>>(`/platform/sql/saved/${encodeURIComponent(id)}`, {
		method: 'DELETE',
		csrfToken,
		contextVersion
	});
}

