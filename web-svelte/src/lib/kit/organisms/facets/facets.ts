import type { FieldMeta } from '$lib/kit/fields/types';
import type { ReportFilter, ReportMeta, ReportSettings } from '$lib/kit/organisms/ir/types';

/**
 * Faceted Search state (K6-03): the search box, the selected values per
 * select/toggle facet, and the [low, high] bounds per number/date facet.
 */
export type FacetState = {
	search: string;
	selected: Record<string, string[]>;
	ranges: Record<string, [number | string | null, number | string | null]>;
};

export function emptyFacetState(): FacetState {
	return { search: '', selected: {}, ranges: {} };
}

/** Only fields marked `.Facet()` take part (K6-01). */
export function facetFields(meta: ReportMeta): FieldMeta[] {
	return meta.fields.filter((field) => field.facet === true);
}

/**
 * The filters one facet state produces. Select facets become `in`, a toggle
 * with one value ticked becomes `eq`;
 * number/date facets become `between`, or only `gte`/`lte` when a single side
 * is filled. The search box becomes a `search` filter.
 */
export function facetFilters(state: FacetState, meta: ReportMeta): ReportFilter[] {
	const out: ReportFilter[] = [];
	const search = state.search.trim();
	if (search !== '') {
		out.push({ id: 'facet_search', kind: 'search', column: null, op: 'contains', value: search, enabled: true });
	}
	for (const field of facetFields(meta)) {
		if (field.type === 'toggle') {
			// The server allows only `eq` on toggles; both values ticked = no filter.
			const values = state.selected[field.name] ?? [];
			if (values.length === 1) {
				out.push({ id: `facet_${field.name}`, kind: 'column', column: field.name, op: 'eq', value: values[0] === 'true', enabled: true });
			}
		} else if (field.type === 'select') {
			const values = state.selected[field.name] ?? [];
			if (values.length > 0) {
				out.push({ id: `facet_${field.name}`, kind: 'column', column: field.name, op: 'in', value: values, enabled: true });
			}
		} else if (field.type === 'number' || field.type === 'date') {
			const [low, high] = state.ranges[field.name] ?? [null, null];
			if (low === null && high === null) continue;
			if (low !== null && high !== null) {
				out.push({ id: `facet_${field.name}`, kind: 'column', column: field.name, op: 'between', value: [low, high], enabled: true });
			} else if (low !== null) {
				out.push({ id: `facet_${field.name}`, kind: 'column', column: field.name, op: 'gte', value: low, enabled: true });
			} else {
				out.push({ id: `facet_${field.name}`, kind: 'column', column: field.name, op: 'lte', value: high, enabled: true });
			}
		}
	}
	return out;
}
/**
 * Settings for counting facet `facetName`: every other facet (and the search
 * box) stays active, but the facet's own filter is removed so its choices are
 * not narrowed by the selection in that same facet (APEX behaviour).
 */
export function settingsForCounts(state: FacetState, meta: ReportMeta, facetName: string): ReportSettings {
	return {
		...baseSettings(meta),
		filters: facetFilters(state, meta).filter((filter) => filter.column !== facetName)
	};
}

/** Minimal valid report settings for `_distinct`: in-table columns, no sort. */
function baseSettings(meta: ReportMeta): ReportSettings {
	return {
		columns: meta.fields.filter((field) => field.in_table).map((field) => field.name),
		filters: [],
		sort: [],
		breaks: [],
		highlights: [],
		aggregates: [],
		page_size: 50,
		view: 'report',
		group_by: null,
		pivot: null,
		chart: null,
		computations: [],
		widths: {},
		frozen: null
	};
}

/** One checkbox choice of a select/toggle facet, with its `_distinct` count. */
export type FacetCount = { value: string; label: string; count: number };

/** Counts per facet field name. */
export type FacetCounts = Record<string, FacetCount[]>;
