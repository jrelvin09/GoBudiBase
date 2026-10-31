/**
 * Data contoh untuk kanvas desain. Kanvas tidak membaca data company (konteks
 * PLATFORM tidak boleh), jadi semua nilai di sini sintetis dan deterministik;
 * struktur (kolom, urutan, field form, kelompok grafik) berasal dari metadata
 * resource dan definisi halaman yang sedang diedit.
 */
import type { ResourceMeta } from '$lib/api/resource-types';
import type { FieldMeta } from '$lib/kit/fields/types';
import type { RegionDefinition } from '../page-definition';

export const SAMPLE_ROWS = 3;

/** Nilai sel contoh untuk satu field pada baris ke-`row` (0-based). */
export function sampleCell(field: FieldMeta, row: number): string {
	const n = row + 1;
	switch (field.type) {
		case 'email':
			return `user${n}@example.com`;
		case 'number':
			return String(n * 1250);
		case 'date':
			return `2026-10-0${n}`;
		case 'select': {
			const options = field.options ?? [];
			return options.length > 0 ? options[row % options.length].label : `${field.label} ${n}`;
		}
		case 'toggle':
			return row % 2 === 0 ? 'Yes' : 'No';
		case 'belongs_to':
			return `${field.label} ${n}`;
		case 'file':
		case 'image':
			return `file-${n}.pdf`;
		case 'textarea':
			return 'Lorem ipsum dolor sit amet';
		default:
			return `${field.label} ${n}`;
	}
}

/** Kolom tabel yang akan tampil: `fields` terpilih (berurutan) atau kolom tabel bawaan resource. */
export function tableFields(region: Pick<RegionDefinition, 'fields'>, meta: ResourceMeta): FieldMeta[] {
	if (region.fields && region.fields.length > 0) {
		return region.fields.map((name) => meta.fields.find((f) => f.name === name)).filter((f): f is FieldMeta => !!f);
	}
	return meta.fields.filter((f) => f.in_table);
}

/** Field form yang akan tampil: `fields` terpilih (berurutan) atau semua field resource. */
export function formFields(region: Pick<RegionDefinition, 'fields'>, meta: ResourceMeta): FieldMeta[] {
	if (region.fields && region.fields.length > 0) {
		return region.fields.map((name) => meta.fields.find((f) => f.name === name)).filter((f): f is FieldMeta => !!f);
	}
	return meta.fields;
}

const CHART_VALUES = [8, 5, 3, 6, 2, 4];

/** Batang contoh untuk grafik: kelompok dari opsi field `groupBy` bila ada. */
export function chartSample(region: Pick<RegionDefinition, 'groupBy'>, meta: ResourceMeta): { label: string; value: number }[] {
	const field = meta.fields.find((f) => f.name === region.groupBy);
	let labels: string[];
	if (field?.type === 'select' && field.options && field.options.length > 0) labels = field.options.slice(0, 6).map((o) => o.label);
	else if (field?.type === 'toggle') labels = ['Yes', 'No'];
	else labels = ['A', 'B', 'C'];
	return labels.map((label, i) => ({ label, value: CHART_VALUES[i % CHART_VALUES.length] }));
}

/** Angka contoh untuk KPI menurut fungsi agregat. */
export function kpiSample(region: Pick<RegionDefinition, 'metric'>): string {
	switch (region.metric?.fn) {
		case 'sum':
			return '12,450';
		case 'avg':
			return '86.4';
		case 'min':
			return '5';
		case 'max':
			return '950';
		default:
			return '128';
	}
}

/** Isi kartu berurutan (judul, subjudul, lencana, isi): `fields` terpilih atau judul resource saja. */
export function cardFields(region: Pick<RegionDefinition, 'fields'>, meta: ResourceMeta): FieldMeta[] {
	const names = region.fields && region.fields.length > 0 ? region.fields : [meta.title_field];
	return names.map((n) => meta.fields.find((f) => f.name === n)).filter((f): f is FieldMeta => !!f);
}

/** Kolom papan kanban contoh: satu per opsi field `groupBy` (maks 4), tiap kolom berisi kartu contoh. */
export function kanbanSample(region: Pick<RegionDefinition, 'groupBy'>, meta: ResourceMeta): { label: string; cards: number }[] {
	const field = meta.fields.find((f) => f.name === region.groupBy);
	const options = field?.type === 'select' ? (field.options ?? []).slice(0, 4) : [];
	return options.map((o, i) => ({ label: o.label, cards: [2, 1, 3, 1][i % 4] }));
}

/** Tanggal contoh yang ditandai di kalender (hari ke-N dalam bulan contoh). */
export const CALENDAR_MARKED_DAYS: readonly number[] = [3, 9, 10, 17, 24];
