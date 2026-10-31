import { TOKEN_ALLOWLIST, themeAttributes, type Density, type Mode, type ThemeResponse } from './types';

export type { Density, Mode };

const MODE_KEY = 'bb.theme.mode';
const DENSITY_KEY = 'bb.theme.density';
const DARK_QUERY = '(prefers-color-scheme: dark)';

/** Murni: apakah kelas `dark` harus aktif untuk mode ini. */
export function resolveDark(mode: Mode, prefersDark: boolean): boolean {
	if (mode === 'dark') return true;
	if (mode === 'light') return false;
	return prefersDark;
}

export function isMode(value: unknown): value is Mode {
	return value === 'system' || value === 'light' || value === 'dark';
}

export function isDensity(value: unknown): value is Density {
	return value === 'comfortable' || value === 'compact';
}

let mode = $state<Mode>('system');
let density = $state<Density>('comfortable');
let preset = $state('neutral');
/** Token terakhir dari server, supaya pasangan warna bisa dipilih ulang saat mode berubah (T2-04). */
let serverTokens = $state<Record<string, string>>({});
let attributes = $state<Record<string, string>>({});
let brand = $state<{ appName: string; logoUrl: string }>({ appName: '', logoUrl: '' });
let mediaQuery: MediaQueryList | null = null;

export function getMode(): Mode {
	return mode;
}

export function getDensity(): Density {
	return density;
}

export function getPreset(): string {
	return preset;
}

/** Nama aplikasi dan logo dari tema terbit; kosong bila tidak diatur. */
export function getBrand(): { appName: string; logoUrl: string } {
	return brand;
}

export function getSidebarDefault(): string {
	return attributes['sidebar'] ?? 'expanded';
}

function systemPrefersDark(): boolean {
	return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
		? window.matchMedia(DARK_QUERY).matches
		: false;
}

/** Terapkan mode + density + preset + token ke `<html>`; satu-satunya tempat yang menyentuh DOM tema. */
export function apply(): void {
	if (typeof document === 'undefined') return;
	const dark = resolveDark(mode, systemPrefersDark());
	const root = document.documentElement;
	root.classList.toggle('dark', dark);
	root.dataset.density = density;
	root.dataset.preset = preset;
	for (const key of ['content-width', 'sidebar', 'card', 'table']) {
		const value = attributes[key];
		if (value) root.setAttribute(`data-${key}`, value);
		else root.removeAttribute(`data-${key}`);
	}
	applyTokens(tokensForMode(serverTokens, dark));
}

/** Pasangan warna yang berlaku untuk mode sekarang (T2-04): server mengirim
 * `primary`/`primary-foreground` dan `primary-dark`/`primary-dark-foreground`,
 * dan hanya pasangan yang cocok yang boleh menjadi `--primary`. Murni. */
export function tokensForMode(tokens: Record<string, string>, dark: boolean): Record<string, string> {
	const out = { ...tokens };
	const colorKey = dark ? 'primary-dark' : 'primary';
	const foregroundKey = dark ? 'primary-dark-foreground' : 'primary-foreground';
	if (typeof tokens[colorKey] === 'string' && tokens[colorKey] !== '') {
		out.primary = tokens[colorKey];
		out['primary-foreground'] = tokens[foregroundKey] ?? '';
	}
	delete out['primary-dark'];
	delete out['primary-dark-foreground'];
	return out;
}

/** Token yang boleh diterapkan: kunci allowlist dengan nilai tidak kosong.
 * Murni, supaya daftar izin ini bisa diuji tanpa DOM. */
export function allowlistedTokens(tokens: Record<string, string>): [string, string][] {
	const out: [string, string][] = [];
	for (const key of TOKEN_ALLOWLIST) {
		const value = tokens[key];
		if (typeof value === 'string' && value !== '') out.push([key, value]);
	}
	return out;
}

/** Terapkan token tema dari server. Hanya kunci allowlist yang boleh masuk ke
 * `style` (T1-05) — server sudah memvalidasinya, frontend tidak mempercayai
 * kunci lain. */
export function applyTokens(tokens: Record<string, string>): void {
	if (typeof document === 'undefined') return;
	for (const [key, value] of allowlistedTokens(tokens)) {
		document.documentElement.style.setProperty(`--${key}`, value);
	}
}

/** Terapkan tema hasil resolusi server (T1-04). Preferensi user hanya dipakai
 * saat login, supaya tamu tidak tiba-tiba mengubah tampilan mesin bersama. */
export function applyServerTheme(theme: ThemeResponse, useUserPreferences = false): void {
	preset = theme.preset;
	if (useUserPreferences) {
		if (isMode(theme.mode)) mode = theme.mode;
		if (isDensity(theme.density)) density = theme.density;
		// Server menang atas localStorage saat login (T1-05), termasuk untuk
		// skrip anti-FOUC pada muat berikutnya.
		writeStored(MODE_KEY, mode);
		writeStored(DENSITY_KEY, density);
	}
	serverTokens = theme.tokens ?? {};
	attributes = themeAttributes(theme);
	brand = { appName: theme.app_name ?? '', logoUrl: theme.logo_url ?? '' };
	apply();
}

function readStored(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

function writeStored(key: string, value: string): void {
	try {
		localStorage.setItem(key, value);
	} catch {
		// Preferensi tampilan: gagal menyimpan bukan alasan menggagalkan aksi user.
	}
}

export function setMode(next: Mode): void {
	mode = next;
	writeStored(MODE_KEY, next);
	apply();
}

export function setDensity(next: Density): void {
	density = next;
	writeStored(DENSITY_KEY, next);
	apply();
}

function onSystemChange(): void {
	if (mode === 'system') apply();
}

/** Sekali saat aplikasi mulai: pulihkan preferensi tersimpan + ikuti sistem. */
export function initTheme(): void {
	if (typeof window === 'undefined') return;
	const storedMode = readStored(MODE_KEY);
	if (isMode(storedMode)) mode = storedMode;
	const storedDensity = readStored(DENSITY_KEY);
	if (isDensity(storedDensity)) density = storedDensity;
	apply();
	if (!mediaQuery && typeof window.matchMedia === 'function') {
		mediaQuery = window.matchMedia(DARK_QUERY);
		mediaQuery.addEventListener('change', onSystemChange);
	}
}
