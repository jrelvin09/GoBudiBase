import { describe, expect, it } from 'vitest';
import { ACTION_MAX_DEPTH, runActions } from './page-actions';
import type { PageAction } from './page-definition';
import { validatePageDefinition } from './page-definition';

const state = (values: Record<string, string> = {}) => ({ values, hidden: {} });

describe('runActions (P5)', () => {
	it('tanpa aksi atau tanpa kecocokan tidak mengubah apa pun', () => {
		expect(runActions(undefined, 'load', state({ P1_A: 'x' })).values).toEqual({ P1_A: 'x' });
		const none: PageAction[] = [{ id: 'A1', on: 'P1_B', do: [{ type: 'hide', region: 'r' }] }];
		expect(runActions(none, 'P1_A', state()).hidden).toEqual({});
	});

	it('set_item, hide, dan navigate pada trigger yang cocok', () => {
		const actions: PageAction[] = [
			{ id: 'A1', on: 'P1_A', do: [{ type: 'set_item', item: 'P1_B', value: 'y' }, { type: 'hide', region: 'r1' }] },
			{ id: 'A2', on: 'P1_A', do: [{ type: 'navigate', resourceId: 'sales.order' }] }
		];
		const out = runActions(actions, 'P1_A', state());
		expect(out.values.P1_B).toBe('y');
		expect(out.hidden.r1).toBe(true);
		expect(out.navigate).toBe('sales.order');
	});

	it('kondisi eq, neq, empty, notEmpty', () => {
		const make = (op: 'eq' | 'neq' | 'empty' | 'notEmpty', value?: string): PageAction[] => [
			{ id: 'A1', on: 'load', when: { item: 'P1_A', op, value }, do: [{ type: 'hide', region: 'r' }] }
		];
		const hidden = (a: PageAction[], v: string) => runActions(a, 'load', state({ P1_A: v })).hidden.r === true;
		expect(hidden(make('eq', 'x'), 'x')).toBe(true);
		expect(hidden(make('eq', 'x'), 'z')).toBe(false);
		expect(hidden(make('neq', 'x'), 'z')).toBe(true);
		expect(hidden(make('empty'), '')).toBe(true);
		expect(hidden(make('notEmpty'), 'a')).toBe(true);
	});

	it('siklus set_item berhenti dan tidak menggantung', () => {
		const actions: PageAction[] = [
			{ id: 'A1', on: 'P1_A', do: [{ type: 'set_item', item: 'P1_B', value: '1' }] },
			{ id: 'A2', on: 'P1_B', do: [{ type: 'set_item', item: 'P1_A', value: '2' }] },
			{ id: 'A3', on: 'P1_A', do: [{ type: 'set_item', item: 'P1_B', value: '3' }] }
		];
		const out = runActions(actions, 'P1_A', state());
		expect(Object.keys(out.values).sort()).toEqual(['P1_A', 'P1_B']);
		expect(ACTION_MAX_DEPTH).toBe(10);
	});

	it('tidak memutasi masukan', () => {
		const s = state({ P1_A: 'x' });
		runActions([{ id: 'A1', on: 'load', do: [{ type: 'set_item', item: 'P1_A', value: 'y' }] }], 'load', s);
		expect(s.values.P1_A).toBe('x');
	});
});

describe('page actions contract (P5)', () => {
	const base = (actions: unknown) => ({
		id: 'sales.customer',
		title: 'Customers',
		items: [
			{ id: 'P1_A', type: 'text', label: 'A' },
			{ id: 'P1_S', type: 'select', label: 'S', options: ['x', 'y'] }
		],
		...(actions === undefined ? {} : { actions }),
		regions: [{ id: 'r1', type: 'resource-list', resourceId: 'sales.customer' }]
	});
	const code = (actions: unknown) => {
		const r = validatePageDefinition(base(actions));
		return r.ok ? 'ok' : r.issues[0].code;
	};
	const act = (over: Record<string, unknown> = {}) => ({
		id: 'A1',
		on: 'P1_A',
		do: [{ type: 'hide', region: 'r1' }],
		...over
	});

	it('menerima aksi valid dan membawanya', () => {
		const r = validatePageDefinition(base([act({ when: { item: 'P1_S', op: 'eq', value: 'x' } })]));
		expect(r.ok && r.page.actions?.[0].id).toBe('A1');
		expect(code([act({ on: 'load' })])).toBe('ok');
	});

	it('menolak rujukan tak dikenal dan nilai set_item tak sah', () => {
		expect(code([act({ on: 'P9_X' })])).toBe('unknown_action_ref');
		expect(code([act({ do: [{ type: 'show', region: 'ghost' }] })])).toBe('unknown_action_ref');
		expect(code([act({ do: [{ type: 'set_item', item: 'P1_S', value: 'zzz' }] })])).toBe('invalid_action');
		expect(code([act({ when: { item: 'P9_X', op: 'empty' } })])).toBe('unknown_action_ref');
	});

	it('menolak langkah liar, jumlah langkah, id, duplikat, dan batas daftar', () => {
		expect(code([act({ do: [{ type: 'eval', code: '1' }] })])).toBe('invalid_action');
		expect(code([act({ do: [] })])).toBe('invalid_action');
		expect(code([act({ do: Array.from({ length: 6 }, () => ({ type: 'hide', region: 'r1' })) })])).toBe('invalid_action');
		expect(code([act({ id: 'x' })])).toBe('invalid_action');
		expect(code([act(), act()])).toBe('duplicate_id');
		expect(code([])).toBe('invalid_actions');
		expect(code(Array.from({ length: 21 }, (_, i) => act({ id: `A${i + 1}` })))).toBe('invalid_actions');
	});

	it('navigate hanya menerima id resource, bukan URL bebas', () => {
		expect(code([act({ do: [{ type: 'navigate', resourceId: 'sales.order' }] })])).toBe('ok');
		expect(code([act({ do: [{ type: 'navigate', resourceId: 'javascript:alert(1)' }] })])).toBe('invalid_action');
		expect(code([act({ do: [{ type: 'navigate', resourceId: 'https://evil.example' }] })])).toBe('invalid_action');
	});
});

