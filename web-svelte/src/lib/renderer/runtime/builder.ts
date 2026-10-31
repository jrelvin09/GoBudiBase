/**
 * Logika murni editor draft PageDefinition (M8). Semua fungsi mengembalikan
 * definisi baru (tanpa mutasi) dan hanya memakai tipe region dari registry
 * bersama; tidak ada SQL, skrip, atau import path.
 */
import type { ResourceMeta } from '$lib/api/resource-types';
import { registry } from '$lib/kit/catalog';
import {
	ACTIONS_MAX,
	FREE_HEIGHT_MAX,
	FREE_ROWS,
	ACTION_STEPS_MAX,
	CARD_FIELDS_MAX,
	CONTAINER_TYPES,
	MAX_ANCESTORS,
	TABS_MAX,
	CARD_REGION_TYPES,
	FIELDS_MAX,
	GROUP_TYPES,
	FILTER_TYPES,
	FILTERS_MAX,
	ITEMS_MAX,
	FIELDS_REGION_TYPES,
	FIELD_PICK_TYPES,
	FORM_REGION,
	GRID_COLUMNS,
	validatePageDefinition,
	type ActionStep,
	type FormMode,
	type ItemType,
	type PageAction,
	type PageDefinition,
	type PageItem,
	type PageDefinitionIssue,
	type RegionDefinition,
	type RegionFilter,
	type RegionLayout
} from './page-definition';

export const MAX_REGIONS = 40;

export interface PaletteEntry {
	type: string;
	label: string;
	labelKey: string;
}

/** Komponen yang boleh ditaruh di canvas: entri registry ber-capability runtimeRegion. */
export function paletteEntries(): PaletteEntry[] {
	return registry
		.filter((entry) => entry.runtime?.capabilities.runtimeRegion)
		.map((entry) => ({
			type: entry.runtime?.key ?? entry.id,
			label: entry.title,
			labelKey: entry.runtime?.labelKey ?? ''
		}));
}

export function emptyDraft(pageId: string, title: string): PageDefinition {
	return { id: pageId, title, regions: [] };
}

function defaultTabs(): { id: string; label: string }[] {
	return [
		{ id: 'tab1', label: 'Tab 1' },
		{ id: 'tab2', label: 'Tab 2' }
	];
}

function nextRegionId(page: PageDefinition, type: string): string {
	const taken = new Set(page.regions.map((region) => region.id));
	for (let n = 1; ; n++) {
		const id = `${type}-${n}`;
		if (!taken.has(id)) return id;
	}
}

export function addRegion(page: PageDefinition, type: string, resourceId: string): PageDefinition {
	if (page.regions.length >= MAX_REGIONS) return page;
	const region: RegionDefinition = {
		id: nextRegionId(page, type),
		type,
		resourceId,
		...(type === FORM_REGION ? { mode: 'create' as FormMode } : {}),
		...(type === 'kpi' || type === 'chart' ? { metric: { fn: 'count' as const } } : {}),
		...(type === 'tabs' ? { tabs: defaultTabs() } : {}),
		...(type === 'panel' ? { title: 'Panel' } : {})
	};
	return { ...page, regions: [...page.regions, region] };
}

export function moveRegion(page: PageDefinition, index: number, delta: -1 | 1): PageDefinition {
	const target = index + delta;
	if (index < 0 || index >= page.regions.length || target < 0 || target >= page.regions.length) return page;
	const regions = [...page.regions];
	[regions[index], regions[target]] = [regions[target], regions[index]];
	return { ...page, regions };
}

export function removeRegion(page: PageDefinition, index: number): PageDefinition {
	const region = page.regions[index];
	if (!region) return page;
	return removeRegionDeep(page, region.id);
}

export type RegionPatch = Partial<Pick<RegionDefinition, 'id' | 'type' | 'resourceId' | 'mode' | 'fields' | 'sort' | 'pageSize' | 'filters' | 'rowAction' | 'rowItem' | 'datasource' | 'auth' | 'metric' | 'groupBy' | 'layout' | 'onSubmit' | 'dateField' | 'text' | 'slot' | 'title' | 'collapsible'>>;

/** Batas field terpilih: kartu dan kanban hanya memuat 4 (judul, subjudul, lencana, isi). */
export function fieldLimit(type: string): number {
	return CARD_REGION_TYPES.includes(type) ? CARD_FIELDS_MAX : FIELDS_MAX;
}

