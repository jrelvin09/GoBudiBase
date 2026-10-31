import { describe, expect, it } from 'vitest';
import {
	RESOURCE_LIST_REGION,
	validatePageDefinition,
	type PageDefinition
} from './page-definition';

const validPage: PageDefinition = {
	id: 'sales.customer',
	title: 'Customers',
	regions: [{ id: 'customer-list', type: RESOURCE_LIST_REGION, resourceId: 'sales.customer' }]
};

describe('validatePageDefinition', () => {
	it('menerima definisi valid dan mengembalikan salinan yang bisa diserialisasi', () => {
		const result = validatePageDefinition(validPage);
		expect(result).toEqual({ ok: true, page: validPage });
		if (!result.ok) return;
		// Round-trip JSON gagal bila ada fungsi/undefined di dalam hasil.
		expect(JSON.parse(JSON.stringify(result.page))).toEqual(result.page);
	});

	it('menerima beberapa region dengan id berbeda', () => {
		const result = validatePageDefinition({
			...validPage,
			regions: [
				{ id: 'a', type: RESOURCE_LIST_REGION, resourceId: 'sales.customer' },
				{ id: 'b', type: RESOURCE_LIST_REGION, resourceId: 'sales.order' }
			]
		});
		expect(result.ok).toBe(true);
	});

	it('mengabaikan properti tambahan (hanya field yang dikenal yang dikembalikan)', () => {
		const result = validatePageDefinition({ ...validPage, sql: 'SELECT 1', component: () => null });
		expect(result).toEqual({ ok: true, page: validPage });
	});

	it.each([
		['bukan objek', null],
		['string', 'page'],
		['angka', 42],
		['array', []]
	])('menolak input %s dengan kode invalid_page', (_name, input) => {
		expect(validatePageDefinition(input)).toEqual({
			ok: false,
			issues: [{ location: 'page', code: 'invalid_page' }]
		});
	});

	it.each([
		['id hilang', { title: 'T', regions: validPage.regions }],
		['id kosong', { id: '', title: 'T', regions: validPage.regions }],
		['id huruf besar', { id: 'Sales.Customer', title: 'T', regions: validPage.regions }],
		['id berisi spasi', { id: 'sales customer', title: 'T', regions: validPage.regions }]
	])('menolak page dengan %s', (_name, input) => {
		expect(validatePageDefinition(input)).toEqual({
			ok: false,
			issues: [{ location: 'page', code: 'invalid_id' }]
		});
	});

	it.each([
		['judul kosong', ''],
		['judul hanya spasi', '   '],
		['judul terlalu panjang', 'x'.repeat(201)]
	])('menolak page dengan %s', (_name, title) => {
		expect(validatePageDefinition({ ...validPage, title })).toEqual({
			ok: false,
			issues: [{ location: 'page', code: 'invalid_title' }]
		});
	});

	it.each([
		['bukan array', 'nope'],
		['array kosong', []]
	])('menolak regions %s', (_name, regions) => {
		expect(validatePageDefinition({ ...validPage, regions })).toEqual({
			ok: false,
			issues: [{ location: 'page', code: 'invalid_regions' }]
		});
	});

	it('menunjuk region lewat posisi bila id region tidak bisa dipakai', () => {
		expect(validatePageDefinition({ ...validPage, regions: ['bukan objek'] })).toEqual({
			ok: false,
			issues: [{ location: '#0', code: 'invalid_region' }]
		});
	});

	it('menolak id region duplikat dan menunjuk region kedua', () => {
		const result = validatePageDefinition({
			...validPage,
			regions: [
				{ id: 'list', type: RESOURCE_LIST_REGION, resourceId: 'sales.customer' },
				{ id: 'list', type: RESOURCE_LIST_REGION, resourceId: 'sales.order' }
			]
		});
		expect(result).toEqual({ ok: false, issues: [{ location: 'list', code: 'duplicate_id' }] });
	});

	it.each([
		['id region tidak valid', { id: 'Customer List', type: RESOURCE_LIST_REGION, resourceId: 'sales.customer' }, '#0'],
		['tipe tidak dikenal', { id: 'list', type: 'chart-widget', resourceId: 'sales.customer' }, 'list'],
		['tipe hilang', { id: 'list', resourceId: 'sales.customer' }, 'list'],
		['resourceId kosong', { id: 'list', type: RESOURCE_LIST_REGION, resourceId: '' }, 'list'],
		['resourceId bukan string', { id: 'list', type: RESOURCE_LIST_REGION, resourceId: 7 }, 'list'],
		['resourceId berisi spasi', { id: 'list', type: RESOURCE_LIST_REGION, resourceId: 'sales customer' }, 'list']
	])('menolak region dengan %s', (_name, region, location) => {
		const result = validatePageDefinition({ ...validPage, regions: [region] });
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.issues).toHaveLength(1);
		expect(result.issues[0].location).toBe(location);
	});

	it('mengumpulkan semua masalah dalam satu lintasan dengan urutan tetap', () => {
		const input = {
			id: 'Bad Id',
			title: '',
			regions: [
				{ id: 'a', type: 'nope', resourceId: '' },
				{ id: 'b', type: RESOURCE_LIST_REGION, resourceId: 'sales.customer' },
				{ id: 'a', type: RESOURCE_LIST_REGION, resourceId: 'sales.customer' }
			]
		};
		const first = validatePageDefinition(input);
		const second = validatePageDefinition(input);
		expect(first).toEqual(second);
		expect(first).toEqual({
			ok: false,
			issues: [
				{ location: 'page', code: 'invalid_id' },
				{ location: 'page', code: 'invalid_title' },
				{ location: 'a', code: 'unknown_type' },
				{ location: 'a', code: 'invalid_resource' },
				{ location: 'a', code: 'duplicate_id' }
			]
		});
	});

describe('region resource-form (M7)', () => {
	const form = (extra: Record<string, unknown>) => ({
		id: 'p',
		title: 'Customers',
		regions: [{ id: 'f', type: 'resource-form', resourceId: 'sales.customer', ...extra }]
	});

	it('menerima mode create dan edit', () => {
		for (const mode of ['create', 'edit']) {
			const result = validatePageDefinition(form({ mode }));
			expect(result.ok).toBe(true);
			if (result.ok) expect(result.page.regions[0].mode).toBe(mode);
		}
	});

	it('menolak mode hilang atau tidak dikenal, dan props liar tidak ikut', () => {
		for (const extra of [{}, { mode: 'delete' }, { mode: 7 }]) {
			const result = validatePageDefinition(form(extra));
			expect(result.ok).toBe(false);
			if (!result.ok) expect(result.issues).toEqual([{ location: 'f', code: 'invalid_mode' }]);
		}
		const withJunk = validatePageDefinition(form({ mode: 'edit', recordId: 'x', sql: 'DROP' }));
		expect(withJunk.ok && JSON.stringify(withJunk.page)).not.toMatch(/recordId|DROP/);
	});

	it('mode pada region non-form ditolak', () => {
		const result = validatePageDefinition({
			id: 'p',
			title: 'T',
			regions: [{ id: 'l', type: 'resource-list', resourceId: 'sales.customer', mode: 'edit' }]
		});
		expect(result.ok).toBe(false);
	});
});
});