describe('runActions langkah lanjutan (blok 2)', () => {
	const st = (values: Record<string, string> = {}) => ({ values });
	it('enable/disable item, refresh_region, open_dialog', () => {
		const actions: PageAction[] = [
			{
				id: 'A1',
				on: 'load',
				do: [
					{ type: 'disable', item: 'P1_A' },
					{ type: 'refresh_region', region: 'r1' },
					{ type: 'refresh_region', region: 'r1' },
					{ type: 'open_dialog', region: 'dlg' }
				]
			}
		];
		const out = runActions(actions, 'load', st());
		expect(out.disabled.P1_A).toBe(true);
		expect(out.refresh.r1).toBe(2);
		expect(out.dialogs.dlg).toBe(true);
		expect(runActions([{ id: 'A2', on: 'load', do: [{ type: 'enable', item: 'P1_A' }] }], 'load', { values: {}, disabled: { P1_A: true } }).disabled.P1_A).toBe(false);
	});

	it('call_server_action dicatat dengan id dari item dan tidak langsung dijalankan', () => {
		const actions: PageAction[] = [
			{ id: 'A1', on: 'submit_success:form', do: [{ type: 'call_server_action', resourceId: 'sales.customer', action: 'block', idItem: 'P1_ID' }] }
		];
		const out = runActions(actions, 'submit_success:form', st({ P1_ID: 'abc' }));
		expect(out.calls).toEqual([{ resourceId: 'sales.customer', action: 'block', id: 'abc' }]);
		expect(runActions(actions, 'dialog_close:form', st()).calls).toEqual([]);
	});
});

describe('page actions contract lanjutan (blok 2)', () => {
	const page = (actions: unknown) => ({
		id: 'sales.customer',
		title: 'C',
		items: [{ id: 'P1_A', type: 'text', label: 'A' }],
		regions: [
			{ id: 'form', type: 'resource-form', resourceId: 'sales.customer', mode: 'create' },
			{ id: 'dlg', type: 'resource-list', resourceId: 'sales.customer', dialog: true }
		],
		actions
	});
	const code = (actions: unknown) => {
		const r = validatePageDefinition(page(actions));
		return r.ok ? 'ok' : r.issues[0].code;
	};
	it('menerima event submit_success/dialog_close dan langkah baru', () => {
		expect(code([{ id: 'A1', on: 'submit_success:form', do: [{ type: 'open_dialog', region: 'dlg' }] }])).toBe('ok');
		expect(code([{ id: 'A1', on: 'dialog_close:dlg', do: [{ type: 'refresh_region', region: 'form' }, { type: 'enable', item: 'P1_A' }] }])).toBe('ok');
		expect(code([{ id: 'A1', on: 'load', do: [{ type: 'call_server_action', resourceId: 'sales.customer', action: 'block', idItem: 'P1_A' }] }])).toBe('ok');
	});
	it('menolak event untuk region tak ada dan langkah dengan rujukan/nama liar', () => {
		expect(code([{ id: 'A1', on: 'submit_success:ghost', do: [{ type: 'hide', region: 'form' }] }])).toBe('invalid_action');
		expect(code([{ id: 'A1', on: 'load', do: [{ type: 'open_dialog', region: 'ghost' }] }])).toBe('unknown_action_ref');
		expect(code([{ id: 'A1', on: 'load', do: [{ type: 'call_server_action', resourceId: 'sales.customer', action: 'Bad Name' }] }])).toBe('invalid_action');
		expect(code([{ id: 'A1', on: 'load', do: [{ type: 'disable', item: 'P9_X' }] }])).toBe('unknown_action_ref');
	});
});