/** Ubah satu region. Mode ikut tipe: hanya `resource-form` yang punya mode. */
export function updateRegion(page: PageDefinition, index: number, patch: RegionPatch): PageDefinition {
	const current = page.regions[index];
	if (!current) return page;
	const merged: RegionDefinition = { ...current, ...patch };
	// A container that still holds regions cannot turn into a plain component.
	if (merged.type !== current.type && CONTAINER_TYPES.includes(current.type) && !CONTAINER_TYPES.includes(merged.type) && childrenOf(page, current.id).length > 0) return page;
	if (patch.resourceId !== undefined && patch.resourceId !== current.resourceId) {
		// Field, sort, filter, dan metrik mengacu ke nama field resource lama.
		delete merged.fields;
		delete merged.sort;
		delete merged.filters;
		delete merged.metric;
		delete merged.groupBy;
		delete merged.dateField;
	}
	if (merged.type === FORM_REGION) {
		merged.mode = merged.mode === 'edit' ? 'edit' : 'create';
	} else {
		delete merged.mode;
	}
	if (!FIELD_PICK_TYPES.includes(merged.type) || !merged.fields?.length) delete merged.fields;
	if (!merged.filters?.length) delete merged.filters;
	if (merged.type !== 'kpi' && merged.type !== 'chart') delete merged.metric;
	if (!GROUP_TYPES.includes(merged.type)) delete merged.groupBy;
	if (merged.type !== 'calendar') delete merged.dateField;
	if (merged.type !== 'tabs') delete merged.tabs;
	else if (!merged.tabs?.length) merged.tabs = defaultTabs();
	if (merged.type !== 'panel') {
		delete merged.title;
		delete merged.collapsible;
	} else if (!merged.collapsible) delete merged.collapsible;
	if (merged.type !== 'text') delete merged.text;
	if (merged.fields && merged.fields.length > fieldLimit(merged.type)) merged.fields = merged.fields.slice(0, fieldLimit(merged.type));
	if (merged.type !== FORM_REGION || merged.mode !== 'create') delete merged.onSubmit;
	if ((merged.type === 'kpi' || merged.type === 'chart') && !merged.metric) merged.metric = { fn: 'count' };
	if (!FIELDS_REGION_TYPES.includes(merged.type)) {
		delete merged.sort;
		delete merged.pageSize;
		delete merged.rowAction;
	}
	if (merged.rowAction !== 'select') delete merged.rowItem;
	if (!FILTER_TYPES.includes(merged.type)) delete merged.filters;
	if (!merged.datasource || (merged.type !== 'resource-list' && merged.type !== 'ir-report')) delete merged.datasource;
	if (!merged.auth) delete merged.auth;
	// Layout bawaan (lebar penuh) tidak disimpan; region dialog tidak ikut grid.
	if (merged.dialog || !merged.layout || (merged.layout.span ?? GRID_COLUMNS) >= GRID_COLUMNS) delete merged.layout;
	return normalizeNesting({ ...page, regions: page.regions.map((region, i) => (i === index ? merged : region)) });
}

export function updateTitle(page: PageDefinition, title: string): PageDefinition {
	return { ...page, title };
}

/** Masalah yang akan ditolak server: validator runtime, resource dikenal (satu halaman boleh memakai beberapa resource; tiap region diikat ke metadata resource-nya sendiri). */
export function draftIssues(page: PageDefinition, knownResources: readonly string[]): PageDefinitionIssue[] {
	const result = validatePageDefinition(page);
	const issues = result.ok ? [] : [...result.issues];
	const known = new Set(knownResources);
	for (const region of page.regions) {
		if (region.resourceId && !known.has(region.resourceId)) {
			issues.push({ location: region.id, code: 'unknown_resource' });
		}
	}
	return issues;
}

/** Bandingkan dua definisi tanpa peduli referensi objek. */
export function sameDefinition(a: PageDefinition, b: PageDefinition): boolean {
	return JSON.stringify(a) === JSON.stringify(b);
}

export interface PreviewPlan {
	/** Definisi yang boleh dirender, atau null bila tidak ada region yang bisa dipratinjau. */
	page: PageDefinition | null;
	/** Jumlah region form mode edit yang dilewati (preview tidak punya record). */
	skipped: number;
}

/** Preview memakai region yang tidak butuh record; draft edit-only menghasilkan page null (bukan definisi kosong). */
export function previewPlan(definition: PageDefinition): PreviewPlan {
	const regions = definition.regions.filter((region) => !(region.type === FORM_REGION && region.mode === 'edit'));
	return {
		page: regions.length > 0 ? { ...definition, regions } : null,
		skipped: definition.regions.length - regions.length
	};
}

/**
 * ResourceMeta untuk preview: hanya izin lihat, tanpa aksi, tampilan report, dan
 * form halaman. Komponen yang ada sudah menyembunyikan Create, Edit, Delete,
 * aksi, import, export, dan publikasi report berdasarkan capabilities, sehingga
 * preview tidak menawarkan kontrol mutasi (`read_only` juga menyembunyikan "Save Report"). Pagar API di client.ts menolak sisanya.
 */
export function readOnlyPreviewMeta(meta: ResourceMeta): ResourceMeta {
	const { actions: _actions, workflow: _workflow, relations: _relations, ...rest } = meta;
	void _actions;
	void _workflow;
	void _relations;
	return { ...rest, list_view: 'report', form_mode: 'page', capabilities: { view: meta.capabilities.view === true, read_only: true } };
}

/** Field yang ditawarkan builder untuk satu resource (B009a). */
export interface FieldOption {
	name: string;
	in_table: boolean;
}

function withFields(page: PageDefinition, index: number, fields: string[] | undefined): PageDefinition {
	const current = page.regions[index];
	if (!current) return page;
	const next = { ...current };
	if (fields && fields.length > 0) next.fields = fields;
	else delete next.fields;
	return { ...page, regions: page.regions.map((r, i) => (i === index ? next : r)) };
}

/**
 * Field efektif sebuah region: `fields` eksplisit, atau semua field `in_table`
 * sesuai urutan resource bila belum ada (default). Nama yang tak ada di
 * `all` diabaikan.
 */
export function effectiveFields(region: RegionDefinition, all: readonly FieldOption[]): string[] {
	const known = new Set(all.map((f) => f.name));
	if (region.fields) return region.fields.filter((n) => known.has(n));
	if (CARD_REGION_TYPES.includes(region.type)) return [];
	return all.filter((f) => region.type === 'resource-form' || f.in_table).map((f) => f.name);
}

