import { beforeEach, describe, expect, it } from 'vitest';
import { setLocale } from './index.svelte';
import { formatDate, formatDateTime, formatNumber, parseNumber } from './format';

describe('formatNumber', () => {
	beforeEach(() => setLocale('id'));

	it('null menjadi string kosong', () => {
		expect(formatNumber(null)).toBe('');
	});

	it('memakai pemisah locale id', () => {
		expect(formatNumber(1234.5)).toBe('1.234,5');
	});

	it('memakai pemisah locale en', () => {
		setLocale('en-US');
		expect(formatNumber(1234.5)).toBe('1,234.5');
	});

	it('menghormati jumlah desimal', () => {
		expect(formatNumber(1234.567, { decimals: 2 })).toBe('1.234,57');
	});
});

describe('parseNumber', () => {
	beforeEach(() => setLocale('id'));

	it('membaca format id 1.234,5 sebagai 1234.5', () => {
		expect(parseNumber('1.234,5')).toBe(1234.5);
	});

	it('membaca format en 1,234.5 sebagai 1234.5', () => {
		setLocale('en-US');
		expect(parseNumber('1,234.5')).toBe(1234.5);
	});

	it('mengabaikan spasi', () => {
		expect(parseNumber('  1 234,5 ')).toBe(1234.5);
	});

	it('string kosong menjadi null', () => {
		expect(parseNumber('')).toBeNull();
		expect(parseNumber('   ')).toBeNull();
	});

	it('teks tidak valid menjadi NaN', () => {
		expect(parseNumber('abc')).toBeNaN();
	});
});

describe('formatDate', () => {
	beforeEach(() => setLocale('id'));

	it('locale id memakai format medium', () => {
		expect(formatDate('2026-09-26')).toBe('26 Sep 2026');
	});

	it('locale en memakai format medium', () => {
		setLocale('en-US');
		expect(formatDate('2026-09-26')).toBe('Sep 26, 2026');
	});

	it('tidak bergeser satu hari di awal tahun', () => {
		expect(formatDate('2026-01-01')).toBe('1 Jan 2026');
	});

	it('null menjadi string kosong', () => {
		expect(formatDate(null)).toBe('');
	});
});

describe('formatDateTime', () => {
	beforeEach(() => setLocale('id'));

	it('menampilkan tanggal dan jam lokal', () => {
		expect(formatDateTime('2026-09-26T14:30:00')).toContain('26 Sep 2026');
	});

	it('null menjadi string kosong', () => {
		expect(formatDateTime(null)).toBe('');
	});
});

describe('formatDateTime — timestamp UTC dari server', () => {
	beforeEach(() => setLocale('id'));

	it('membaca Z sebagai instan, bukan jam lokal', () => {
		expect(formatDateTime('2026-09-26T09:11:00Z', { timeZone: 'Asia/Jakarta' })).toContain('16.11');
	});

	it('membaca offset ±HH:MM sebagai instan', () => {
		const viaOffset = formatDateTime('2026-09-26T09:11:00+07:00', { timeZone: 'Asia/Jakarta' });
		const viaZ = formatDateTime('2026-09-26T02:11:00Z', { timeZone: 'Asia/Jakarta' });
		expect(viaOffset).toContain('09.11');
		expect(viaOffset).toBe(viaZ);
	});

	it('milidetik sebelum Z tetap benar', () => {
		expect(formatDateTime('2026-09-26T09:11:01.762Z', { timeZone: 'Asia/Jakarta' })).toContain('16.11');
	});

	it('locale en memakai jam 12 dengan AM/PM', () => {
		setLocale('en-US');
		const formatted = formatDateTime('2026-09-26T09:11:00Z', { timeZone: 'Asia/Jakarta' });
		expect(formatted).toContain('4:11');
		expect(formatted).toContain('PM');
	});

	it('tanggal polos tidak dianggap berzona', () => {
		expect(formatDateTime('2026-09-26')).toContain('26 Sep 2026');
	});
});
