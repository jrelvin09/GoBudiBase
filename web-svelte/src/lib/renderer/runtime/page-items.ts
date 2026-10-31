import { CONTEXT_REF_PATTERN, ITEM_REF_PATTERN, type PageItem, type RegionFilter } from './page-definition';

export type ItemValues = Record<string, string>;

function valid(item: PageItem, value: string): boolean {
	if (value.length > 128) return false;
	if (item.type === 'select') return item.lov ? value.length >= 1 && value.length <= 64 : (item.options?.includes(value) ?? false);
	if (item.type === 'switch') return value === 'true' || value === 'false';
	if (item.type === 'date') return /^\d{4}-\d{2}-\d{2}$/.test(value);
	return true;
}

/**
 * Nilai awal item (P4): URL hanya lewat `source.query` yang dideklarasikan dan
 * nilainya harus sah menurut tipe item; selain itu `default`, selain itu kosong.
 * Query yang tidak dideklarasikan diabaikan. Hanya memori, tanpa penyimpanan.
 */
export function initialItemValues(items: readonly PageItem[] | undefined, query?: URLSearchParams): ItemValues {
	const values: ItemValues = {};
	for (const item of items ?? []) {
		const fromUrl = item.source ? query?.get(item.source.query) : null;
		if (fromUrl && valid(item, fromUrl)) values[item.id] = fromUrl;
		else values[item.id] = item.default ?? '';
	}
	return values;
}

/**
 * Mengganti `:P10_X` pada nilai filter dengan nilai item saat ini. Filter
 * yang merujuk item kosong dibuang (tidak menyaring). Nilai literal tetap.
 */
export function resolveFilters(
	filters: readonly RegionFilter[] | undefined,
	values: ItemValues,
	context: Record<string, string> = {}
): RegionFilter[] | undefined {
	if (!filters) return undefined;
	const out: RegionFilter[] = [];
	for (const filter of filters) {
		if (CONTEXT_REF_PATTERN.test(filter.value)) {
			const known = context[filter.value.slice(1)];
			if (known) out.push({ ...filter, value: known });
			continue;
		}
		if (!ITEM_REF_PATTERN.test(filter.value)) {
			out.push(filter);
			continue;
		}
		const current = values[filter.value.slice(1)];
		if (current) out.push({ ...filter, value: current });
	}
	return out;
}
