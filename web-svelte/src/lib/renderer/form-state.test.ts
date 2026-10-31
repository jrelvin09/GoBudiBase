import { describe, expect, it } from 'vitest';
import type { ResourceMeta } from '$lib/api/resource-types';
import { changedFields, clientValidate, initialValues, serverErrorsToMap } from './form-state';

const meta: ResourceMeta = {
	id: 'sales.customer',
	label: 'Customer',
	plural: 'Customers',
	nav_order: 10,
	title_field: 'name',
	list_view: 'report',
	form_mode: 'page',
	capabilities: {},
	fields: [
		{ name: 'code', type: 'text', label: 'Code', required: true, max_length: 8, in_table: true },
		{ name: 'name', type: 'text', label: 'Name', required: true, in_table: true },
		{ name: 'credit_limit', type: 'number', label: 'Credit', required: false, min: 0, max: 100, in_table: true },
		{ name: 'tier', type: 'select', label: 'Tier', required: false, default: 'regular', in_table: true },
		{ name: 'active', type: 'toggle', label: 'Active', required: false, in_table: true },
		{ name: 'is_vip', type: 'toggle', label: 'VIP', required: false, default: true, in_table: true }
	]
};

describe('initialValues', () => {
	it('memakai default bila ada, selain itu null, toggle bernilai boolean', () => {
		expect(initialValues(meta)).toEqual({
			code: null,
			name: null,
			credit_limit: null,
			tier: 'regular',
			active: false,
			is_vip: true
		});
	});
});

describe('clientValidate', () => {
	it('required kosong → kit.item.required_value', () => {
		expect(clientValidate(meta, { code: '', name: null })).toMatchObject({
			code: 'kit.item.required_value',
			name: 'kit.item.required_value'
		});
	});

	it('max_length', () => {
		expect(clientValidate(meta, { code: '123456789', name: 'x' })).toMatchObject({
			code: 'kit.item.max_length'
		});
	});

	it('min angka', () => {
		expect(clientValidate(meta, { code: 'A', name: 'x', credit_limit: -1 })).toMatchObject({
			credit_limit: 'kit.item.min_value'
		});
	});

	it('max angka', () => {
		expect(clientValidate(meta, { code: 'A', name: 'x', credit_limit: 101 })).toMatchObject({
			credit_limit: 'kit.item.max_value'
		});
	});

	it('nilai valid → tanpa error', () => {
		expect(clientValidate(meta, { code: 'A', name: 'x', credit_limit: 50 })).toEqual({});
	});
});

describe('changedFields', () => {
	it('hanya field yang berubah', () => {
		expect(changedFields({ a: 1, b: 2 }, { a: 1, b: 3 })).toEqual(['b']);
	});

	it('null dan undefined dianggap sama', () => {
		expect(changedFields({ a: null }, { a: undefined })).toEqual([]);
	});

	it('tanpa perubahan → kosong', () => {
		expect(changedFields({ a: 'x' }, { a: 'x' })).toEqual([]);
	});
});

describe('serverErrorsToMap', () => {
	it('memakai kunci field', () => {
		expect(serverErrorsToMap([{ field: 'code', message: 'Taken' }])).toEqual({ code: 'Taken' });
	});

	it('mundur ke path', () => {
		expect(serverErrorsToMap([{ path: 'name', message: 'Invalid' }])).toEqual({ name: 'Invalid' });
	});
});
