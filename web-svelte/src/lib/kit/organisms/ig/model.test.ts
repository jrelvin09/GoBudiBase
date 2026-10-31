import { describe, expect, it } from 'vitest';
import type { FieldMeta } from '$lib/kit/fields/types';
import {
	addRow,
	applyBatchErrors,
	deleteRow,
	duplicateRow,
	fromRows,
	hasChanges,
	opRowKeys,
	revertRow,
	rowStatus,
	refreshRow,
	setCell,
	toOps,
	type GridState
} from './model';

function field(name: string): FieldMeta {
	return { name, type: 'text', label: name, required: false, in_table: true };
}

const meta = { fields: [field('code'), field('name'), field('credit_limit')] };

function page(): Record<string, unknown>[] {
	return [
		{ id: 'a1', version: 3, code: 'C001', name: 'One', credit_limit: 10 },
		{ id: 'a2', version: 1, code: 'C002', name: 'Two', credit_limit: 20 }
	];
}

describe('fromRows (K5-02)', () => {
	it('keys rows by id and keeps the version', () => {
		const state = fromRows(page());
		expect(state.rows.map((row) => row.key)).toEqual(['a1', 'a2']);
		expect(state.rows[0].version).toBe(3);
		expect(state.rows[1].version).toBe(1);
	});

	it('drops the bookkeeping columns from values and original', () => {
		const row = fromRows(page()).rows[0];
		expect(row.values).toEqual({ code: 'C001', name: 'One', credit_limit: 10 });
		expect(row.original).toEqual(row.values);
		expect(rowStatus(row)).toBe('unchanged');
	});

	it('starts the temporary ids at n1 and handles an empty page', () => {
		expect(fromRows(page()).nextTmpId).toBe(1);
		expect(fromRows([])).toEqual({ rows: [], nextTmpId: 1 });
	});
});

describe('setCell (K5-02)', () => {
	it('changes one cell without touching the input state', () => {
		const state = fromRows(page());
		const next = setCell(state, 'a1', 'name', 'Renamed');
		expect(next.rows[0].values.name).toBe('Renamed');
		expect(state.rows[0].values.name).toBe('One');
		expect(rowStatus(next.rows[0])).toBe('changed');
	});

	it('ignores an unknown row key', () => {
		const state = fromRows(page());
		const next = setCell(state, 'nope', 'name', 'x');
		expect(next.rows).toEqual(state.rows);
	});

	it('setting the original value back is not a change', () => {
		const state = setCell(fromRows(page()), 'a1', 'name', 'Renamed');
		const back = setCell(state, 'a1', 'name', 'One');
		expect(rowStatus(back.rows[0])).toBe('unchanged');
		expect(toOps(back, meta)).toEqual([]);
	});
});

describe('addRow and duplicateRow (K5-02)', () => {
	it('appends a new row with its temporary id', () => {
		const state = addRow(fromRows(page()), undefined, { code: 'C003' });
		const row = state.rows[2];
		expect(row.key).toBe('n1');
		expect(row.tmpId).toBe('n1');
		expect(row.values.code).toBe('C003');
		expect(row.isNew).toBe(true);
		expect(rowStatus(row)).toBe('new');
		expect(state.nextTmpId).toBe(2);
	});

	it('inserts the new row right after the given row', () => {
		const state = addRow(fromRows(page()), 'a1');
		expect(state.rows.map((row) => row.key)).toEqual(['a1', 'n1', 'a2']);
	});

	it('duplicateRow copies the values under a fresh key, after the source', () => {
		const state = duplicateRow(fromRows(page()), 'a1');
		expect(state.rows.map((row) => row.key)).toEqual(['a1', 'n1', 'a2']);
		expect(state.rows[1].values).toEqual(state.rows[0].values);
		expect(state.rows[1].isNew).toBe(true);
		expect(state.rows[0].isNew).toBe(false);
	});

	it('duplicateRow of an unknown row returns the state unchanged', () => {
		const state = fromRows(page());
		expect(duplicateRow(state, 'nope')).toBe(state);
	});
});

describe('deleteRow and revertRow (K5-02)', () => {
	it('a new row disappears on delete', () => {
		const state = addRow(fromRows(page()), undefined);
		const next = deleteRow(state, 'n1');
		expect(next.rows).toHaveLength(2);
	});

	it('a stored row is marked deleted', () => {
		const next = deleteRow(fromRows(page()), 'a1');
		expect(next.rows).toHaveLength(2);
		expect(next.rows[0].deleted).toBe(true);
		expect(rowStatus(next.rows[0])).toBe('deleted');
	});

	it('revertRow restores the stored values and clears the deletion', () => {
		let state = setCell(fromRows(page()), 'a1', 'name', 'Renamed');
		state = deleteRow(state, 'a1');
		const next = revertRow(state, 'a1');
		expect(next.rows[0].values.name).toBe('One');
		expect(next.rows[0].deleted).toBe(false);
		expect(rowStatus(next.rows[0])).toBe('unchanged');
	});

	it('revertRow drops a new row', () => {
		const state = addRow(fromRows(page()), undefined);
		expect(revertRow(state, 'n1').rows).toHaveLength(2);
	});
});

