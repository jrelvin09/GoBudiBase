// Mirrors the JSON shapes emitted by backend/internal/core/httpserver/auth.go.
// Keep field names/shapes in sync with that file's DTOs, not with PRD section
// 9's full envelope (the existing 4 auth endpoints intentionally use a
// simpler flat shape; see task_plan.md's Phase 13 scope note).

import type { Density, Mode as ThemeMode } from '$lib/theme/types';

export type ContextKind = 'NONE' | 'PLATFORM' | 'COMPANY' | 'LOCATION';

export interface UserDTO {
	id: string;
	email: string;
	display_name: string;
	status: string;
	preferred_locale: string;
	preferred_theme_mode: ThemeMode;
	preferred_density: Density | null;
}

/** Preferences patch: an absent field is left unchanged (T1-03). */
export interface PreferencesPatch {
	preferred_locale?: string;
	preferred_theme_mode?: ThemeMode;
	preferred_density?: Density;
}

/** Response of PATCH /auth/me/preferences: every preference after the patch. */
export interface PreferencesDTO {
	preferred_locale: string;
	preferred_theme_mode: ThemeMode;
	preferred_density: Density | null;
}

export interface ContextDTO {
	kind: ContextKind;
	company_id?: string;
	location_id?: string;
	context_version: number;
}

export interface SessionMetaDTO {
	access_expires_at: string;
	idle_expires_at: string;
	credential_generation: number;
}

export interface OrgDTO {
	id: string;
	code: string;
	display_name?: string;
	name?: string;
	company_id?: string;
}

export interface LoginResponse {
	user: UserDTO;
	csrf_token: string;
	context: ContextDTO;
	requires_context_selection: boolean;
	session: SessionMetaDTO;
}

export interface MeResponse {
	user: UserDTO;
	csrf_token: string;
	context: ContextDTO;
	session: SessionMetaDTO;
	allowed_companies: OrgDTO[];
	allowed_locations: OrgDTO[];
	permissions: string[];
	platform_eligible: boolean;
}

export interface ModuleDTO {
	id: string;
	title?: string;
	version: string;
	enabled: boolean;
	requires: string[];
	required_by: string[];
}

export interface ContextSwitchResponse {
	context: ContextDTO;
	session: SessionMetaDTO;
	permissions: string[];
	csrf_token: string;
}

export interface FieldError {
	path?: string;
	field?: string;
	code: string;
	message: string;
}

export interface ApiErrorEnvelope {
	error: {
		status: number;
		code: string;
		message: string;
		field_errors: FieldError[];
		/** BATCH_FAILED only: one entry per rejected `_batch` operation. */
		ops?: BatchOpErrorDTO[];
		retryable: boolean;
	};
	meta: { request_id: string; timestamp: string };
}

/** One rejected operation of `POST /api/v1/r/{res}/_batch` (K5-01). */
export interface BatchOpErrorDTO {
	index: number;
	code: string;
	/** Resource endpoints report field errors as `field` (not `path`). */
	field_errors?: { field: string; code: string; message: string }[];
}

// ---- Slice C: admin/users, role-assignments, roles -------------------------
// These endpoints (unlike the 4 auth endpoints above) use PRD 9.8's data/meta
// envelope; see backend/internal/core/httpserver/admin.go.

export interface PaginationMeta {
	page: number;
	page_size: number;
	/** Decimal string (PRD 9.1: unbounded counts avoid JS number precision loss). */
	total: string;
	total_pages: number;
	has_next: boolean;
}

export interface DataEnvelope<T> {
	data: T;
	meta: {
		request_id: string;
		timestamp: string;
		/** Absent for non-contextual responses (e.g. invitation accept, which
		 * has no active session context to report). */
		context_version?: string;
		pagination?: PaginationMeta;
	};
}

export interface MemberDTO {
	user_id: string;
	email: string;
	display_name: string;
	membership_status: string;
	created_at: string;
	last_login_at?: string;
}

export type MemberSortField = 'display_name' | 'email' | 'membership_status' | 'created_at' | 'last_login_at';

export interface RoleDTO {
	id: string;
	code: string;
	name: string;
	description?: string;
	scope_class: string;
	is_system: boolean;
	status: string;
	/** Authoritative for the caller's *current* target scope — see admin.go.
	 * The picker should hide/gray non-delegable roles; the backend enforces
	 * this independently at grant time regardless of what the UI does. */
	delegable: boolean;
}

export interface RoleAssignmentScopeDTO {
	kind: 'COMPANY' | 'LOCATION';
	company_id: string;
	location_id?: string | null;
}

export interface RoleAssignmentDTO {
	assignment_id: string;
	user_id: string;
	scope: RoleAssignmentScopeDTO;
	role_id: string;
	valid_from: string;
	valid_until?: string;
	reason: string;
	grantor_user_id: string;
	version: string;
	created_at: string;
}

export interface RoleAssignmentRequest {
	scope: { kind: 'COMPANY' | 'LOCATION'; company_id: string; location_id?: string | null };
	role_id: string;
	valid_from?: string;
	valid_until?: string | null;
	reason: string;
}

// ---- Invitation flow (PRD 8.2) --------------------------------------------
// No outbox/email delivery exists yet — see backend/internal/core/httpserver/
// invitations.go's file doc comment. invite_token is present only when the
// backend is running with ExposeInviteTokens (never in production).

export interface InviteRequest {
	email: string;
	company_display_name?: string | null;
}

export interface InvitationReceiptDTO {
	user_id: string;
	email: string;
	company_id: string;
	membership_status: string;
	expires_at: string;
	invite_token?: string;
}