/** Centang/lepas satu field. Pertama kali menulis daftar eksplisit; hasil kosong menghapus `fields`. */
export function toggleField(
	page: PageDefinition,
	index: number,
	name: string,
	all: readonly FieldOption[]
): PageDefinition {
	const region = page.regions[index];
	if (!region || !FIELD_PICK_TYPES.includes(region.type) || !all.some((f) => f.name === name)) return page;
	const current = effectiveFields(region, all);
	const next = current.includes(name) ? current.filter((n) => n !== name) : [...current, name];
	if (next.length > fieldLimit(region.type)) return page;
	return withFields(page, index, next);
}

/** Geser satu field terpilih `delta` posisi (−1 naik, +1 turun). */
export function moveField(page: PageDefinition, index: number, name: string, delta: number): PageDefinition {
	const region = page.regions[index];
	if (!region?.fields) return page;
	const from = region.fields.indexOf(name);
	const to = from + delta;
	if (from < 0 || to < 0 || to >= region.fields.length) return page;
	const next = [...region.fields];
	next.splice(to, 0, next.splice(from, 1)[0]);
	return withFields(page, index, next);
}

/** Kembali ke default (semua field tabel). */
export function resetFields(page: PageDefinition, index: number): PageDefinition {
	return withFields(page, index, undefined);
}

function withFilters(page: PageDefinition, index: number, filters: RegionFilter[]): PageDefinition {
	const current = page.regions[index];
	if (!current || !FILTER_TYPES.includes(current.type)) return page;
	const next = { ...current };
	if (filters.length > 0) next.filters = filters;
	else delete next.filters;
	return { ...page, regions: page.regions.map((r, i) => (i === index ? next : r)) };
}

/** Tambah satu filter `eq` kosong; ditolak bila sudah `FILTERS_MAX` atau field kosong. */
export function addFilter(page: PageDefinition, index: number, field: string, value: string): PageDefinition {
	const current = page.regions[index]?.filters ?? [];
	if (current.length >= FILTERS_MAX || !field) return page;
	return withFilters(page, index, [...current, { field, op: 'eq', value }]);
}

export function updateFilter(
	page: PageDefinition,
	index: number,
	position: number,
	patch: Partial<Pick<RegionFilter, 'field' | 'value'>>
): PageDefinition {
	const current = page.regions[index]?.filters;
	if (!current?.[position]) return page;
	return withFilters(
		page,
		index,
		current.map((f, i) => (i === position ? { ...f, ...patch } : f))
	);
}

/** Hapus satu filter; daftar kosong menghapus properti `filters`. */
export function removeFilter(page: PageDefinition, index: number, position: number): PageDefinition {
	const current = page.regions[index]?.filters;
	if (!current?.[position]) return page;
	return withFilters(
		page,
		index,
		current.filter((_, i) => i !== position)
	);
}

function withItems(page: PageDefinition, items: PageItem[]): PageDefinition {
	const next = { ...page };
	if (items.length > 0) next.items = items;
	else delete next.items;
	return next;
}

/** Id item berikutnya yang bebas: P1_ITEM, P2_ITEM, … (pola ADR C000). */
export function nextItemId(page: PageDefinition, suffix = 'ITEM'): string {
	const used = new Set((page.items ?? []).map((i) => i.id));
	for (let n = 1; n <= ITEMS_MAX + 1; n++) if (!used.has(`P${n}_${suffix}`)) return `P${n}_${suffix}`;
	return `P99_${suffix}`;
}

/** Tambah item `text` baru; ditolak bila sudah `ITEMS_MAX`. */
export function addItem(page: PageDefinition): PageDefinition {
	const items = page.items ?? [];
	if (items.length >= ITEMS_MAX) return page;
	return withItems(page, [...items, { id: nextItemId(page), type: 'text', label: 'Item' }]);
}

/** Ubah satu item; tipe non-select menghapus `options`, dan `default` kosong dihapus. */
export function updateItem(page: PageDefinition, index: number, patch: Partial<PageItem>): PageDefinition {
	const items = page.items;
	if (!items?.[index]) return page;
	const merged: PageItem = { ...items[index], ...patch };
	if (merged.type !== 'select') {
		delete merged.options;
		delete merged.lov;
	}
	if (!merged.lov) delete merged.lov;
	else {
		// LOV bersama menggantikan opsi dan nilai awal (opsi baru diketahui saat runtime).
		delete merged.options;
		delete merged.default;
	}
	if (merged.default === '' || merged.default === undefined) delete merged.default;
	if (!merged.source?.query) delete merged.source;
	return withItems(
		page,
		items.map((it, i) => (i === index ? merged : it))
	);
}

/** Hapus item dan semua filter yang merujuknya (agar draft tetap valid). */
export function removeItem(page: PageDefinition, index: number): PageDefinition {
	const items = page.items;
	const gone = items?.[index];
	if (!items || !gone) return page;
	const ref = `:${gone.id}`;
	const regions = page.regions.map((region) => {
		if (!region.filters?.some((f) => f.value === ref)) return region;
		const kept = region.filters.filter((f) => f.value !== ref);
		const next = { ...region };
		if (kept.length > 0) next.filters = kept;
		else delete next.filters;
		return next;
	});
	return pruneActions(withItems({ ...page, regions }, items.filter((_, i) => i !== index)));
}

/** Ganti region, item, dan aksi dengan isi template bersama; id dan judul halaman dipertahankan (P7). */
export function applyTemplate(page: PageDefinition, template: Partial<PageDefinition>): PageDefinition {
	return {
		id: page.id,
		title: page.title,
		regions: (template.regions ?? []).map((r) => ({ ...r })),
		...(template.items?.length ? { items: template.items.map((i) => ({ ...i })) } : {}),
		...(template.actions?.length ? { actions: template.actions.map((a) => ({ ...a })) } : {})
	};
}