describe('refreshRow (K5-02)', () => {
	it('takes the server values and version', () => {
		const state = refreshRow(fromRows(page()), 'a1', {
			id: 'a1',
			version: 4,
			code: 'C001',
			name: 'Fresh',
			credit_limit: 11
		});
		expect(state.rows[0].version).toBe(4);
		expect(state.rows[0].values.name).toBe('Fresh');
		expect(state.rows[0].original.name).toBe('Fresh');
		expect(rowStatus(state.rows[0])).toBe('unchanged');
	});

	it('clears an error and a pending deletion on the refreshed row', () => {
		const state = applyBatchErrors(deleteRow(fromRows(page()), 'a1'), [{ index: 0, code: 'IN_USE' }], meta);
		const next = refreshRow(state, 'a1', { id: 'a1', version: 3, code: 'C001', name: 'One' });
		expect(next.rows[0].errorCode).toBe('');
		expect(next.rows[0].deleted).toBe(false);
	});
});

describe('toOps (K5-02)', () => {
	it('sends only the fields that changed', () => {
		let state = setCell(fromRows(page()), 'a1', 'name', 'Renamed');
		state = setCell(state, 'a1', 'credit_limit', 99);
		expect(toOps(state, meta)).toEqual([
			{ op: 'update', id: 'a1', expected_version: 3, values: { name: 'Renamed', credit_limit: 99 } }
		]);
	});

	it('keeps row order across the three operation kinds', () => {
		let state = setCell(fromRows(page()), 'a1', 'name', 'Renamed');
		state = addRow(state, undefined, { code: 'C003' });
		state = deleteRow(state, 'a2');
		expect(toOps(state, meta)).toEqual([
			{ op: 'update', id: 'a1', expected_version: 3, values: { name: 'Renamed' } },
			{ op: 'delete', id: 'a2', expected_version: 1 },
			{ op: 'create', tmp_id: 'n1', values: { code: 'C003' } }
		]);
	});

	it('produces nothing for a page without changes', () => {
		expect(toOps(fromRows(page()), meta)).toEqual([]);
		expect(hasChanges(fromRows(page()))).toBe(false);
	});

	it('hasChanges is true once a cell changed', () => {
		expect(hasChanges(setCell(fromRows(page()), 'a2', 'code', 'X'))).toBe(true);
	});
});

describe('applyBatchErrors (K5-02)', () => {
	it('marks the row behind the reported index', () => {
		let state = setCell(fromRows(page()), 'a2', 'code', '');
		state = addRow(state, undefined, { code: 'C003' });
		const next = applyBatchErrors(
			state,
			[
				{
					index: 1,
					code: 'VALIDATION_FAILED',
					field_errors: [{ field: 'name', code: 'required', message: 'Wajib diisi.' }]
				}
			],
			meta
		);
		expect(next.rows[0].errors).toEqual({});
		expect(next.rows[2].errors).toEqual({ name: 'Wajib diisi.' });
		expect(next.rows[2].errorCode).toBe('VALIDATION_FAILED');
	});

	it('marks a version conflict on the offending row only', () => {
		const state = setCell(fromRows(page()), 'a2', 'name', 'Two B');
		const next = applyBatchErrors(state, [{ index: 0, code: 'VERSION_CONFLICT' }], meta);
		expect(next.rows[1].errorCode).toBe('VERSION_CONFLICT');
		expect(next.rows[0].errorCode).toBe('');
	});

	it('ignores an index without an operation', () => {
		const state = fromRows(page());
		expect(applyBatchErrors(state, [{ index: 7, code: 'INTERNAL' }], meta).rows).toEqual(state.rows);
	});

	it('opRowKeys lines up one key per operation', () => {
		let state = setCell(fromRows(page()), 'a2', 'name', 'Two B');
		state = addRow(state, undefined, { code: 'C003' });
		state = deleteRow(state, 'a1');
		expect(opRowKeys(state, meta)).toEqual(['a1', 'a2', 'n1']);
		expect(toOps(state, meta)).toHaveLength(3);
	});
});

describe('read_only fields (F8-02)', () => {
	const locked = { fields: [field('code'), { ...field('on_hand'), read_only: true }, field('counted')] };

	it('never sends a ReadOnly field in an update', () => {
		let state = setCell(fromRows(page()), 'a1', 'on_hand', 99);
		state = setCell(state, 'a1', 'counted', 5);
		expect(toOps(state, locked)).toEqual([
			{ op: 'update', id: 'a1', expected_version: 3, values: { counted: 5 } }
		]);
	});

	it('never sends a ReadOnly field on create', () => {
		const state = addRow(fromRows(page()), undefined, { code: 'C003', on_hand: 7 });
		expect(toOps(state, locked)).toEqual([{ op: 'create', tmp_id: 'n1', values: { code: 'C003' } }]);
	});
});