describe('region fields (B010)', () => {
	const base = (region: Record<string, unknown>) => ({
		id: 'sales.customer',
		title: 'Customers',
		regions: [{ id: 'a', type: 'resource-list', resourceId: 'sales.customer', ...region }]
	});

	it('menerima fields valid pada resource-list dan menjaga urutan', () => {
		const result = validatePageDefinition(base({ fields: ['name', 'code'] }));
		expect(result.ok && result.page.regions[0].fields).toEqual(['name', 'code']);
	});

	it('draft lama tanpa fields tetap valid dan tidak mendapat properti fields', () => {
		const result = validatePageDefinition(base({}));
		expect(result.ok && 'fields' in result.page.regions[0]).toBe(false);
	});

	it('menerima fields pada resource-form (P6) tetapi menolak pada tipe lain', () => {
		const result = validatePageDefinition(base({ type: 'resource-form', mode: 'create', fields: ['name'] }));
		expect(result.ok && result.page.regions[0].fields).toEqual(['name']);
	});

	it('menolak duplikat, bentuk salah, kosong, dan lebih dari 50', () => {
		const code = (fields: unknown) => {
			const r = validatePageDefinition(base({ fields }));
			return r.ok ? 'ok' : r.issues[0].code;
		};
		expect(code(['name', 'name'])).toBe('duplicate_field');
		expect(code(['Name'])).toBe('invalid_fields');
		expect(code(['a; DROP'])).toBe('invalid_fields');
		expect(code([])).toBe('invalid_fields');
		expect(code(Array.from({ length: 51 }, (_, i) => `f${i}`))).toBe('invalid_fields');
	});

	it('round-trip JSON identik', () => {
		const def = base({ fields: ['code', 'name'] });
		const first = validatePageDefinition(def);
		expect(first.ok).toBe(true);
		if (first.ok) expect(validatePageDefinition(JSON.parse(JSON.stringify(first.page)))).toEqual(first);
	});
});

