import type { FieldMeta } from '$lib/kit/fields/types';

/** One row of the grid, with the change bookkeeping the toolbar and Save need. */
export type GridRow = {
	key: string;
	/** Server record id; empty for a row that does not exist yet. */
	id: string;
	/** Temporary id used by `_batch` for a new row. */
	tmpId: string;
	isNew: boolean;
	deleted: boolean;
	version: number;
	values: Record<string, unknown>;
	/** Values as last seen on the server: the diff and Revert use them. */
	original: Record<string, unknown>;
	errors: Record<string, string>;
	errorCode: string;
};

export type GridState = {
	rows: GridRow[];
	nextTmpId: number;
};

export type RowStatus = 'unchanged' | 'new' | 'changed' | 'deleted';

export type BatchOp =
	| { op: 'create'; tmp_id: string; values: Record<string, unknown> }
	| { op: 'update'; id: string; expected_version: number; values: Record<string, unknown> }
	| { op: 'delete'; id: string; expected_version: number };

export type BatchFieldError = { field: string; code: string; message: string };
export type BatchOpError = { index: number; code: string; field_errors?: BatchFieldError[] };
export type BatchOpResult = { index: number; tmp_id?: string; record?: Record<string, unknown> };

/** Column values as the grid holds them: the record minus its bookkeeping. */
function rowValues(row: Record<string, unknown>): Record<string, unknown> {
	const values: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(row)) {
		if (key === 'id' || key === 'version') continue;
		values[key] = value;
	}
	return values;
}

function tmpKey(index: number): string {
	return `n${index}`;
}

/** Builds a grid from one `_query` page. */
export function fromRows(rows: Record<string, unknown>[]): GridState {
	return {
		rows: rows.map((row) => ({
			key: String(row.id),
			id: String(row.id),
			tmpId: '',
			isNew: false,
			deleted: false,
			version: Number(row.version ?? 0),
			values: rowValues(row),
			original: rowValues(row),
			errors: {},
			errorCode: ''
		})),
		nextTmpId: 1
	};
}

function replace(state: GridState, key: string, change: (row: GridRow) => GridRow): GridState {
	return { ...state, rows: state.rows.map((row) => (row.key === key ? change(row) : row)) };
}

export function setCell(state: GridState, rowKey: string, column: string, value: unknown): GridState {
	return replace(state, rowKey, (row) => ({ ...row, values: { ...row.values, [column]: value } }));
}

/** Sets (or, with an empty message, clears) one cell's client error (F8-01). */
export function setCellError(
	state: GridState,
	rowKey: string,
	column: string,
	message: string
): GridState {
	return replace(state, rowKey, (row) => ({ ...row, errors: { ...row.errors, [column]: message } }));
}

export function addRow(
	state: GridState,
	afterKey?: string,
	defaults: Record<string, unknown> = {}
): GridState {
	const key = tmpKey(state.nextTmpId);
	const row: GridRow = {
		key,
		id: '',
		tmpId: key,
		isNew: true,
		deleted: false,
		version: 0,
		values: { ...defaults },
		original: {},
		errors: {},
		errorCode: ''
	};
	const at = afterKey ? state.rows.findIndex((entry) => entry.key === afterKey) : -1;
	const rows =
		at === -1
			? [...state.rows, row]
			: [...state.rows.slice(0, at + 1), row, ...state.rows.slice(at + 1)];
	return { rows, nextTmpId: state.nextTmpId + 1 };
}

export function duplicateRow(state: GridState, rowKey: string): GridState {
	const source = state.rows.find((row) => row.key === rowKey);
	if (!source) return state;
	const key = tmpKey(state.nextTmpId);
	const copy: GridRow = {
		key,
		id: '',
		tmpId: key,
		isNew: true,
		deleted: false,
		version: 0,
		values: { ...source.values },
		original: {},
		errors: {},
		errorCode: ''
	};
	const at = state.rows.findIndex((row) => row.key === rowKey);
	return {
		rows: [...state.rows.slice(0, at + 1), copy, ...state.rows.slice(at + 1)],
		nextTmpId: state.nextTmpId + 1
	};
}

/** A row that was never saved simply disappears; a stored row is marked for deletion. */
export function deleteRow(state: GridState, rowKey: string): GridState {
	const row = state.rows.find((entry) => entry.key === rowKey);
	if (!row) return state;
	if (row.isNew) return { ...state, rows: state.rows.filter((entry) => entry.key !== rowKey) };
	return replace(state, rowKey, (entry) => ({
		...entry,
		deleted: true,
		errors: {},
		errorCode: ''
	}));
}

