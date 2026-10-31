import type { FieldMeta } from '$lib/kit/fields/types';

/** Refleksi klien dari `fw.Field.VisibleWhen` (F6-04): field hanya tampil bila
 * field acuan bernilai salah satu `values`. Server tetap otoritatif; ini hanya
 * menyembunyikan field. */
export function isVisible(
	field: Pick<FieldMeta, 'visible_when'>,
	values: Record<string, unknown>
): boolean {
	const rule = field.visible_when;
	if (!rule) return true;
	const raw = values[rule.field];
	return rule.values.some((value) => String(value) === String(raw));
}