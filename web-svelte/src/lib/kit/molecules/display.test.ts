import { afterEach, describe, expect, it } from 'vitest';
import { setLocale } from '$lib/i18n/index.svelte';
import { displayText } from './display';

afterEach(() => setLocale('id'));

const options = [
	{ value: 'draft', label: 'Draft' },
	{ value: 'active', label: 'Active' }
];

describe('displayText', () => {
	it('text apa adanya', () => {
		expect(displayText('text', 'hello')).toBe('hello');
	});

	it('textarea apa adanya', () => {
		expect(displayText('textarea', 'line 1\nline 2')).toBe('line 1\nline 2');
	});

	it('email apa adanya', () => {
		expect(displayText('email', 'a@b.test')).toBe('a@b.test');
	});

	it('number lewat formatNumber (locale id)', () => {
		setLocale('id');
		expect(displayText('number', 1234.5)).toBe('1.234,5');
	});

	it('date lewat formatDate', () => {
		setLocale('id');
		expect(displayText('date', '2026-09-26')).toContain('2026');
	});

	it('toggle true → Ya', () => {
		setLocale('id');
		expect(displayText('toggle', true)).toBe('Ya');
	});

	it('toggle false → Tidak', () => {
		setLocale('id');
		expect(displayText('toggle', false)).toBe('Tidak');
	});

	it('select → label opsi', () => {
		expect(displayText('select', 'active', options)).toBe('Active');
	});

	it('select tanpa opsi cocok → nilai mentah', () => {
		expect(displayText('select', 'unknown', options)).toBe('unknown');
	});

	it('null/kosong → string kosong', () => {
		expect(displayText('text', null)).toBe('');
		expect(displayText('number', null)).toBe('');
	});
});
