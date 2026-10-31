/**
 * Undo/redo murni untuk builder: tumpukan snapshot tanpa DOM. Pemanggil
 * menyimpan nilai SEBELUM berubah (`record`), lalu `undo`/`redo` menukar nilai
 * sekarang dengan snapshot terdekat. Batas tumpukan menjaga memori.
 */
export interface History<T> {
	past: T[];
	future: T[];
}

export const HISTORY_LIMIT = 100;

export function emptyHistory<T>(): History<T> {
	return { past: [], future: [] };
}

/** Catat `before` (nilai sebelum perubahan); perubahan baru menghapus jalur redo. */
export function record<T>(history: History<T>, before: T, limit = HISTORY_LIMIT): History<T> {
	const past = [...history.past, before];
	return { past: past.length > limit ? past.slice(past.length - limit) : past, future: [] };
}

export function canUndo<T>(history: History<T>): boolean {
	return history.past.length > 0;
}

export function canRedo<T>(history: History<T>): boolean {
	return history.future.length > 0;
}

/** Kembali satu langkah; `current` masuk ke jalur redo. Null bila tak ada yang bisa dibatalkan. */
export function undo<T>(history: History<T>, current: T): { history: History<T>; value: T } | null {
	const value = history.past[history.past.length - 1];
	if (history.past.length === 0) return null;
	return { value, history: { past: history.past.slice(0, -1), future: [...history.future, current] } };
}

/** Maju satu langkah; `current` kembali ke jalur undo. */
export function redo<T>(history: History<T>, current: T): { history: History<T>; value: T } | null {
	const value = history.future[history.future.length - 1];
	if (history.future.length === 0) return null;
	return { value, history: { past: [...history.past, current], future: history.future.slice(0, -1) } };
}