/**
 * Pindahkan region ke posisi sisip `to` (diukur pada urutan SEBELUM region
 * dicabut, seperti indeks drop di kanvas). Sama dengan posisi sekarang = tak berubah.
 */
export function moveRegionTo(page: PageDefinition, from: number, to: number): PageDefinition {
	const n = page.regions.length;
	if (from < 0 || from >= n || to < 0 || to > n || to === from || to === from + 1) return page;
	const regions = [...page.regions];
	const [moved] = regions.splice(from, 1);
	regions.splice(to > from ? to - 1 : to, 0, moved);
	return { ...page, regions };
}

/** Sisipkan region baru (seperti `addRegion`) di posisi `index`; di luar batas = di akhir. */
export function insertRegionAt(page: PageDefinition, type: string, resourceId: string, index: number): PageDefinition {
	const added = addRegion(page, type, resourceId);
	if (added === page) return page;
	const at = Math.max(0, Math.min(index, page.regions.length));
	return moveRegionTo(added, added.regions.length - 1, at);
}

/** Region baru dari palet: seperti `insertRegionAt`, dan grafik langsung memilih field pengelompokan pertama yang layak. */
export function insertPaletteRegion(
	page: PageDefinition,
	type: string,
	resourceId: string,
	where: number | Spot,
	fields: readonly { name: string; type?: string }[] = []
): PageDefinition {
	const spot = typeof where === 'number' ? topLevelSpot(page, where) : where;
	const next = insertRegionIn(page, type, resourceId, spot);
	if (next === page) return next;
	const created = next.regions.find((r) => !page.regions.some((o) => o.id === r.id));
	const at = created ? next.regions.indexOf(created) : next.regions.length - 1;
	switch (type) {
		case 'chart': {
			const first = fields.find((f) => f.type === 'select' || f.type === 'toggle') ?? fields[0];
			return first ? updateRegion(next, at, { groupBy: first.name }) : next;
		}
		case 'kanban': {
			const first = fields.find((f) => f.type === 'select');
			return first ? updateRegion(next, at, { groupBy: first.name }) : next;
		}
		case 'calendar': {
			const first = fields.find((f) => f.type === 'date');
			return first ? updateRegion(next, at, { dateField: first.name }) : next;
		}
		case 'text':
			return updateRegion(next, at, { text: { heading: 'Text' } });
		default:
			return next;
	}
}

/** Kontrol yang bisa dijatuhkan ke kanvas: item halaman (P4). Urutan = urutan di palet. */
export const CONTROL_TYPES = ['text', 'select', 'date', 'switch', 'button'] as const satisfies readonly ItemType[];

/** Sisipkan item baru bertipe `type` di posisi `index` (di luar batas = di akhir); ditolak bila sudah `ITEMS_MAX`. */
export function insertItemAt(page: PageDefinition, type: ItemType, index: number, label: string): PageDefinition {
	const items = page.items ?? [];
	if (items.length >= ITEMS_MAX) return page;
	const item: PageItem = {
		id: nextItemId(page, type === 'button' ? 'BUTTON' : 'ITEM'),
		type,
		label,
		...(type === 'select' ? { options: ['option'] } : {})
	};
	const at = Math.max(0, Math.min(index, items.length));
	return withItems(page, [...items.slice(0, at), item, ...items.slice(at)]);
}

/** Pindahkan item ke posisi sisip `to` (diukur sebelum dicabut, seperti `moveRegionTo`). */
export function moveItemTo(page: PageDefinition, from: number, to: number): PageDefinition {
	const items = page.items ?? [];
	const n = items.length;
	if (from < 0 || from >= n || to < 0 || to > n || to === from || to === from + 1) return page;
	const next = [...items];
	const [moved] = next.splice(from, 1);
	next.splice(to > from ? to - 1 : to, 0, moved);
	return withItems(page, next);
}

/**
 * Taruh field `name` di depan field `before` (null = di akhir) pada daftar field
 * efektif region; field yang belum tampil ikut ditambahkan. Dipakai seret-lepas
 * kolom daftar dan field form di kanvas.
 */
export function moveFieldTo(
	page: PageDefinition,
	index: number,
	name: string,
	before: string | null,
	all: readonly FieldOption[]
): PageDefinition {
	const region = page.regions[index];
	if (!region || !FIELD_PICK_TYPES.includes(region.type) || !all.some((f) => f.name === name)) return page;
	const current = effectiveFields(region, all);
	const rest = current.filter((n) => n !== name);
	const found = before === null ? -1 : rest.indexOf(before);
	const at = found < 0 ? rest.length : found;
	const next = [...rest.slice(0, at), name, ...rest.slice(at)];
	if (next.length > fieldLimit(region.type) || (next.length === current.length && next.every((n, i) => n === current[i]))) return page;
	return withFields(page, index, next);
}

