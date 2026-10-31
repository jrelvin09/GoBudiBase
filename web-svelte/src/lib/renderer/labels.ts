import type { AdminContext } from '$lib/api/client';
import { labels as fetchLabels } from '$lib/api/resources';
import type { ResourceMeta } from '$lib/api/resource-types';

// Relation labels for the list regions (F2-07): one `_labels` call per
// belongs_to field that actually has an id on the page.

export type LabelMap = Record<string, Record<string, string>>;

const CHUNK = 100;

/** Unique, non-empty ids per belongs_to field (the server accepts 100 per call). */
export function relationIds(
	meta: ResourceMeta,
	rows: Record<string, unknown>[]
): Record<string, string[]> {
	const out: Record<string, string[]> = {};
	for (const field of meta.fields) {
		if (field.type !== 'belongs_to') continue;
		const ids = new Set<string>();
		for (const row of rows) {
			const value = row[field.name];
			if (value === null || value === undefined || value === '') continue;
			ids.add(String(value));
		}
		if (ids.size > 0) out[field.name] = [...ids];
	}
	return out;
}

export async function resolveLabels(
	ctx: AdminContext,
	meta: ResourceMeta,
	rows: Record<string, unknown>[]
): Promise<LabelMap> {
	const grouped = relationIds(meta, rows);
	const result: LabelMap = {};
	await Promise.all(
		Object.entries(grouped).map(async ([field, ids]) => {
			const merged: Record<string, string> = {};
			for (let i = 0; i < ids.length; i += CHUNK) {
				try {
					const resp = await fetchLabels(ctx, meta.id, field, ids.slice(i, i + CHUNK));
					Object.assign(merged, resp.data.labels);
				} catch {
					// A label that cannot be read becomes — in the cell.
				}
			}
			result[field] = merged;
		})
	);
	return result;
}
