import { describe, expect, it } from 'vitest';
import {
	addClickStep,
	addItem,
	addRegion,
	CONTROL_TYPES,
	clickAction,
	defaultStep,
	emptyDraft,
	insertItemAt,
	insertPaletteRegion,
	moveFieldTo,
	moveItemTo,
	pruneActions,
	removeClickStep,
	removeItem,
	removeRegion,
	retargetStep,
	stepTarget,
	stepTargetKind,
	updateClickStep,
	updateRegion
} from './builder';
import { fieldInsertBefore, isFieldDrag, MIME_FIELD, MIME_ITEM_MOVE, MIME_ITEM_NEW, MIME_MOVE, MIME_NEW, dragKind, parseFieldDrag } from './design/dnd';
import { ITEMS_MAX, validatePageDefinition, type PageDefinition } from './page-definition';

const FIELDS = [
	{ name: 'code', in_table: true, type: 'text' },
	{ name: 'name', in_table: true, type: 'text' },
	{ name: 'tier', in_table: true, type: 'select' },
	{ name: 'notes', in_table: false, type: 'textarea' }
];

const base = (): PageDefinition => addRegion(emptyDraft('sales.customer', 'Customers'), 'resource-list', 'sales.customer');

describe('kontrol di kanvas (insertItemAt / moveItemTo)', () => {
	it('menyisipkan kontrol di posisi yang diminta dengan id unik dan hasil valid', () => {
		let p = base();
		p = insertItemAt(p, 'text', 0, 'Name');
		p = insertItemAt(p, 'button', 0, 'Go');
		p = insertItemAt(p, 'select', 99, 'Tier');
		expect(p.items?.map((i) => [i.id, i.type])).toEqual([
			['P1_BUTTON', 'button'],
			['P1_ITEM', 'text'],
			['P2_ITEM', 'select']
		]);
		expect(p.items?.[2].options).toEqual(['option']);
		expect(validatePageDefinition(p).ok).toBe(true);
	});

	it('menolak kontrol melewati ITEMS_MAX dan tipe palet semuanya valid', () => {
		let p = base();
		for (let i = 0; i < ITEMS_MAX; i++) p = addItem(p);
		expect(insertItemAt(p, 'text', 0, 'x')).toBe(p);
		for (const type of CONTROL_TYPES) expect(validatePageDefinition(insertItemAt(base(), type, 0, 'L')).ok).toBe(true);
	});

	it('moveItemTo memakai indeks sisip sebelum pencabutan; posisi sama = tak berubah', () => {
		let p = base();
		for (const label of ['a', 'b', 'c']) p = insertItemAt(p, 'text', 99, label);
		const labels = (q: PageDefinition) => q.items?.map((i) => i.label).join('');
		expect(labels(moveItemTo(p, 0, 3))).toBe('bca');
		expect(labels(moveItemTo(p, 2, 0))).toBe('cab');
		expect(moveItemTo(p, 1, 1)).toBe(p);
		expect(moveItemTo(p, 1, 2)).toBe(p);
		expect(moveItemTo(p, 5, 0)).toBe(p);
	});
});

describe('palet region (insertPaletteRegion)', () => {
	it('grafik langsung memilih field pengelompokan select/toggle pertama', () => {
		const p = insertPaletteRegion(base(), 'chart', 'sales.customer', 0, FIELDS);
		expect(p.regions[0]).toMatchObject({ type: 'chart', groupBy: 'tier' });
		expect(validatePageDefinition(p).ok).toBe(true);
		expect(insertPaletteRegion(base(), 'kpi', 'sales.customer', 1, FIELDS).regions[1].groupBy).toBeUndefined();
	});
});

describe('seret field di dalam region (moveFieldTo)', () => {
	const list = (names?: string[]) => {
		const p = base();
		return names ? updateRegion(p, 0, { fields: names }) : p;
	};

	it('urutan bawaan menjadi daftar eksplisit setelah dipindah', () => {
		const p = moveFieldTo(list(), 0, 'tier', 'code', FIELDS);
		expect(p.regions[0].fields).toEqual(['tier', 'code', 'name']);
	});

	it('before null = di akhir; field yang belum tampil ikut ditambahkan', () => {
		expect(moveFieldTo(list(['code', 'name']), 0, 'code', null, FIELDS).regions[0].fields).toEqual(['name', 'code']);
		expect(moveFieldTo(list(['code']), 0, 'notes', 'code', FIELDS).regions[0].fields).toEqual(['notes', 'code']);
	});

	it('tanpa perubahan atau tidak sah = definisi yang sama', () => {
		const p = list(['code', 'name']);
		expect(moveFieldTo(p, 0, 'code', 'name', FIELDS)).toBe(p);
		expect(moveFieldTo(p, 0, 'ghost', null, FIELDS)).toBe(p);
		expect(moveFieldTo(p, 3, 'code', null, FIELDS)).toBe(p);
		const kpi = insertPaletteRegion(base(), 'kpi', 'sales.customer', 1, FIELDS);
		expect(moveFieldTo(kpi, 1, 'code', null, FIELDS)).toBe(kpi);
	});
});

