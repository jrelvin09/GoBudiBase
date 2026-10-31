/**
 * Komponen bersama pada runtime (P7): data source mengisi binding region yang
 * tidak diatur sendiri, LOV memasok opsi item select, skema otorisasi
 * menyembunyikan region. Semuanya presentasi; izin data tetap di server.
 */
import type { SharedRuntime } from '$lib/api/resources';
import type { PageItem, RegionDefinition } from './page-definition';

export type OptionPair = { value: string; label: string };

/** Region dengan binding dari data source; milik region menang, resource harus sama. */
export function applyDatasource(region: RegionDefinition, shared?: SharedRuntime): RegionDefinition {
	const ds = region.datasource ? shared?.datasource[region.datasource] : undefined;
	if (!ds || ds.resourceId !== region.resourceId) return region;
	return {
		...region,
		fields: region.fields ?? ds.fields,
		sort: region.sort ?? ds.sort,
		pageSize: region.pageSize ?? ds.pageSize,
		filters: region.filters ?? ds.filters
	};
}

/** Opsi item select: dari LOV bersama bila ada, selain itu dari `options`. */
export function itemOptions(item: PageItem, shared?: SharedRuntime): OptionPair[] {
	if (item.lov) return shared?.lov[item.lov] ?? [];
	return (item.options ?? []).map((o) => ({ value: o, label: o }));
}

/** Region tanpa skema selalu tampil; dengan skema hanya bila server menyatakan boleh. */
export function regionAllowed(region: RegionDefinition, shared?: SharedRuntime): boolean {
	return !region.auth || shared?.auth[region.auth] === true;
}