describe('region sort and pageSize (D001)', () => {
	const base = (region: Record<string, unknown>) => ({
		id: 'sales.customer',
		title: 'Customers',
		regions: [{ id: 'a', type: 'resource-list', resourceId: 'sales.customer', ...region }]
	});
	const code = (region: Record<string, unknown>) => {
		const r = validatePageDefinition(base(region));
		return r.ok ? 'ok' : r.issues[0].code;
	};

	it('menerima sort dan pageSize valid dan membawanya', () => {
		const r = validatePageDefinition(base({ sort: { field: 'name', dir: 'desc' }, pageSize: 25 }));
		expect(r.ok && r.page.regions[0].sort).toEqual({ field: 'name', dir: 'desc' });
		expect(r.ok && r.page.regions[0].pageSize).toBe(25);
	});

	it('draft lama tanpa properti baru tetap valid dan bersih', () => {
		const r = validatePageDefinition(base({}));
		expect(r.ok && 'sort' in r.page.regions[0]).toBe(false);
		expect(r.ok && 'pageSize' in r.page.regions[0]).toBe(false);
	});

	it('menolak dir, field, dan pageSize yang salah', () => {
		expect(code({ sort: { field: 'name', dir: 'up' } })).toBe('invalid_sort');
		expect(code({ sort: { field: 'Name;', dir: 'asc' } })).toBe('invalid_sort');
		expect(code({ sort: 'name' })).toBe('invalid_sort');
		expect(code({ pageSize: 7 })).toBe('invalid_page_size');
		expect(code({ pageSize: '25' })).toBe('invalid_page_size');
	});

	it('menolak sort dan pageSize pada resource-form', () => {
		expect(code({ type: 'resource-form', mode: 'create', pageSize: 10 })).toBe('invalid_binding');
		expect(code({ type: 'resource-form', mode: 'create', sort: { field: 'name', dir: 'asc' } })).toBe(
			'invalid_binding'
		);
	});
});

