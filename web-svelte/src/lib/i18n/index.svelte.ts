import en from './en.json';
import id from './id.json';

export type Locale = 'id' | 'en';

const catalogs: Record<Locale, Record<string, string>> = { id, en };

let locale = $state<Locale>('id');

/** 'id-ID' → 'id', 'en-US' → 'en', selain itu 'en'. */
export function normalizeLocale(raw: string | null | undefined): Locale {
	const base = (raw ?? '').split(/[-_]/)[0].toLowerCase();
	return base === 'id' ? 'id' : 'en';
}

export function getLocale(): Locale {
	return locale;
}

export function setLocale(raw: string | null | undefined): void {
	locale = normalizeLocale(raw);
	if (typeof document !== 'undefined') document.documentElement.lang = locale;
}

/** Cari di locale aktif → `en` → key itu sendiri; ganti `{nama}` dari params. */
export function t(key: string, params?: Record<string, string | number>): string {
	const template = catalogs[locale][key] ?? catalogs.en[key] ?? key;
	if (!params) return template;
	return template.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
		name in params ? String(params[name]) : placeholder
	);
}
