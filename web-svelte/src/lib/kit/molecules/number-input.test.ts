import { afterEach, describe, expect, it } from 'vitest';
import { setLocale } from '$lib/i18n/index.svelte';
import { fromEditText, toEditText } from './number-input';

afterEach(() => setLocale('id'));

describe('toEditText', () => {
	it('null → teks kosong', () => {
		expect(toEditText(null)).toBe('');
	});

	it('id: tanpa pemisah ribuan, koma desimal', () => {
		setLocale('id');
		expect(toEditText(1234.5)).toBe('1234,5');
	});

	it('en: tanpa pemisah ribuan, titik desimal', () => {
		setLocale('en');
		expect(toEditText(1234.5)).toBe('1234.5');
	});
});

describe('fromEditText', () => {
	it('kosong → nilai null tanpa error', () => {
		expect(fromEditText('')).toEqual({ value: null, error: null });
	});

	it('id: 1234,5 → 1234.5', () => {
		setLocale('id');
		expect(fromEditText('1234,5')).toEqual({ value: 1234.5, error: null });
	});

	it('id: 1.234,5 (dengan pemisah ribuan) → 1234.5', () => {
		setLocale('id');
		expect(fromEditText('1.234,5')).toEqual({ value: 1234.5, error: null });
	});

	it('en: 1,234.5 → 1234.5', () => {
		setLocale('en');
		expect(fromEditText('1,234.5')).toEqual({ value: 1234.5, error: null });
	});

	it('teks bukan angka → invalid', () => {
		expect(fromEditText('abc')).toEqual({ value: null, error: 'invalid' });
	});

	it('di bawah min → error min', () => {
		expect(fromEditText('5', { min: 10 })).toEqual({ value: 5, error: 'min' });
	});

	it('di atas max → error max', () => {
		expect(fromEditText('15', { max: 10 })).toEqual({ value: 15, error: 'max' });
	});

	it('tepat di batas → tanpa error', () => {
		expect(fromEditText('10', { min: 10, max: 10 })).toEqual({ value: 10, error: null });
	});
});
