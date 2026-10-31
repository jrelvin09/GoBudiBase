import { formatDate, formatNumber } from '$lib/i18n/format';
import { t } from '$lib/i18n/index.svelte';

export type DisplayType = 'text' | 'textarea' | 'email' | 'number' | 'select' | 'toggle' | 'date' | 'belongs_to' | 'file' | 'image';

export type DisplayOption = { value: string; label: string };

/**
 * Teks tampilan untuk nilai read-only per tipe field: angka & tanggal lewat
 * formatter locale, toggle lewat label Ya/Tidak, select lewat label opsi
 * (nilai mentah bila tidak ketemu), `null`/`undefined`/kosong menjadi ''.
 */
export function displayText(
	type: DisplayType,
	value: unknown,
	options?: DisplayOption[]
): string {
	if (value === null || value === undefined || value === '') return '';
	switch (type) {
		case 'number':
			return typeof value === 'number' ? formatNumber(value) : String(value);
		case 'date':
			return typeof value === 'string' ? formatDate(value) : String(value);
		case 'toggle':
			return value ? t('kit.common.yes') : t('kit.common.no');
		case 'select': {
			const match = options?.find((option) => option.value === value);
			return match ? match.label : String(value);
		}
		default:
			return String(value);
	}
}
