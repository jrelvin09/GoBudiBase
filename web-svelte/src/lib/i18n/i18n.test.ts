import { beforeEach, describe, expect, it } from 'vitest';
import en from './en.json';
import id from './id.json';
import { getLocale, normalizeLocale, setLocale, t } from './index.svelte';

describe('normalizeLocale', () => {
	it('menormalkan kode locale yang didukung', () => {
		expect(normalizeLocale('id-ID')).toBe('id');
		expect(normalizeLocale('id')).toBe('id');
		expect(normalizeLocale('en-US')).toBe('en');
		expect(normalizeLocale('en')).toBe('en');
	});

	it('jatuh ke en untuk locale tak dikenal', () => {
		expect(normalizeLocale('de-DE')).toBe('en');
		expect(normalizeLocale('')).toBe('en');
		expect(normalizeLocale(null)).toBe('en');
		expect(normalizeLocale(undefined)).toBe('en');
	});
});

describe('setLocale / getLocale', () => {
	beforeEach(() => setLocale('id'));

	it('menyimpan locale yang sudah dinormalkan', () => {
		setLocale('en-US');
		expect(getLocale()).toBe('en');
		setLocale('id-ID');
		expect(getLocale()).toBe('id');
	});

	it('jatuh ke en bila locale tidak didukung', () => {
		setLocale('fr-FR');
		expect(getLocale()).toBe('en');
	});
});

describe('t', () => {
	beforeEach(() => setLocale('id'));

	it('mengambil teks dari locale aktif', () => {
		expect(t('kit.common.save')).toBe('Simpan');
		setLocale('en-US');
		expect(t('kit.common.save')).toBe('Save');
	});

	it('jatuh ke en bila locale tidak didukung', () => {
		setLocale('de-DE');
		expect(t('kit.msg.no_data_found')).toBe('No data found.');
	});

	it('kembalikan key bila tidak ada di katalog', () => {
		expect(t('kit.tidak.ada')).toBe('kit.tidak.ada');
	});

	it('mengganti {nama} dengan params', () => {
		expect(t('Halo {nama}', { nama: 'Budi' })).toBe('Halo Budi');
		expect(t('{a}-{b}', { a: 1, b: 'x' })).toBe('1-x');
	});

	it('membiarkan placeholder yang tidak punya params', () => {
		expect(t('Halo {nama}')).toBe('Halo {nama}');
	});
});

describe('katalog i18n', () => {
	// Fallback kunci ke `en` hanya jaring pengaman; yang dijaga adalah simetri
	// kedua katalog (DoD: kunci ada di `id.json` dan `en.json`).
	it('kunci id.json dan en.json simetris', () => {
		const idKeys = new Set(Object.keys(id));
		const enKeys = new Set(Object.keys(en));
		const missingInEn = [...idKeys].filter((key) => !enKeys.has(key)).sort();
		const missingInId = [...enKeys].filter((key) => !idKeys.has(key)).sort();
		expect({ missingInEn, missingInId }).toEqual({ missingInEn: [], missingInId: [] });
	});
});