/** Buang aksi, langkah, dan syarat yang merujuk item/region yang sudah tidak ada, agar draft tetap valid. */
export function pruneActions(page: PageDefinition): PageDefinition {
	if (!page.actions) return page;
	const items = new Set((page.items ?? []).map((i) => i.id));
	const regions = new Set(page.regions.map((r) => r.id));
	const stepOk = (step: ActionStep): boolean => {
		switch (step.type) {
			case 'set_item':
			case 'enable':
			case 'disable':
				return items.has(step.item);
			case 'show':
			case 'hide':
			case 'refresh_region':
			case 'open_dialog':
				return regions.has(step.region);
			case 'call_server_action':
				return step.idItem === undefined || items.has(step.idItem);
			default:
				return true;
		}
	};
	const onOk = (on: string): boolean => {
		const event = /^(submit_success|dialog_close):(.+)$/.exec(on);
		return on === 'load' || items.has(on) || (event !== null && regions.has(event[2]));
	};
	const kept: PageAction[] = [];
	for (const action of page.actions) {
		if (!onOk(action.on) || (action.when && !items.has(action.when.item))) continue;
		const steps = action.do.filter(stepOk);
		if (steps.length > 0) kept.push({ ...action, do: steps });
	}
	const next = { ...page };
	if (kept.length > 0) next.actions = kept;
	else delete next.actions;
	return next;
}

export const CLICK_STEP_TYPES = ['set_item', 'show', 'hide', 'refresh_region', 'open_dialog', 'navigate', 'enable', 'disable'] as const;
export type ClickStepType = (typeof CLICK_STEP_TYPES)[number];

/** Aksi yang dijalankan saat item (tombol) diklik: aksi pertama dengan `on` = id item. */
export function clickAction(page: PageDefinition, itemId: string): PageAction | undefined {
	return page.actions?.find((a) => a.on === itemId);
}

/** Langkah awal yang valid untuk `type`; null bila halaman belum punya sasarannya (mis. tidak ada region). */
export function defaultStep(page: PageDefinition, type: ClickStepType, resources: readonly string[]): ActionStep | null {
	const item = page.items?.find((i) => i.type !== 'button')?.id;
	const anyItem = page.items?.[0]?.id;
	const region = page.regions[0]?.id;
	switch (type) {
		case 'set_item':
			return item ? { type, item, value: '' } : null;
		case 'enable':
		case 'disable':
			return anyItem ? { type, item: anyItem } : null;
		case 'show':
		case 'hide':
		case 'refresh_region':
			return region ? { type, region } : null;
		case 'open_dialog': {
			const dialog = page.regions.find((r) => r.dialog)?.id;
			return dialog ? { type, region: dialog } : null;
		}
		case 'navigate':
			return resources[0] ? { type, resourceId: resources[0] } : null;
	}
}

function nextActionId(page: PageDefinition): string {
	const used = new Set((page.actions ?? []).map((a) => a.id));
	for (let n = 1; n <= ACTIONS_MAX + 1; n++) {
		const id = `A${String(n).padStart(3, '0')}`;
		if (!used.has(id)) return id;
	}
	return 'A999';
}

/** Tambah satu langkah ke aksi klik item (aksi dibuat bila belum ada); ditolak bila melewati batas. */
export function addClickStep(page: PageDefinition, itemId: string, step: ActionStep): PageDefinition {
	const actions = page.actions ?? [];
	const existing = actions.find((a) => a.on === itemId);
	if (existing) {
		if (existing.do.length >= ACTION_STEPS_MAX) return page;
		return { ...page, actions: actions.map((a) => (a === existing ? { ...a, do: [...a.do, step] } : a)) };
	}
	if (actions.length >= ACTIONS_MAX) return page;
	return { ...page, actions: [...actions, { id: nextActionId(page), on: itemId, do: [step] }] };
}

/** Ganti langkah ke-`position` pada aksi klik item. */
export function updateClickStep(page: PageDefinition, itemId: string, position: number, step: ActionStep): PageDefinition {
	const existing = clickAction(page, itemId);
	if (!existing?.do[position]) return page;
	return {
		...page,
		actions: (page.actions ?? []).map((a) => (a === existing ? { ...a, do: a.do.map((s, i) => (i === position ? step : s)) } : a))
	};
}

/** Hapus langkah; aksi tanpa langkah ikut dihapus, dan `actions` kosong dibuang. */
export function removeClickStep(page: PageDefinition, itemId: string, position: number): PageDefinition {
	const existing = clickAction(page, itemId);
	if (!existing?.do[position]) return page;
	const remaining = existing.do.filter((_, i) => i !== position);
	const actions = (page.actions ?? []).flatMap((a) => (a !== existing ? [a] : remaining.length > 0 ? [{ ...a, do: remaining }] : []));
	const next = { ...page };
	if (actions.length > 0) next.actions = actions;
	else delete next.actions;
	return next;
}

export type StepTargetKind = 'item' | 'region' | 'resource';

/** Jenis sasaran langkah: item, region, atau resource (yang diedit lewat satu `<select>`). */
export function stepTargetKind(step: ActionStep): StepTargetKind | null {
	switch (step.type) {
		case 'set_item':
		case 'enable':
		case 'disable':
			return 'item';
		case 'show':
		case 'hide':
		case 'refresh_region':
		case 'open_dialog':
			return 'region';
		case 'navigate':
			return 'resource';
		default:
			return null;
	}
}

export function stepTarget(step: ActionStep): string {
	switch (step.type) {
		case 'set_item':
		case 'enable':
		case 'disable':
			return step.item;
		case 'show':
		case 'hide':
		case 'refresh_region':
		case 'open_dialog':
			return step.region;
		case 'navigate':
			return step.resourceId;
		default:
			return '';
	}
}

/** Langkah yang sama dengan sasaran diganti `value`. */
export function retargetStep(step: ActionStep, value: string): ActionStep {
	switch (step.type) {
		case 'set_item':
		case 'enable':
		case 'disable':
			return { ...step, item: value };
		case 'show':
		case 'hide':
		case 'refresh_region':
		case 'open_dialog':
			return { ...step, region: value };
		case 'navigate':
			return { ...step, resourceId: value };
		default:
			return step;
	}
}