export interface ResendInvitationRequest {
	reason: string;
}

export interface AcceptInvitationRequest {
	token: string;
	new_password?: string;
}

export interface AcceptInvitationResponseDTO {
	user_id: string;
	email: string;
	company_id: string;
	membership_status: string;
}

// ---- In-app notifications (F7-05) -----------------------------------------
// Mirrors backend/internal/core/httpserver/notifications.go's notificationDTO.
// `title_key` is an i18n key the client resolves with `params`, so the server
// stays language-agnostic; `kind` is the framework-level event
// ("workflow.approved" | "workflow.rejected" | "workflow.approval_pending").

export interface NotificationDTO {
	id: string;
	kind: string;
	title_key: string;
	params: Record<string, unknown>;
	link?: string;
	read: boolean;
	created_at: string;
}

/** Draft PageDefinition global platform (M8). */
export interface PageDraftDTO {
	id: string;
	page_id: string;
	definition: import('$lib/renderer/runtime/page-definition').PageDefinition;
	version: number;
}

export interface PageDraftFieldOption {
	name: string;
	type: string;
	in_table: boolean;
	sortable: boolean;
	searchable: boolean;
	filterable: boolean;
}

export interface PageDraftOptions {
	region_types: string[];
	resources: string[];
	fields: Record<string, PageDraftFieldOption[]>;
}

/** Definisi halaman terbit aktif untuk runtime (B013/B014). */
export interface PublishedPageDTO {
	page_id: string;
	revision: number;
	hash: string;
	definition: import('$lib/renderer/runtime/page-definition').PageDefinition;
}

/** Satu revisi terbit halaman (B007/B015). */
export interface PageVersionDTO {
	revision: number;
	hash: string;
	note: string;
	created_by: string;
	created_at: string;
	active: boolean;
}

/** Respons GET /platform/pages/{page_id}/versions (B007/B015). */
export interface PageVersionsDTO {
	active_version: number | null;
	versions: PageVersionDTO[];
}

/** Respons POST /platform/page-drafts/{id}/publish (B005/B015). */
export interface PublishPageDraftDTO {
	page_id: string;
	revision: number;
	hash: string;
}

/** Respons POST /platform/pages/{page_id}/rollback (B008/B015). */
export interface RollbackPageDTO {
	page_id: string;
	revision: number;
}

/** Satu revisi terbit dengan definisinya (D011a). */
export interface PageVersionDetailDTO {
	revision: number;
	hash: string;
	note: string;
	created_by: string;
	created_at: string;
	definition: unknown;
}

// ---- Platform database explorer (X3) ---------------------------------------
// Mirrors backend/internal/core/httpserver/db_explorer.go. Read-only: there
// is no write DTO, and `sensitive` columns always carry masked values.

/** Satu tabel hasil introspeksi; row_count perkiraan pada PostgreSQL. */
export interface DatabaseTableDTO {
	name: string;
	row_count: number;
}

export interface DatabaseColumnDTO {
	name: string;
	type: string;
	nullable: boolean;
	primary_key: boolean;
	/** Nilai kolom ini sudah disamarkan server menjadi "••••". */
	sensitive: boolean;
}

/** Satu halaman isi tabel (SELECT *), dengan schema kolomnya. */
export interface DatabaseTableDetailDTO {
	table: string;
	columns: DatabaseColumnDTO[];
	rows: Record<string, unknown>[];
}

// ---- Platform module lifecycle (Y1-Y5) -------------------------------------

export interface ModuleTableUsageDTO {
	table: string;
	resource?: string;
	row_count: number;
}

export interface ModuleReferenceDTO {
	module: string;
	table: string;
	column: string;
	references_table: string;
	row_count: number;
}

export interface ModuleBlockerDTO {
	kind: 'required_by' | 'referenced_by';
	module: string;
	table?: string;
	column?: string;
	row_count?: number;
}

export interface ModuleUsageDTO {
	module: string;
	tables: ModuleTableUsageDTO[];
	required_by: string[];
	referenced_by: ModuleReferenceDTO[];
	can_empty: boolean;
	can_delete: boolean;
	blockers: ModuleBlockerDTO[];
}

export interface ModulePurgedTableDTO {
	table: string;
	rows: number;
}

export interface ModulePurgeDTO {
	module: string;
	purged: ModulePurgedTableDTO[];
}

export interface ModuleDeleteFileDTO {
	path: string;
	content: string;
	action: 'create' | 'update' | 'delete';
}

export interface ModuleDeletePreviewDTO {
	id: string;
	enabled: boolean;
	can_delete: boolean;
	blockers: string[];
	files: ModuleDeleteFileDTO[];
	warnings: string[];
}

export interface ModuleDeleteResultDTO {
	deleted: string[];
	updated: string[];
	warnings: string[];
}

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

export interface SQLExecuteRequest {
	sql: string;
	rollback?: boolean;
}

export interface SQLExecuteResponseDTO {
	kind: string;
	columns: string[];
	rows: Record<string, unknown>[];
	rows_affected: number;
	truncated: boolean;
	duration_ms: number;
}

export interface SQLHistoryDTO {
	id: string;
	occurred_at: string;
	sql: string;
	kind: string;
	rows_affected: number;
	duration_ms: number;
	status: string;
	error?: string;
}

export interface SQLSavedQueryDTO {
	id: string;
	name: string;
	sql: string;
	version: number;
	created_at: string;
	updated_at: string;
}

export interface SQLSavedQueryCreateRequest {
	name: string;
	sql: string;
}

export interface SQLSavedQueryUpdateRequest {
	name: string;
	sql: string;
	expected_version: number;
}


