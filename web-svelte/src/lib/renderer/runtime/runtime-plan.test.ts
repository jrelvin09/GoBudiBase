import { describe, expect, it } from 'vitest';
import type { ResourceMeta } from '$lib/api/resource-types';
import { describeIssues, planPage, runtimeStatus } from './runtime-plan';

const page = {
	id: 'sales.customer',
	title: 'Customers',
	regions: [{ id: 'customer-list', type: 'resource-list', resourceId: 'sales.customer' }]
};

const meta: ResourceMeta = {
	id: 'sales.customer',
	label: 'Customer',
	plural: 'Customers',
	nav_order: 10,
	title_field: 'name',
	list_view: 'report',
	form_mode: 'page',
	fields: [],
	capabilities: { view: true }
};

function readyPlan(result: ReturnType<typeof planPage>) {
	if (result.state !== 'ready') throw new Error('expected a ready plan');
	return result;
}

describe('runtimeStatus', () => {
	it('memetakan idle/loading ke loading dan meneruskan ready/error', () => {
		expect(runtimeStatus('idle')).toBe('loading');
		expect(runtimeStatus('loading')).toBe('loading');
		expect(runtimeStatus('ready')).toBe('ready');
		expect(runtimeStatus('error')).toBe('error');
	});
});

describe('planPage', () => {
	it('merencanakan satu region valid dengan ResourceMeta yang cocok', () => {
		const plan = readyPlan(planPage(page, meta, 'ready'));
		expect(plan.regions).toHaveLength(1);
		expect(plan.regions[0]).toEqual({
			region: { id: 'customer-list', type: 'resource-list', resourceId: 'sales.customer' },
			phase: 'ready'
		});
	});

	it('menampilkan loading saat metadata belum siap', () => {
		expect(readyPlan(planPage(page, undefined, 'loading')).regions[0].phase).toBe('loading');
	});

	it('menampilkan tidak ditemukan saat metadata selesai tanpa resource itu', () => {
		expect(readyPlan(planPage(page, undefined, 'ready')).regions[0].phase).toBe('not_found');
	});

	it('menampilkan error saat pemuatan metadata gagal, bukan loading permanen', () => {
		expect(readyPlan(planPage(page, undefined, 'error')).regions[0].phase).toBe('error');
	});

	it('metadata yang sudah dimuat tetap dipakai walau pemuatan berikutnya gagal', () => {
		expect(readyPlan(planPage(page, meta, 'error')).regions[0].phase).toBe('ready');
	});

	it('tidak pernah mengikat ResourceMeta milik resource lain', () => {
		const other: ResourceMeta = { ...meta, id: 'sales.order', plural: 'Orders' };
		expect(readyPlan(planPage(page, other, 'ready')).regions[0].phase).toBe('not_found');
		expect(readyPlan(planPage(page, other, 'error')).regions[0].phase).toBe('not_found');
	});

	it('menolak page tidak valid tanpa menyusun region', () => {
		const plan = planPage({ id: 'x', title: '', regions: [] }, meta, 'ready');
		expect(plan.state).toBe('invalid');
		if (plan.state !== 'invalid') return;
		expect(plan.issues.length).toBeGreaterThan(0);
		expect(describeIssues(plan.issues)).toContain('page:invalid_title');
	});

	it('region dengan tipe di luar registry gagal sendiri, region lain tetap siap', () => {
		const twoRegions = {
			...page,
			regions: [
				{ id: 'a', type: 'resource-list', resourceId: 'sales.customer' },
				{ id: 'b', type: 'resource-list', resourceId: 'sales.customer' }
			]
		};
		// Registry hanya punya satu key pilot; lookup yang gagal tidak boleh menjatuhkan
		// seluruh halaman — region lain tetap dijadwalkan.
		const plan = readyPlan(planPage(twoRegions, meta, 'ready', (key) => (key === 'resource-list' ? {} : undefined)));
		expect(plan.regions.map((item) => item.phase)).toEqual(['ready', 'ready']);

		const missing = readyPlan(planPage(twoRegions, meta, 'ready', () => undefined));
		expect(missing.regions.map((item) => item.phase)).toEqual(['unknown_region', 'unknown_region']);
	});

	it('menjaga urutan dan key region', () => {
		const many = {
			...page,
			regions: [
				{ id: 'z', type: 'resource-list', resourceId: 'sales.customer' },
				{ id: 'a', type: 'resource-list', resourceId: 'sales.customer' }
			]
		};
		const plan = readyPlan(planPage(many, meta, 'ready'));
		expect(plan.regions.map((item) => item.region.id)).toEqual(['z', 'a']);
	});
});
