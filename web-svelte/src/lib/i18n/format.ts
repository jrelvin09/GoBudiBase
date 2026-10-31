import { getLocale, type Locale } from './index.svelte';

/** Pemisah grup & desimal untuk locale aktif, diambil dari Intl (bukan hard-code). */
function separators(locale: Locale): { group: string; decimal: string } {
	const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
	return {
		group: parts.find((p) => p.type === 'group')?.value ?? ',',
		decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.'
	};
}

function toLocalDate(iso: string): Date | null {
	const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(iso);
	if (!m) return null;
	// Tanggal dibangun lokal, bukan `new Date(iso)`, agar tidak bergeser zona waktu.
	return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4] ?? 0), Number(m[5] ?? 0), Number(m[6] ?? 0));
}

/** Timestamp server berakhir `Z` atau offset `±HH:MM` — itu instan, bukan waktu lokal. */
function hasTimezone(iso: string): boolean {
	return /(?:Z|[+-]\d{2}:?\d{2})$/.test(iso.trim());
}

function toDate(iso: string): Date | null {
	if (hasTimezone(iso)) {
		const parsed = new Date(iso);
		return Number.isNaN(parsed.getTime()) ? null : parsed;
	}
	return toLocalDate(iso);
}

export function formatNumber(v: number | null, opts?: { decimals?: number }): string {
	if (v === null || v === undefined) return '';
	return new Intl.NumberFormat(getLocale(), {
		minimumFractionDigits: opts?.decimals,
		maximumFractionDigits: opts?.decimals
	}).format(v);
}

/** Menerima format locale aktif; kosong → null; tidak valid → NaN. */
export function parseNumber(text: string): number | null {
	if (text === null || text === undefined) return null;
	const cleaned = text.replace(/\s/g, '');
	if (cleaned === '') return null;
	const { group, decimal } = separators(getLocale());
	const normalized = cleaned.split(group).join('').split(decimal).join('.');
	if (normalized === '') return NaN;
	return Number(normalized);
}

export function formatDate(iso: string | null): string {
	if (!iso) return '';
	const date = toLocalDate(iso);
	if (!date) return '';
	return new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium' }).format(date);
}

export function formatDateTime(iso: string | null, opts?: { timeZone?: string }): string {
	if (!iso) return '';
	const date = toDate(iso);
	if (!date) return '';
	return new Intl.DateTimeFormat(getLocale(), {
		dateStyle: 'medium',
		timeStyle: 'short',
		timeZone: opts?.timeZone
	}).format(date);
}
