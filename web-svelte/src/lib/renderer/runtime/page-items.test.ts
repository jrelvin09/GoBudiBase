import { describe, expect, it } from 'vitest';
import { initialItemValues, resolveFilters } from './page-items';
import type { PageItem } from './page-definition';

const items: PageItem[] = [
	{ id: 'P1_STATUS', type: 'select', label: 'S', options: ['open', 'closed'], default: 'open', source: { query: 'status' } },
	{ id: 'P1_FLAG', type: 'switch', label: 'F', source: { query: 'flag' } },
	{ id: 'P1_NOTE', type: 'text', label: 'N' }
];

describe('initialItemValues (P4)', () => {
	it('memakai default bila tidak ada query', () => {
		expect(initialItemValues(items, new URLSearchParams())).toEqual({ P1_STATUS: 'open', P1_FLAG: '', P1_NOTE: '' });
	});

	it('mengisi dari query yang dideklarasikan dan sah', () => {
		const v = initialItemValues(items, new URLSearchParams('status=closed&flag=true'));
		expect(v.P1_STATUS).toBe('closed');
		expect(v.P1_FLAG).toBe('true');
	});

	it('menolak nilai tak sah dan mengabaikan query tak dideklarasikan', () => {
		const v = initialItemValues(items, new URLSearchParams('status=hacked&flag=maybe&note=zzz'));
		expect(v.P1_STATUS).toBe('open');
		expect(v.P1_FLAG).toBe('');
		expect(v.P1_NOTE).toBe('');
	});

	it('tanpa items mengembalikan objek kosong', () => {
		expect(initialItemValues(undefined)).toEqual({});
	});
});

describe('resolveFilters (P4)', () => {
	const f = (value: string) => ({ field: 'status', op: 'eq' as const, value });

	it('mengganti referensi dengan nilai item dan membiarkan literal', () => {
		expect(resolveFilters([f(':P1_STATUS'), f('gold')], { P1_STATUS: 'closed' })).toEqual([f('closed'), f('gold')]);
	});

	it('membuang filter yang merujuk item kosong dan tidak memutasi input', () => {
		const input = [f(':P1_STATUS')];
		expect(resolveFilters(input, { P1_STATUS: '' })).toEqual([]);
		expect(input[0].value).toBe(':P1_STATUS');
	});

	it('undefined tetap undefined', () => {
		expect(resolveFilters(undefined, {})).toBeUndefined();
	});
});

describe('context refs (P4 konteks)', () => {
	const f = (value: string) => ({ field: 'owner', op: 'eq' as const, value });
	it('mengganti :user.id/:company.id dengan konteks tepercaya dan membuang bila kosong', () => {
		expect(resolveFilters([f(':user.id')], {}, { 'user.id': 'u1' })).toEqual([f('u1')]);
		expect(resolveFilters([f(':company.id')], {}, { 'company.id': '' })).toEqual([]);
		expect(resolveFilters([f(':route.resource')], {}, { 'route.resource': 'sales.customer' })).toEqual([f('sales.customer')]);
	});
});
