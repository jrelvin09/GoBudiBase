import { describe, expect, it } from 'vitest';
import type { ResourceMeta } from '$lib/api/resource-types';
import type { FieldMeta } from '$lib/kit/fields/types';
import { chartSample, formFields, kpiSample, sampleCell, tableFields } from './sample';

const f = (name: string, type: FieldMeta['type'], extra: Partial<FieldMeta> = {}): FieldMeta => ({
	name,
	type,
	label: name.toUpperCase(),
	required: false,
	in_table: true,
	...extra
});
const meta = {
	id: 'sales.customer',
	fields: [
		f('code', 'text'),
		f('tier', 'select', { options: [{ value: 'gold', label: 'Gold' }, { value: 'regular', label: 'Regular' }] }),
		f('active', 'toggle'),
		f('notes', 'textarea', { in_table: false })
	]
} as unknown as ResourceMeta;

describe('data contoh kanvas', () => {
	it('sampleCell deterministik menurut tipe', () => {
		expect(sampleCell(meta.fields[0], 0)).toBe('CODE 1');
		expect(sampleCell(meta.fields[1], 0)).toBe('Gold');
		expect(sampleCell(meta.fields[1], 3)).toBe('Regular');
		expect(sampleCell(meta.fields[2], 1)).toBe('No');
		expect(sampleCell(f('qty', 'number'), 1)).toBe('2500');
		expect(sampleCell(f('mail', 'email'), 0)).toBe('user1@example.com');
		expect(sampleCell(f('d', 'date'), 1)).toBe('2026-10-02');
		expect(sampleCell(f('s', 'select'), 0)).toBe('S 1');
	});

	it('tableFields mengikuti fields terpilih berurutan, selain itu kolom tabel bawaan', () => {
		expect(tableFields({ fields: ['tier', 'code', 'nope'] }, meta).map((x) => x.name)).toEqual(['tier', 'code']);
		expect(tableFields({}, meta).map((x) => x.name)).toEqual(['code', 'tier', 'active']);
		expect(formFields({}, meta).map((x) => x.name)).toEqual(['code', 'tier', 'active', 'notes']);
		expect(formFields({ fields: ['notes'] }, meta).map((x) => x.name)).toEqual(['notes']);
	});

	it('chartSample memakai opsi select/toggle dan cadangan generik', () => {
		expect(chartSample({ groupBy: 'tier' }, meta).map((p) => p.label)).toEqual(['Gold', 'Regular']);
		expect(chartSample({ groupBy: 'active' }, meta).map((p) => p.label)).toEqual(['Yes', 'No']);
		expect(chartSample({ groupBy: 'code' }, meta).map((p) => p.label)).toEqual(['A', 'B', 'C']);
		expect(chartSample({}, meta)).toHaveLength(3);
	});

	it('kpiSample menurut fungsi agregat', () => {
		expect(kpiSample({ metric: { fn: 'count' } })).toBe('128');
		expect(kpiSample({ metric: { fn: 'sum', field: 'qty' } })).toBe('12,450');
		expect(kpiSample({})).toBe('128');
	});
});
