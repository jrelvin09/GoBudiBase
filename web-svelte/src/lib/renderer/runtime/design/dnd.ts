/**
 * Drag & drop kanvas desain (HTML5 native). Hanya matematika dan konstanta;
 * penanganan event ada di komponen. Dua jenis seretan: komponen baru dari palet
 * (`MIME_NEW`, membawa tipe region) dan region yang dipindah (`MIME_MOVE`,
 * membawa indeks asal).
 *
 * Halaman memakai grid 12 kolom, jadi region bisa sebaris. Titik sisip dihitung
 * dua dimensi: pada baris dengan beberapa region, sisip di kiri/kanan region;
 * pada region selebar penuh, sisip di atas/bawahnya.
 */
export const MIME_NEW = 'application/x-bb-region-type';
export const MIME_MOVE = 'application/x-bb-region-index';
/** Kontrol baru dari palet (membawa tipe item) dan item yang dipindah (membawa indeks asal). */
export const MIME_ITEM_NEW = 'application/x-bb-item-type';
export const MIME_ITEM_MOVE = 'application/x-bb-item-index';
/** Field kolom/form: JSON `{region, name}`; berasal dari kanvas atau dari palet field. */
export const MIME_FIELD = 'application/x-bb-field';

export type DragKind = 'new' | 'move' | 'item-new' | 'item-move' | null;

/** Jenis seretan dari daftar tipe DataTransfer; null bila bukan seretan region/kontrol builder. */
export function dragKind(types: ArrayLike<string> | Iterable<string> | null | undefined): DragKind {
	if (!types) return null;
	const list = Array.from(types as Iterable<string>);
	if (list.includes(MIME_MOVE)) return 'move';
	if (list.includes(MIME_NEW)) return 'new';
	if (list.includes(MIME_ITEM_MOVE)) return 'item-move';
	if (list.includes(MIME_ITEM_NEW)) return 'item-new';
	return null;
}

export function isFieldDrag(types: ArrayLike<string> | Iterable<string> | null | undefined): boolean {
	return !!types && Array.from(types as Iterable<string>).includes(MIME_FIELD);
}

/** Muatan seretan field; null bila bukan JSON yang valid. */
export function parseFieldDrag(raw: string | undefined): { region: number; name: string } | null {
	if (!raw) return null;
	try {
		const v = JSON.parse(raw) as { region?: unknown; name?: unknown };
		return Number.isInteger(v.region) && typeof v.name === 'string' && v.name ? { region: v.region as number, name: v.name } : null;
	} catch {
		return null;
	}
}

/**
 * Field yang harus didahului field terseret bila dilepas di atas `over`:
 * separuh depan = `over` sendiri, separuh belakang = field sesudahnya (null = di akhir).
 */
export function fieldInsertBefore(names: readonly string[], over: string, after: boolean): string | null {
	const i = names.indexOf(over);
	if (i < 0) return null;
	return after ? (names[i + 1] ?? null) : over;
}

export interface Box {
	top: number;
	bottom: number;
	left: number;
	right: number;
}

export type Edge = 'top' | 'bottom' | 'left' | 'right';

/** `index`: posisi sisip pada urutan region sebelum pencabutan; `edge`: sisi tempat penanda digambar. */
export interface DropTarget {
	index: number;
	edge: Edge;
}

/** Region dianggap selebar penuh bila menempati sedikitnya bagian ini dari lebar kontainer. */
export const FULL_WIDTH_RATIO = 0.9;

export function dropTarget(boxes: readonly Box[], containerWidth: number, x: number, y: number): DropTarget {
	if (boxes.length === 0) return { index: 0, edge: 'top' };
	const row = boxes.map((box, index) => ({ box, index })).filter(({ box }) => y >= box.top && y <= box.bottom);
	if (row.length > 0) {
		const first = row[0];
		if (row.length === 1 && first.box.right - first.box.left >= containerWidth * FULL_WIDTH_RATIO) {
			return y < (first.box.top + first.box.bottom) / 2 ? { index: first.index, edge: 'top' } : { index: first.index + 1, edge: 'bottom' };
		}
		for (const { box, index } of row) {
			if (x < (box.left + box.right) / 2) return { index, edge: 'left' };
		}
		return { index: row[row.length - 1].index + 1, edge: 'right' };
	}
	const next = boxes.findIndex((box) => box.top > y);
	return next >= 0 ? { index: next, edge: 'top' } : { index: boxes.length, edge: 'bottom' };
}

export interface Mark {
	left: number;
	top: number;
	width: number;
	height: number;
}

export const MARK_THICKNESS = 4;

/** Persegi penanda sisip, dalam sistem koordinat yang sama dengan `boxes`; `gap` = jarak antar region. */
export function dropMark(boxes: readonly Box[], target: DropTarget, gap: number): Mark | null {
	const before = target.edge === 'top' || target.edge === 'left';
	const anchor = boxes[before ? target.index : target.index - 1];
	if (!anchor) return null;
	const t = MARK_THICKNESS;
	const w = anchor.right - anchor.left;
	const h = anchor.bottom - anchor.top;
	switch (target.edge) {
		case 'top':
			return { left: anchor.left, top: anchor.top - gap / 2 - t / 2, width: w, height: t };
		case 'bottom':
			return { left: anchor.left, top: anchor.bottom + gap / 2 - t / 2, width: w, height: t };
		case 'left':
			return { left: anchor.left - gap / 2 - t / 2, top: anchor.top, width: t, height: h };
		default:
			return { left: anchor.right + gap / 2 - t / 2, top: anchor.top, width: t, height: h };
	}
}
