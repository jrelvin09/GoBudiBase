import type { PageDefinition, RegionDefinition } from './page-definition';

export type DefinitionChange = {
	/** `title`, `regions[<id>]`, `regions[<id>].<properti>`, atau `regions`. */
	path: string;
	kind: 'added' | 'removed' | 'changed' | 'reordered';
	from?: unknown;
	to?: unknown;
};

const REGION_KEYS: readonly (keyof RegionDefinition)[] = [
	'type',
	'resourceId',
	'mode',
	'fields',
	'sort',
	'pageSize',
	'filters',
	'rowAction',
	'rowItem',
	'datasource',
	'auth',
	'groupBy',
	'dateField',
	'text',
	'parent',
	'slot',
	'tabs',
	'title',
	'collapsible',
	'layout'
];

function same(a: unknown, b: unknown): boolean {
	return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

/**
 * Perbandingan dua definisi halaman (D011b). Region dicocokkan berdasar `id`,
 * bukan indeks; perubahan urutan yang tersisa dilaporkan `reordered`. Murni:
 * tidak memutasi masukan dan hasilnya berurutan tetap (judul, region lama,
 * region baru, urutan).
 */
export function diffDefinitions(a: PageDefinition, b: PageDefinition): DefinitionChange[] {
	const changes: DefinitionChange[] = [];
	if (a.title !== b.title) changes.push({ path: 'title', kind: 'changed', from: a.title, to: b.title });
	if (a.mode !== b.mode) changes.push({ path: 'mode', kind: a.mode === undefined ? 'added' : b.mode === undefined ? 'removed' : 'changed', from: a.mode, to: b.mode });

	const before = new Map(a.regions.map((r) => [r.id, r]));
	const after = new Map(b.regions.map((r) => [r.id, r]));

	for (const region of a.regions) {
		const next = after.get(region.id);
		if (!next) {
			changes.push({ path: `regions[${region.id}]`, kind: 'removed', from: region });
			continue;
		}
		for (const key of REGION_KEYS) {
			if (!same(region[key], next[key])) {
				const path = `regions[${region.id}].${key}`;
				const kind = region[key] === undefined ? 'added' : next[key] === undefined ? 'removed' : 'changed';
				changes.push({ path, kind, from: region[key], to: next[key] });
			}
		}
	}
	for (const region of b.regions) {
		if (!before.has(region.id)) changes.push({ path: `regions[${region.id}]`, kind: 'added', to: region });
	}

	const common = (list: RegionDefinition[], other: Map<string, RegionDefinition>) =>
		list.filter((r) => other.has(r.id)).map((r) => r.id);
	if (!same(common(a.regions, after), common(b.regions, before))) {
		changes.push({ path: 'regions', kind: 'reordered', from: common(a.regions, after), to: common(b.regions, before) });
	}
	return changes;
}