/** Titik sisip di antara saudara: di dalam wadah `parent` (tab `slot`), di depan saudara `before`; tanpa `before` = di akhir. Tanpa `parent` = tingkat atas. */
export interface Spot {
	parent?: string;
	slot?: string;
	before?: string;
}

/** Spot di tingkat atas untuk indeks sisip `index` di antara region tingkat atas. */
export function topLevelSpot(page: PageDefinition, index: number): Spot {
	const top = childrenOf(page, undefined);
	const before = top[index]?.id;
	return before ? { before } : {};
}

/** Saudara dalam urutan tampil: region dengan `parent` (dan `slot`) yang sama. */
export function childrenOf(page: PageDefinition, parent: string | undefined, slot?: string): RegionDefinition[] {
	return page.regions.filter((r) => r.parent === parent && (parent === undefined || slot === undefined || r.slot === slot));
}

/** Wadah di atas `id`, terdekat dulu; berhenti bila rantai putus atau berulang. */
export function ancestorsOf(page: PageDefinition, id: string): RegionDefinition[] {
	const byId = new Map(page.regions.map((r) => [r.id, r]));
	const out: RegionDefinition[] = [];
	const seen = new Set<string>([id]);
	for (let cur = byId.get(id)?.parent; cur !== undefined && !seen.has(cur); cur = byId.get(cur)?.parent) {
		const parent = byId.get(cur);
		if (!parent) break;
		seen.add(cur);
		out.push(parent);
	}
	return out;
}

/** Semua region di dalam `id` (anak, cucu, ...). */
export function descendantsOf(page: PageDefinition, id: string): RegionDefinition[] {
	const out: RegionDefinition[] = [];
	const queue = [id];
	const seen = new Set<string>(queue);
	while (queue.length > 0) {
		const at = queue.shift() as string;
		for (const r of page.regions) {
			if (r.parent === at && !seen.has(r.id)) {
				seen.add(r.id);
				out.push(r);
				queue.push(r.id);
			}
		}
	}
	return out;
}

/** Tinggi subpohon: 0 untuk region tanpa isi, 1 bila hanya berisi daun, dst. */
function subtreeHeight(page: PageDefinition, id: string): number {
	const kids = page.regions.filter((r) => r.parent === id);
	return kids.length === 0 ? 0 : 1 + Math.max(...kids.map((k) => subtreeHeight(page, k.id)));
}

/**
 * Tempat yang sah untuk sebuah region di dalam wadah `spot.parent`: wadah itu harus ada,
 * bertipe tabs/panel, bukan region yang dipindah atau isinya, dan kedalaman akhir (termasuk
 * isi region yang dipindah) tidak melewati `MAX_ANCESTORS`. Tab tanpa slot yang sah memakai tab pertama.
 */
function placement(page: PageDefinition, spot: Spot, moving?: RegionDefinition): { parent?: string; slot?: string } | null {
	if (spot.parent === undefined) return {};
	const parent = page.regions.find((r) => r.id === spot.parent);
	if (!parent || !CONTAINER_TYPES.includes(parent.type) || moving?.dialog) return null;
	if (moving && (moving.id === parent.id || descendantsOf(page, moving.id).some((r) => r.id === parent.id))) return null;
	const height = moving ? subtreeHeight(page, moving.id) : 0;
	if (ancestorsOf(page, parent.id).length + 1 + height > MAX_ANCESTORS) return null;
	if (parent.type === 'tabs') {
		const ids = (parent.tabs ?? []).map((t) => t.id);
		const slot = spot.slot && ids.includes(spot.slot) ? spot.slot : ids[0];
		return slot ? { parent: parent.id, slot } : null;
	}
	return { parent: parent.id };
}

/** Posisi di array datar untuk region baru di antara saudara: di depan `before`, atau setelah saudara terakhir (atau wadahnya). */
function flatIndex(regions: readonly RegionDefinition[], spot: { parent?: string; slot?: string }, before?: string): number {
	const same = (r: RegionDefinition) => r.parent === spot.parent && (spot.parent === undefined || r.slot === spot.slot);
	if (before) {
		const at = regions.findIndex((r) => r.id === before && same(r));
		if (at >= 0) return at;
	}
	let last = -1;
	regions.forEach((r, i) => {
		if (same(r)) last = i;
	});
	if (last >= 0) return last + 1;
	if (spot.parent !== undefined) return regions.findIndex((r) => r.id === spot.parent) + 1;
	return regions.length;
}

/** Sisipkan region baru (seperti `addRegion`) di `spot`. Ditolak (page yang sama) bila melewati batas atau tempatnya tidak sah. */
export function insertRegionIn(page: PageDefinition, type: string, resourceId: string, spot: Spot = {}): PageDefinition {
	if (page.regions.length >= MAX_REGIONS) return page;
	const place = placement(page, spot);
	if (!place) return page;
	const added = addRegion(page, type, resourceId).regions[page.regions.length];
	const region: RegionDefinition = { ...added, ...(place.parent ? { parent: place.parent } : {}), ...(place.slot ? { slot: place.slot } : {}) };
	const regions = [...page.regions];
	regions.splice(flatIndex(regions, place, spot.before), 0, region);
	return normalizeFree({ ...page, regions });
}