describe('region filters (D005)', () => {
	const base = (region: Record<string, unknown>) => ({
		id: 'sales.customer',
		title: 'Customers',
		regions: [{ id: 'a', type: 'resource-list', resourceId: 'sales.customer', ...region }]
	});
	const code = (region: Record<string, unknown>) => {
		const r = validatePageDefinition(base(region));
		return r.ok ? 'ok' : r.issues[0].code;
	};
	const f = (over: Record<string, unknown> = {}) => ({ field: 'tier', op: 'eq', value: 'gold', ...over });

	it('menerima filter eq valid dan membawanya', () => {
		const r = validatePageDefinition(base({ filters: [f()] }));
		expect(r.ok && r.page.regions[0].filters).toEqual([{ field: 'tier', op: 'eq', value: 'gold' }]);
	});

	it('menolak op selain eq, nilai kosong atau terlalu panjang, field salah bentuk', () => {
		expect(code({ filters: [f({ op: 'like' })] })).toBe('invalid_filter');
		expect(code({ filters: [f({ value: '' })] })).toBe('invalid_filter');
		expect(code({ filters: [f({ value: 'x'.repeat(129) })] })).toBe('invalid_filter');
		expect(code({ filters: [f({ field: 'Tier;' })] })).toBe('invalid_filter');
		expect(code({ filters: [] })).toBe('invalid_filter');
	});

	it('menolak lebih dari 5 filter', () => {
		expect(code({ filters: Array.from({ length: 6 }, () => f()) })).toBe('too_many_filters');
		expect(code({ filters: Array.from({ length: 5 }, () => f()) })).toBe('ok');
	});

	it('menolak filters pada resource-form dan draft lama tetap bersih', () => {
		expect(code({ type: 'resource-form', mode: 'create', filters: [f()] })).toBe('invalid_filter');
		const r = validatePageDefinition(base({}));
		expect(r.ok && 'filters' in r.page.regions[0]).toBe(false);
	});
});

describe('region rowAction (D009)', () => {
	const base = (region: Record<string, unknown>) => ({
		id: 'sales.customer',
		title: 'Customers',
		regions: [{ id: 'a', type: 'resource-list', resourceId: 'sales.customer', ...region }]
	});
	const code = (region: Record<string, unknown>) => {
		const r = validatePageDefinition(base(region));
		return r.ok ? 'ok' : r.issues[0].code;
	};

	it('menerima edit dan none serta membawanya', () => {
		const r = validatePageDefinition(base({ rowAction: 'none' }));
		expect(r.ok && r.page.regions[0].rowAction).toBe('none');
		expect(code({ rowAction: 'edit' })).toBe('ok');
	});

	it('menolak nilai lain dan tipe form; draft lama tetap bersih', () => {
		expect(code({ rowAction: 'delete' })).toBe('invalid_row_action');
		expect(code({ type: 'resource-form', mode: 'create', rowAction: 'none' })).toBe('invalid_row_action');
		const r = validatePageDefinition(base({}));
		expect(r.ok && 'rowAction' in r.page.regions[0]).toBe(false);
	});
});

describe('page items (P4)', () => {
	const item = (over: Record<string, unknown> = {}) => ({
		id: 'P10_STATUS',
		type: 'select',
		label: 'Status',
		options: ['open', 'closed'],
		default: 'open',
		source: { query: 'status' },
		...over
	});
	const page = (items: unknown, filterValue = ':P10_STATUS') => ({
		id: 'sales.customer',
		title: 'Customers',
		...(items === undefined ? {} : { items }),
		regions: [
			{
				id: 'a',
				type: 'resource-list',
				resourceId: 'sales.customer',
				filters: [{ field: 'tier', op: 'eq', value: filterValue }]
			}
		]
	});
	const code = (p: unknown) => {
		const r = validatePageDefinition(p);
		return r.ok ? 'ok' : r.issues[0].code;
	};

	it('menerima item valid dan filter yang merujuknya', () => {
		const r = validatePageDefinition(page([item()]));
		expect(r.ok && r.page.items?.[0].id).toBe('P10_STATUS');
	});

	it('menolak referensi item yang tidak dideklarasikan', () => {
		expect(code(page(undefined))).toBe('unknown_item_ref');
		expect(code(page([item({ id: 'P20_OTHER' })]))).toBe('unknown_item_ref');
		expect(code(page(undefined, 'gold'))).toBe('ok');
	});

	it('menolak id, tipe, opsi, default, dan source yang salah', () => {
		for (const bad of [
			{ id: 'status' },
			{ type: 'html' },
			{ options: undefined },
			{ default: 'archived' },
			{ type: 'text', options: ['a'] },
			{ source: { query: 'Bad Name' } },
			{ label: '' }
		]) {
			expect(code(page([item(bad)], 'gold')), JSON.stringify(bad)).toBe('invalid_item');
		}
		expect(code(page([item({ type: 'switch', options: undefined, default: 'maybe' })], 'gold'))).toBe('invalid_item');
	});

	it('menolak duplikat id, daftar kosong, dan lebih dari 30', () => {
		expect(code(page([item(), item()], 'gold'))).toBe('duplicate_id');
		expect(code(page([], 'gold'))).toBe('invalid_items');
		const many = Array.from({ length: 31 }, (_, i) => item({ id: `P${i}_X` }));
		expect(code(page(many, 'gold'))).toBe('invalid_items');
	});

	it('draft lama tanpa items tetap bersih', () => {
		const r = validatePageDefinition(page(undefined, 'gold'));
		expect(r.ok && 'items' in r.page).toBe(false);
	});
});

