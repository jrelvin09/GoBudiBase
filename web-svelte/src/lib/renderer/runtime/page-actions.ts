import type { PageAction } from './page-definition';
import type { ItemValues } from './page-items';

export interface ServerCall {
	resourceId: string;
	action: string;
	/** Id record dari nilai item `idItem`; kosong = tanpa id (aksi header). */
	id?: string;
}

export interface ActionState {
	values: ItemValues;
	/** Region yang disembunyikan oleh aksi `hide`. */
	hidden: Record<string, boolean>;
	/** Item yang dinonaktifkan oleh aksi `disable`. */
	disabled: Record<string, boolean>;
	/** Region dialog yang sedang terbuka (`open_dialog`). */
	dialogs: Record<string, boolean>;
	/** Penghitung segarkan per region (`refresh_region`). */
	refresh: Record<string, number>;
	/** Panggilan aksi server terdaftar yang harus dijalankan runtime. */
	calls: ServerCall[];
	/** Resource tujuan `navigate` (rute internal `/r/<id>`); aksi terakhir menang. */
	navigate?: string;
}

export function emptyActionState(values: ItemValues = {}): ActionState {
	return { values, hidden: {}, disabled: {}, dialogs: {}, refresh: {}, calls: [] };
}

/** Kedalaman rantai `set_item` -> aksi berikutnya (ADR A000). */
export const ACTION_MAX_DEPTH = 10;

function holds(when: PageAction['when'], values: ItemValues): boolean {
	if (!when) return true;
	const current = values[when.item] ?? '';
	switch (when.op) {
		case 'eq':
			return current === (when.value ?? '');
		case 'neq':
			return current !== (when.value ?? '');
		case 'empty':
			return current === '';
		default:
			return current !== '';
	}
}

/**
 * Mesin aksi dinamis: deterministik, tanpa eval/URL bebas. `trigger` adalah
 * `load`, id item yang berubah, `submit_success:<region>`, atau
 * `dialog_close:<region>`. `set_item` yang mengubah nilai memicu aksi item itu
 * sendiri sampai `ACTION_MAX_DEPTH`. Panggilan server hanya dicatat di `calls`.
 * Masukan tidak dimutasi.
 */
export function runActions(actions: readonly PageAction[] | undefined, trigger: string, state: Partial<ActionState> & { values: ItemValues }): ActionState {
	const base = emptyActionState();
	const current: ActionState = {
		...base,
		...state,
		values: { ...state.values },
		hidden: { ...base.hidden, ...state.hidden },
		disabled: { ...base.disabled, ...state.disabled },
		dialogs: { ...base.dialogs, ...state.dialogs },
		refresh: { ...base.refresh, ...state.refresh },
		calls: [...(state.calls ?? [])]
	};
	if (!actions) return current;
	const step = (event: string, depth: number) => {
		if (depth > ACTION_MAX_DEPTH) return;
		for (const action of actions) {
			if (action.on !== event || !holds(action.when, current.values)) continue;
			for (const s of action.do) {
				switch (s.type) {
					case 'set_item':
						if (current.values[s.item] !== s.value) {
							current.values[s.item] = s.value;
							step(s.item, depth + 1);
						}
						break;
					case 'show':
						current.hidden[s.region] = false;
						break;
					case 'hide':
						current.hidden[s.region] = true;
						break;
					case 'enable':
						current.disabled[s.item] = false;
						break;
					case 'disable':
						current.disabled[s.item] = true;
						break;
					case 'refresh_region':
						current.refresh[s.region] = (current.refresh[s.region] ?? 0) + 1;
						break;
					case 'open_dialog':
						current.dialogs[s.region] = true;
						break;
					case 'call_server_action':
						current.calls.push({ resourceId: s.resourceId, action: s.action, id: s.idItem ? current.values[s.idItem] || undefined : undefined });
						break;
					case 'navigate':
						current.navigate = s.resourceId;
						break;
				}
			}
		}
	};
	step(trigger, 1);
	return current;
}
