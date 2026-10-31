import { describe, expect, it } from 'vitest';
import { allowlistedTokens, isDensity, isMode, resolveDark, tokensForMode } from './theme.svelte';

describe('tokensForMode (T2-04)', () => {
	const tokens = {
		primary: '#1f6f43',
		'primary-foreground': '#ffffff',
		'primary-dark': '#0d3b24',
		'primary-dark-foreground': '#ffffff',
		radius: '0.875rem'
	};

	it('memilih pasangan terang untuk mode terang', () => {
		const out = tokensForMode(tokens, false);
		expect(out.primary).toBe('#1f6f43');
		expect(out['primary-foreground']).toBe('#ffffff');
		expect(out.radius).toBe('0.875rem');
		expect('primary-dark' in out).toBe(false);
		expect('primary-dark-foreground' in out).toBe(false);
	});

	it('memilih pasangan gelap untuk mode gelap', () => {
		const out = tokensForMode(tokens, true);
		expect(out.primary).toBe('#0d3b24');
		expect(out['primary-foreground']).toBe('#ffffff');
	});

	it('mempertahankan warna terang bila warna gelap tidak diisi', () => {
		const out = tokensForMode({ primary: '#1f6f43', 'primary-foreground': '#ffffff' }, true);
		expect(out.primary).toBe('#1f6f43');
		expect(out['primary-foreground']).toBe('#ffffff');
	});

	it('membiarkan respons kosong tetap kosong', () => {
		expect(tokensForMode({}, false)).toEqual({});
	});
});

describe('resolveDark', () => {
	it('mode light selalu terang, apa pun preferensi sistem', () => {
		expect(resolveDark('light', false)).toBe(false);
		expect(resolveDark('light', true)).toBe(false);
	});

	it('mode dark selalu gelap, apa pun preferensi sistem', () => {
		expect(resolveDark('dark', false)).toBe(true);
		expect(resolveDark('dark', true)).toBe(true);
	});

	it('mode system mengikuti preferensi sistem', () => {
		expect(resolveDark('system', false)).toBe(false);
		expect(resolveDark('system', true)).toBe(true);
	});
});

describe('penjaga tipe', () => {
	it('isMode hanya menerima tiga nilai', () => {
		expect(isMode('system')).toBe(true);
		expect(isMode('light')).toBe(true);
		expect(isMode('dark')).toBe(true);
		expect(isMode('sepia')).toBe(false);
		expect(isMode(null)).toBe(false);
	});

	it('isDensity hanya menerima dua nilai', () => {
		expect(isDensity('comfortable')).toBe(true);
		expect(isDensity('compact')).toBe(true);
		expect(isDensity('dense')).toBe(false);
		expect(isDensity(undefined)).toBe(false);
	});
});

describe('allowlistedTokens (T1-05)', () => {
	it('meneruskan kunci allowlist apa adanya', () => {
		expect(allowlistedTokens({ primary: 'oklch(0.45 0.1 150)', radius: '0.5rem' })).toEqual([
			['primary', 'oklch(0.45 0.1 150)'],
			['radius', '0.5rem']
		]);
	});

	it('membuang kunci di luar allowlist', () => {
		expect(allowlistedTokens({ 'font-sans': 'Inter Variable', background: 'red', danger: 'x' })).toEqual([
			['font-sans', 'Inter Variable']
		]);
	});

	it('membuang nilai kosong dan bukan string', () => {
		expect(allowlistedTokens({ primary: '', accent: undefined as unknown as string })).toEqual([]);
	});

	it('menerima seluruh kunci allowlist', () => {
		const all = {
			primary: 'a',
			'primary-foreground': 'b',
			accent: 'c',
			'accent-foreground': 'd',
			radius: 'e',
			'font-sans': 'f'
		};
		expect(allowlistedTokens(all)).toHaveLength(6);
	});
});