/** Pindahkan region `id` (beserta isinya) ke `spot`; ditolak bila tempatnya tidak sah (mis. ke dalam dirinya sendiri). */
export function moveRegionInto(page: PageDefinition, id: string, spot: Spot): PageDefinition {
	const region = page.regions.find((r) => r.id === id);
	if (!region || spot.before === id) return page;
	const place = placement(page, spot, region);
	if (!place) return page;
	const moved: RegionDefinition = { ...region };
	delete moved.parent;
	delete moved.slot;
	if (place.parent) moved.parent = place.parent;
	if (place.slot) moved.slot = place.slot;
	const without = page.regions.filter((r) => r.id !== id);
	const next = [...without];
	next.splice(flatIndex(next, place, spot.before), 0, moved);
	// Tidak berubah bila tetap di wadah/tab yang sama dan urutan saudaranya sama (urutan array datar di luar saudara tidak berarti).
	if (region.parent === place.parent && region.slot === place.slot) {
		const ids = (list: readonly RegionDefinition[]) => childrenOf({ ...page, regions: [...list] }, place.parent, place.slot).map((r) => r.id).join('|');
		if (ids(page.regions) === ids(next)) return page;
	}
	return normalizeFree({ ...page, regions: next });
}

/** Geser region `id` satu langkah di antara saudaranya (urutan tampil), tanpa keluar dari wadahnya. */
export function shiftRegion(page: PageDefinition, id: string, delta: -1 | 1): PageDefinition {
	const region = page.regions.find((r) => r.id === id);
	if (!region) return page;
	const siblings = childrenOf(page, region.parent, region.slot);
	const at = siblings.findIndex((r) => r.id === id);
	const other = siblings[at + delta];
	if (at < 0 || !other) return page;
	const regions = [...page.regions];
	const a = regions.findIndex((r) => r.id === id);
	const b = regions.findIndex((r) => r.id === other.id);
	[regions[a], regions[b]] = [regions[b], regions[a]];
	return { ...page, regions };
}

/** Hapus region `id` beserta seluruh isinya, dan buang aksi yang merujuknya. */
export function removeRegionDeep(page: PageDefinition, id: string): PageDefinition {
	const gone = new Set([id, ...descendantsOf(page, id).map((r) => r.id)]);
	return pruneActions({ ...page, regions: page.regions.filter((r) => !gone.has(r.id)) });
}

/**
 * Jaga tautan `parent`/`slot` tetap sah setelah perubahan: parent yang hilang atau bukan wadah
 * dilepas (region naik ke tingkat atas), tab tanpa slot yang sah memakai tab pertama, dan
 * wadah panel tidak membawa slot.
 */
export function normalizeNesting(page: PageDefinition): PageDefinition {
	const byId = new Map(page.regions.map((r) => [r.id, r]));
	let changed = false;
	const regions = page.regions.map((r) => {
		if (r.parent === undefined && r.slot === undefined) return r;
		const parent = r.parent !== undefined ? byId.get(r.parent) : undefined;
		const next: RegionDefinition = { ...r };
		if (!parent || !CONTAINER_TYPES.includes(parent.type)) {
			delete next.parent;
			delete next.slot;
		} else if (parent.type === 'tabs') {
			const ids = (parent.tabs ?? []).map((t) => t.id);
			if (!next.slot || !ids.includes(next.slot)) {
				if (ids[0]) next.slot = ids[0];
				else delete next.slot;
			}
		} else {
			delete next.slot;
		}
		if (next.parent === r.parent && next.slot === r.slot) return r;
		changed = true;
		return next;
	});
	return normalizeFree(changed ? { ...page, regions } : page);
}

function nextTabId(tabs: readonly { id: string }[]): string {
	const used = new Set(tabs.map((t) => t.id));
	for (let n = 1; ; n++) if (!used.has(`tab${n}`)) return `tab${n}`;
}

/** Tambah satu tab ke region tabs `id` (maks `TABS_MAX`). */
export function addTab(page: PageDefinition, id: string, label: string): PageDefinition {
	const region = page.regions.find((r) => r.id === id);
	if (!region || region.type !== 'tabs' || (region.tabs?.length ?? 0) >= TABS_MAX) return page;
	const tabs = [...(region.tabs ?? []), { id: nextTabId(region.tabs ?? []), label }];
	return { ...page, regions: page.regions.map((r) => (r.id === id ? { ...r, tabs } : r)) };
}

/** Ganti label satu tab. */
export function renameTab(page: PageDefinition, id: string, tabId: string, label: string): PageDefinition {
	const region = page.regions.find((r) => r.id === id);
	if (!region?.tabs?.some((t) => t.id === tabId)) return page;
	const tabs = region.tabs.map((t) => (t.id === tabId ? { ...t, label } : t));
	return { ...page, regions: page.regions.map((r) => (r.id === id ? { ...r, tabs } : r)) };
}

/** Hapus satu tab (sisa sedikitnya satu); isinya pindah ke tab pertama yang tersisa. */
export function removeTab(page: PageDefinition, id: string, tabId: string): PageDefinition {
	const region = page.regions.find((r) => r.id === id);
	if (!region?.tabs || region.tabs.length < 2 || !region.tabs.some((t) => t.id === tabId)) return page;
	const tabs = region.tabs.filter((t) => t.id !== tabId);
	const regions = page.regions.map((r) => (r.id === id ? { ...r, tabs } : r.parent === id && r.slot === tabId ? { ...r, slot: tabs[0].id } : r));
	return { ...page, regions };
}

// ---- Kanvas bebas (mode `free`) ---------------------------------------------------------------

