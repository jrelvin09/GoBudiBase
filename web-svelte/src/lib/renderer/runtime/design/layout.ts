/**
 * Matematika layout grid 12 kolom untuk kanvas desain: lebar region, langkah
 * lebar, dan lebar dari posisi pointer saat menyeret tepi kanan. Murni.
 */
import { GRID_COLUMNS, type RegionDefinition, type RegionLayout } from '../page-definition';

/** Lebar umum untuk tombol lebih lebar/lebih sempit. */
export const SPAN_PRESETS = [3, 4, 6, 8, 9, 12] as const;

export function spanOf(region: Pick<RegionDefinition, 'layout'>): number {
	return region.layout?.span ?? GRID_COLUMNS;
}

/** Layout dengan lebar `span` (dibulatkan, 1-12); lebar penuh = undefined (tidak disimpan). `newRow` dipertahankan. */
export function layoutWithSpan(layout: RegionLayout | undefined, span: number): RegionLayout | undefined {
	const s = Math.max(1, Math.min(GRID_COLUMNS, Math.round(span)));
	if (s >= GRID_COLUMNS) return undefined;
	return { span: s, ...(layout?.newRow ? { newRow: true } : {}) };
}

/** Lebar berikutnya menurut preset: `1` = lebih lebar, `-1` = lebih sempit. */
export function stepSpan(current: number, dir: 1 | -1): number {
	if (dir > 0) return SPAN_PRESETS.find((p) => p > current) ?? GRID_COLUMNS;
	return [...SPAN_PRESETS].reverse().find((p) => p < current) ?? SPAN_PRESETS[0];
}

/**
 * Lebar (kolom) dari posisi pointer saat menyeret tepi kanan sebuah region.
 * n kolom selebar n*pitch - gap; hasil dibatasi sisa kolom di baris itu supaya
 * region tidak melompat ke baris berikutnya saat diubah ukurannya.
 */
export function spanFromPointer(p: { x: number; frameLeft: number; pitch: number; gap: number; startColumn: number }): number {
	const raw = Math.round((p.x - p.frameLeft + p.gap) / p.pitch);
	const room = Math.max(1, GRID_COLUMNS - p.startColumn);
	return Math.max(1, Math.min(raw, room));
}