export function revertRow(state: GridState, rowKey: string): GridState {
	const row = state.rows.find((entry) => entry.key === rowKey);
	if (!row) return state;
	if (row.isNew) return { ...state, rows: state.rows.filter((entry) => entry.key !== rowKey) };
	return replace(state, rowKey, (entry) => ({
		...entry,
		values: { ...entry.original },
		deleted: false,
		errors: {},
		errorCode: ''
	}));
}

/** Takes the server's version of one row after a refresh or a save. */
export function refreshRow(
	state: GridState,
	key: string,
	freshRow: Record<string, unknown>
): GridState {
	return replace(state, key, (row) => ({
		...row,
		id: String(freshRow.id ?? row.id),
		version: Number(freshRow.version ?? row.version),
		values: rowValues(freshRow),
		original: rowValues(freshRow),
		deleted: false,
		isNew: false,
		errors: {},
		errorCode: ''
	}));
}

export function rowStatus(row: GridRow): RowStatus {
	if (row.deleted) return 'deleted';
	if (row.isNew) return 'new';
	for (const [field, value] of Object.entries(row.values)) {
		if (value !== row.original[field]) return 'changed';
	}
	for (const field of Object.keys(row.original)) {
		if (!(field in row.values)) return 'changed';
	}
	return 'unchanged';
}

/** True when Save would send at least one operation. */
export function hasChanges(state: GridState): boolean {
	return state.rows.some((row) => rowStatus(row) !== 'unchanged');
}

function changedFields(row: GridRow, meta: { fields: FieldMeta[] }): Record<string, unknown> {
	const values: Record<string, unknown> = {};
	for (const field of meta.fields) {
		if (field.read_only) continue; // a ReadOnly field is never written by the client (F8-02)
		const value = row.values[field.name];
		if (value === row.original[field.name]) continue;
		if (value === undefined) continue;
		values[field.name] = value;
	}
	return values;
}

function createValues(row: GridRow, meta: { fields: FieldMeta[] }): Record<string, unknown> {
	const values: Record<string, unknown> = {};
	for (const field of meta.fields) {
		if (field.read_only) continue; // a ReadOnly field is never written by the client (F8-02)
		const value = row.values[field.name];
		if (value === undefined) continue;
		values[field.name] = value;
	}
	return values;
}

/** The row key behind every operation, in `toOps` order; a batch error's index
 * addresses this list. */
export function opRowKeys(state: GridState, meta: { fields: FieldMeta[] }): string[] {
	const keys: string[] = [];
	for (const row of state.rows) {
		if (row.deleted && !row.isNew) {
			keys.push(row.key);
			continue;
		}
		if (row.isNew) {
			keys.push(row.key);
			continue;
		}
		if (Object.keys(changedFields(row, meta)).length > 0) keys.push(row.key);
	}
	return keys;
}

/** Turns the page's changes into `_batch` operations, in row order. */
export function toOps(state: GridState, meta: { fields: FieldMeta[] }): BatchOp[] {
	const ops: BatchOp[] = [];
	for (const row of state.rows) {
		if (row.deleted && !row.isNew) {
			ops.push({ op: 'delete', id: row.id, expected_version: row.version });
			continue;
		}
		if (row.isNew) {
			ops.push({ op: 'create', tmp_id: row.tmpId, values: createValues(row, meta) });
			continue;
		}
		const values = changedFields(row, meta);
		if (Object.keys(values).length > 0) {
			ops.push({ op: 'update', id: row.id, expected_version: row.version, values });
		}
	}
	return ops;
}

/** Marks the rows the server rejected, using the same order as `toOps`. */
export function applyBatchErrors(
	state: GridState,
	errors: BatchOpError[],
	meta: { fields: FieldMeta[] }
): GridState {
	const order = toOps(state, meta);
	const byIndex = new Map<number, BatchOpError>();
	for (const error of errors) byIndex.set(error.index, error);
	let next = state;
	for (const [index, error] of byIndex) {
		const op = order[index];
		if (!op) continue;
		const key = op.op === 'create' ? op.tmp_id : op.id;
		const messages: Record<string, string> = {};
		for (const fieldError of error.field_errors ?? []) {
			messages[fieldError.field] = fieldError.message;
		}
		next = replace(next, key, (row) => ({ ...row, errors: messages, errorCode: error.code }));
	}
	return next;
}