export interface FreeBox {
	x: number;
	y: number;
	span: number;
	h: number;
}

/** Tinggi awal (baris 3rem) per tipe region saat ditaruh di kanvas bebas. */
export function defaultHeight(type: string): number {
	switch (type) {
		case 'kpi':
		case 'text':
		case 'facets':
			return 3;
		case 'tabs':
		case 'panel':
		case 'calendar':
			return 9;
		case 'resource-form':
			return 8;
		default:
			return 7;
	}
}

const clampInt = (v: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(v)));

/** Paksa kotak ke dalam batas kanvas: lebar 1-12, x muat di 12 kolom, baris 0-199, tinggi 1-60. */
export function clampBox(box: FreeBox): FreeBox {
	const span = clampInt(box.span, 1, GRID_COLUMNS);
	return { span, x: clampInt(box.x, 0, GRID_COLUMNS - span), y: clampInt(box.y, 0, FREE_ROWS - 1), h: clampInt(box.h, 1, FREE_HEIGHT_MAX) };
}

export function boxOf(region: RegionDefinition): FreeBox | null {
	const l = region.layout;
	return l && l.x !== undefined && l.y !== undefined && l.h !== undefined && l.span !== undefined ? { x: l.x, y: l.y, span: l.span, h: l.h } : null;
}

/** Region yang diposisikan bebas: tingkat atas, bukan dialog, di halaman `free`. */
export const isPlaced = (page: PageDefinition, r: RegionDefinition): boolean => page.mode === 'free' && r.parent === undefined && !r.dialog;

/**
 * Menjaga invarian kanvas bebas: region yang diposisikan tanpa kotak lengkap diberi kotak
 * di bawah semua region lain (lebar penuh atau `span`-nya), dan region lain (halaman
 * mengalir, bersarang, dialog) tidak membawa koordinat.
 */
export function normalizeFree(page: PageDefinition): PageDefinition {
	let bottom = 0;
	for (const r of page.regions) {
		const b = isPlaced(page, r) ? boxOf(r) : null;
		if (b) bottom = Math.max(bottom, b.y + b.h);
	}
	let changed = false;
	const regions = page.regions.map((r) => {
		const l = r.layout;
		if (!isPlaced(page, r)) {
			if (!l || (l.x === undefined && l.y === undefined && l.h === undefined)) return r;
			changed = true;
			const { x: _x, y: _y, h: _h, ...rest } = l;
			const next = { ...r };
			if (Object.keys(rest).length > 0) next.layout = rest;
			else delete next.layout;
			return next;
		}
		if (boxOf(r) && !l?.newRow) return r;
		changed = true;
		const h = l?.h ?? defaultHeight(r.type);
		const span = l?.span ?? GRID_COLUMNS;
		const box = clampBox({ x: 0, y: bottom, span, h });
		bottom += box.h;
		return { ...r, layout: box };
	});
	return changed ? { ...page, regions } : page;
}

/**
 * Pindah halaman antara grid mengalir dan kanvas bebas. Ke bebas: posisi diturunkan dari
 * susunan mengalir saat ini (baris demi baris). Ke mengalir: urutan mengikuti y lalu x, dan
 * region di baris atas yang baru memulai baris baru (`newRow`).
 */
export function setFreeMode(page: PageDefinition, free: boolean): PageDefinition {
	if ((page.mode === 'free') === free) return page;
	if (free) {
		let cx = 0;
		let y = 0;
		let rowH = 0;
		const regions = page.regions.map((r) => {
			if (r.parent !== undefined || r.dialog) return r;
			const span = r.layout?.span ?? GRID_COLUMNS;
			const h = defaultHeight(r.type);
			if ((r.layout?.newRow && cx > 0) || cx + span > GRID_COLUMNS) {
				y += rowH;
				cx = 0;
				rowH = 0;
			}
			const box = clampBox({ x: cx, y, span, h });
			cx += span;
			rowH = Math.max(rowH, h);
			return { ...r, layout: box };
		});
		return normalizeFree({ ...page, mode: 'free', regions });
	}
	const placed = page.regions.filter((r) => isPlaced(page, r));
	const sorted = [...placed].sort((a, b) => (boxOf(a)?.y ?? 0) - (boxOf(b)?.y ?? 0) || (boxOf(a)?.x ?? 0) - (boxOf(b)?.x ?? 0));
	const out: RegionDefinition[] = [];
	let lastY: number | null = null;
	for (const r of sorted) {
		const b = boxOf(r);
		const layout: RegionLayout = { span: b?.span ?? GRID_COLUMNS, ...(lastY !== null && b && b.y !== lastY ? { newRow: true } : {}) };
		lastY = b?.y ?? lastY;
		out.push({ ...r, layout });
		out.push(...descendantsOf(page, r.id));
	}
	const rest = page.regions.filter((r) => !out.some((o) => o.id === r.id));
	const { mode: _mode, ...base } = page;
	return { ...base, regions: [...out, ...rest] };
}

/** Atur kotak region tingkat atas di kanvas bebas (dijepit ke batas); halaman yang sama bila tidak berubah. */
export function placeRegion(page: PageDefinition, id: string, box: FreeBox): PageDefinition {
	const region = page.regions.find((r) => r.id === id);
	if (!region || !isPlaced(page, region)) return page;
	const next = clampBox(box);
	const cur = boxOf(region);
	if (cur && cur.x === next.x && cur.y === next.y && cur.span === next.span && cur.h === next.h) return page;
	return { ...page, regions: page.regions.map((r) => (r.id === id ? { ...r, layout: next } : r)) };
}
