import { describe, expect, it } from 'vitest';
import type { SharedRuntime } from '$lib/api/resources';
import type { PageItem, RegionDefinition } from './page-definition';
import { applyDatasource, itemOptions, regionAllowed } from './shared';

const shared: SharedRuntime = {
	lov: { tiers: [{ value: 'gold', label: 'Gold' }] },
	datasource: { gold: { resourceId: 'sales.customer', fields: ['name'], pageSize: 10, filters: [{ field: 'tier', op: 'eq', value: 'gold' }] } },
	auth: { yes: true, no: false },
	navigation: []
};
const region = (extra: Partial<RegionDefinition> = {}): RegionDefinition => ({ id: 'a', type: 'ir-report', resourceId: 'sales.customer', ...extra });

describe('komponen bersama di runtime', () => {
	it('data source mengisi yang kosong; milik region menang; resource beda diabaikan', () => {
		expect(applyDatasource(region({ datasource: 'gold' }), shared)).toMatchObject({ fields: ['name'], pageSize: 10 });
		expect(applyDatasource(region({ datasource: 'gold', pageSize: 50 }), shared).pageSize).toBe(50);
		expect(applyDatasource(region({ datasource: 'gold', resourceId: 'sales.order' }), shared).fields).toBeUndefined();
		expect(applyDatasource(region({ datasource: 'missing' }), shared).fields).toBeUndefined();
		expect(applyDatasource(region(), undefined).fields).toBeUndefined();
	});

	it('opsi dari LOV atau options', () => {
		const lov: PageItem = { id: 'P1_T', type: 'select', label: 'T', lov: 'tiers' };
		expect(itemOptions(lov, shared)).toEqual([{ value: 'gold', label: 'Gold' }]);
		expect(itemOptions(lov, undefined)).toEqual([]);
		expect(itemOptions({ id: 'P1_T', type: 'select', label: 'T', options: ['a'] })).toEqual([{ value: 'a', label: 'a' }]);
	});

	it('skema otorisasi: tanpa skema tampil, skema ditolak/tak dikenal/belum dimuat disembunyikan', () => {
		expect(regionAllowed(region(), undefined)).toBe(true);
		expect(regionAllowed(region({ auth: 'yes' }), shared)).toBe(true);
		expect(regionAllowed(region({ auth: 'no' }), shared)).toBe(false);
		expect(regionAllowed(region({ auth: 'ghost' }), shared)).toBe(false);
		expect(regionAllowed(region({ auth: 'yes' }), undefined)).toBe(false);
	});
});