describe('kpi region (dashboard)', () => {
	const base = (region: Record<string, unknown>) => ({
		id: 'sales.customer',
		title: 'Customers',
		regions: [{ id: 'k', type: 'kpi', resourceId: 'sales.customer', ...region }]
	});
	const code = (region: Record<string, unknown>) => {
		const r = validatePageDefinition(base(region));
		return r.ok ? 'ok' : r.issues[0].code;
	};

	it('menerima count tanpa field dan sum dengan field, plus filter statis', () => {
		expect(code({ metric: { fn: 'count' } })).toBe('ok');
		expect(code({ metric: { fn: 'sum', field: 'credit_limit' }, filters: [{ field: 'tier', op: 'eq', value: 'gold' }] })).toBe('ok');
	});

	it('menolak metrik hilang, fungsi liar, sum tanpa field, dan metrik pada tipe lain', () => {
		expect(code({})).toBe('invalid_metric');
		expect(code({ metric: { fn: 'median', field: 'x' } })).toBe('invalid_metric');
		expect(code({ metric: { fn: 'sum' } })).toBe('invalid_metric');
		expect(code({ metric: { fn: 'sum', field: 'Bad;' } })).toBe('invalid_metric');
		expect(code({ type: 'resource-list', metric: { fn: 'count' } })).toBe('invalid_metric');
	});
});

describe('context refs in filters', () => {
	const page = (value: string) => ({
		id: 'sales.customer',
		title: 'C',
		regions: [{ id: 'a', type: 'resource-list', resourceId: 'sales.customer', filters: [{ field: 'tier', op: 'eq', value }] }]
	});
	it('menerima variabel konteks yang dikenal dan menolak yang liar', () => {
		for (const ok of [':user.id', ':company.id', ':location.id', ':route.resource']) expect(validatePageDefinition(page(ok)).ok, ok).toBe(true);
		for (const bad of [':user.password', ':evil', ':route.Bad', ':userXid']) expect(validatePageDefinition(page(bad)).ok, bad).toBe(false);
	});
});

describe('onSubmit process (F001)', () => {
	const form = (over: Record<string, unknown>) => ({
		id: 'sales.customer',
		title: 'C',
		regions: [{ id: 'f', type: 'resource-form', resourceId: 'sales.customer', mode: 'create', ...over }]
	});
	const ok = (over: Record<string, unknown>) => validatePageDefinition(form(over)).ok;
	it('menerima urutan sah dan menolak yang liar', () => {
		expect(ok({ onSubmit: ['validate', 'resource.create', 'audit'] })).toBe(true);
		expect(ok({ onSubmit: ['resource.create'] })).toBe(true);
		for (const bad of [['drop.table'], ['validate'], ['audit', 'resource.create'], ['resource.create', 'validate'], ['resource.create', 'resource.create'], []]) {
			expect(ok({ onSubmit: bad }), JSON.stringify(bad)).toBe(false);
		}
		expect(ok({ mode: 'edit', onSubmit: ['resource.create'] })).toBe(false);
		expect(validatePageDefinition({ id: 'sales.customer', title: 'C', regions: [{ id: 'l', type: 'resource-list', resourceId: 'sales.customer', onSubmit: ['resource.create'] }] }).ok).toBe(false);
	});
});
