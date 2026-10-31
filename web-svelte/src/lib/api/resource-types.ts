import type { FieldMeta, OptionMeta } from '$lib/kit/fields/types';

export type { FieldMeta, OptionMeta };

/** Salinan persis `fw.Metadata` (backend/internal/core/fw/meta.go). */
export interface ResourceMeta {
	id: string;
	label: string;
	plural: string;
	icon?: string;
	nav_group?: string;
	nav_order: number;
	title_field: string;
	default_sort?: string;
	/** "report" (default), "grid", "cards", "faceted", or "calendar" (K6-01). */
	list_view: string;
	/** "page" (default) or "drawer" (K6-01). */
	form_mode: string;
	/** Cards view fields (K6-01); absent for the other views. */
	cards?: { title: string; subtitle?: string; badge?: string; body?: string };
	/** Date field the Calendar view plots (K6-01). */
	calendar_field?: string;
	/** Form sections/tabs (F6-05); absent when the form is one plain grid. */
	form_layout?: FormSectionMeta[];
	/** Create page steps through form_layout (F6-06). */
	create_wizard?: boolean;
	fields: FieldMeta[];
	/** Allowed actions only (F2-08); absent when the resource has none. */
	actions?: ActionMeta[];
	/** has_many tabs on the edit page (F3-01); absent when the resource has none. */
	relations?: {
		name: string;
		label: string;
		resource: string;
		foreign_key: string;
		grid: boolean;
	}[];
	/** State machine resource (F7-01); absent when the resource has none. */
	workflow?: WorkflowMeta;
	capabilities: Record<string, boolean>;
}

/** Cermin `fw.WorkflowMeta` (F7-01). */
export type WorkflowMeta = {
	field: string;
	states: string[];
	transitions: TransitionMeta[];
};

/** Cermin `fw.TransitionMeta` (F7-01); `approval_levels` = 0 for a plain transition. */
export type TransitionMeta = {
	name: string;
	from: string[];
	to: string;
	approval_levels: number;
};

/** Cermin `fw.VisibleWhen` (F7-01): an action applies only when the field has
 * one of these values. The server still checks every operation. */
export type VisibleWhen = {
	field: string;
	values: unknown[];
};

/** Cermin `httpserver.pendingApproval` (F7-02/F7-04): one record whose next
 * approval level the caller may decide. */
export type PendingApproval = {
	resource: string;
	record_id: string;
	title: string;
	transition: string;
	level: number;
};

/** Cermin `httpserver.approvalEntryDTO` (F7-04): one approval decision. */
export type ApprovalEntry = {
	transition: string;
	cycle: number;
	level: number;
	decision: string;
	approver_user_id: string;
	approver_name: string;
	comment: string;
	created_at: string;
};

export type ResourceRecord = Record<string, unknown> & {
	id: string;
	version: number;
	created_at: string;
	updated_at: string;
};

/** Cermin `fw.SectionMeta` (F6-05): one form section or tab. */
export type FormSectionMeta = {
	name: string;
	label: string;
	tab: boolean;
	columns: number;
	fields: string[];
};

/** Cermin `fw.ActionMeta` (backend/internal/core/fw/meta.go); F2-08/F2-11. */
export type ActionMeta = {
	name: string;
	label: string;
	row: boolean;
	bulk: boolean;
	header: boolean;
	confirm: boolean;
	confirm_text?: string;
	danger: boolean;
	form?: FieldMeta[];
	/** Tells the UI when the action applies (F7-01); only workflow transition
	 * actions set it today. */
	available_when?: VisibleWhen;
};