describe('aksi klik tombol', () => {
	const withButton = (): PageDefinition => {
		let p = base();
		p = insertItemAt(p, 'text', 0, 'Name');
		return insertItemAt(p, 'button', 1, 'Go');
	};

	it('menambah, mengubah, dan menghapus langkah; hasil selalu lolos validasi', () => {
		let p = withButton();
		const button = 'P1_BUTTON';
		const refresh = defaultStep(p, 'refresh_region', [])!;
		p = addClickStep(p, button, refresh);
		expect(p.actions).toEqual([{ id: 'A001', on: button, do: [{ type: 'refresh_region', region: 'resource-list-1' }] }]);
		p = addClickStep(p, button, defaultStep(p, 'set_item', [])!);
		p = addClickStep(p, button, defaultStep(p, 'navigate', ['sales.order'])!);
		expect(clickAction(p, button)?.do.map((s) => s.type)).toEqual(['refresh_region', 'set_item', 'navigate']);
		expect(validatePageDefinition(p).ok).toBe(true);

		p = updateClickStep(p, button, 2, retargetStep(clickAction(p, button)!.do[2], 'sales.customer'));
		expect(stepTarget(clickAction(p, button)!.do[2])).toBe('sales.customer');
		p = removeClickStep(p, button, 0);
		expect(clickAction(p, button)?.do).toHaveLength(2);
		p = removeClickStep(removeClickStep(p, button, 0), button, 0);
		expect(p.actions).toBeUndefined();
	});

	it('batas lima langkah dan langkah tanpa sasaran ditolak', () => {
		let p = withButton();
		const step = defaultStep(p, 'refresh_region', [])!;
		for (let i = 0; i < 5; i++) p = addClickStep(p, 'P1_BUTTON', step);
		expect(addClickStep(p, 'P1_BUTTON', step)).toBe(p);
		expect(defaultStep(withButton(), 'open_dialog', [])).toBeNull();
		expect(defaultStep(base(), 'set_item', [])).toBeNull();
		expect(defaultStep(base(), 'navigate', [])).toBeNull();
	});

	it('jenis sasaran langkah', () => {
		expect(stepTargetKind({ type: 'set_item', item: 'P1_ITEM', value: '' })).toBe('item');
		expect(stepTargetKind({ type: 'hide', region: 'r' })).toBe('region');
		expect(stepTargetKind({ type: 'navigate', resourceId: 'sales.order' })).toBe('resource');
		expect(stepTargetKind({ type: 'call_server_action', resourceId: 'sales.order', action: 'approve' })).toBeNull();
	});

	it('menghapus kontrol atau region membuang aksi yang merujuknya, draft tetap valid', () => {
		let p = withButton();
		p = addClickStep(p, 'P1_BUTTON', defaultStep(p, 'refresh_region', [])!);
		p = addClickStep(p, 'P1_BUTTON', defaultStep(p, 'set_item', [])!);
		// item teks dihapus: langkah set_item hilang, langkah lain tetap
		const noText = removeItem(p, 0);
		expect(clickAction(noText, 'P1_BUTTON')?.do.map((s) => s.type)).toEqual(['refresh_region']);
		expect(validatePageDefinition(noText).ok).toBe(true);
		// tombol dihapus: aksi hilang, `actions` tidak tersisa sebagai array kosong
		const noButton = removeItem(p, 1);
		expect(noButton.actions).toBeUndefined();
		expect(validatePageDefinition(noButton).ok).toBe(true);
		// region dihapus: langkah yang menunjuknya hilang
		const two = addRegion(p, 'kpi', 'sales.customer');
		const withSecond = addClickStep(two, 'P1_BUTTON', { type: 'hide', region: 'kpi-1' });
		const dropped = removeRegion(withSecond, 1);
		expect(clickAction(dropped, 'P1_BUTTON')?.do.some((s) => s.type === 'hide')).toBe(false);
		expect(validatePageDefinition(dropped).ok).toBe(true);
	});

	it('pruneActions tanpa actions = objek yang sama', () => {
		const p = base();
		expect(pruneActions(p)).toBe(p);
	});
});

describe('dnd: jenis seretan kontrol dan field', () => {
	it('dragKind membedakan region dan kontrol; region menang bila keduanya ada', () => {
		expect(dragKind([MIME_ITEM_NEW])).toBe('item-new');
		expect(dragKind([MIME_ITEM_MOVE])).toBe('item-move');
		expect(dragKind([MIME_NEW])).toBe('new');
		expect(dragKind([MIME_MOVE, MIME_ITEM_NEW])).toBe('move');
		expect(dragKind([MIME_FIELD])).toBeNull();
		expect(dragKind(['text/plain'])).toBeNull();
	});

	it('seretan field: deteksi, muatan, dan titik sisip', () => {
		expect(isFieldDrag([MIME_FIELD])).toBe(true);
		expect(isFieldDrag(['text/plain'])).toBe(false);
		expect(parseFieldDrag(JSON.stringify({ region: 2, name: 'code' }))).toEqual({ region: 2, name: 'code' });
		expect(parseFieldDrag('not json')).toBeNull();
		expect(parseFieldDrag(JSON.stringify({ region: 'x', name: 'code' }))).toBeNull();
		expect(parseFieldDrag(JSON.stringify({ region: 1, name: '' }))).toBeNull();
		expect(parseFieldDrag(undefined)).toBeNull();
		const names = ['a', 'b', 'c'];
		expect(fieldInsertBefore(names, 'b', false)).toBe('b');
		expect(fieldInsertBefore(names, 'b', true)).toBe('c');
		expect(fieldInsertBefore(names, 'c', true)).toBeNull();
		expect(fieldInsertBefore(names, 'zz', false)).toBeNull();
	});
});
