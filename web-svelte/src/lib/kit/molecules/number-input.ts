import { getLocale } from '$lib/i18n/index.svelte';
import { parseNumber } from '$lib/i18n/format';

export type NumberError = 'invalid' | 'min' | 'max' | null;

export type FromEditResult = { value: number | null; error: NumberError };

/**
 * Angka mentah dalam format locale aktif tanpa pemisah ribuan, untuk dipakai
 * saat input difokuskan (`1234,5` di `id`, `1234.5` di `en`).
 */
export function toEditText(value: number | null): string {
	if (value === null || value === undefined) return '';
	return new Intl.NumberFormat(getLocale(), {
		useGrouping: false,
		maximumFractionDigits: 20
	}).format(value);
}

/**
 * Menerima teks suntingan locale aktif (`1.234,5` di `id`) dan mengembalikan
 * nilai + kesalahan lokal; `error` hanya `invalid`, `min`, atau `max`.
 */
export function fromEditText(
	text: string,
	opts?: { min?: number | null; max?: number | null }
): FromEditResult {
	const parsed = parseNumber(text);
	if (parsed === null) return { value: null, error: null };
	if (Number.isNaN(parsed)) return { value: null, error: 'invalid' };
	if (opts?.min !== null && opts?.min !== undefined && parsed < opts.min) {
		return { value: parsed, error: 'min' };
	}
	if (opts?.max !== null && opts?.max !== undefined && parsed > opts.max) {
		return { value: parsed, error: 'max' };
	}
	return { value: parsed, error: null };
}
