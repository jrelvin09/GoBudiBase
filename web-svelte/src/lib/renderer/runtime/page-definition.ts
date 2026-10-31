/**
 * Kontrak Page/Region untuk pilot metadata runtime (MR-01).
 *
 * Hanya data yang bisa diserialisasi: tidak ada komponen, fungsi, SQL, nama
 * tabel, atau definisi field. Field dan izin tetap milik `ResourceMeta` dari
 * server — region `resource-list` hanya menunjuk id resource yang sudah
 * terdaftar, dan runtime yang mencocokkannya dengan metadata yang dimuat route.
 */

import { RESOURCE_LIST_REGION, registry } from '$lib/kit/catalog';

export { RESOURCE_LIST_REGION };

/** Tipe region yang boleh dipakai = entri registry dengan capability runtimeRegion (bukan daftar kedua). */
export const REGION_TYPES: readonly string[] = registry
	.filter((entry) => entry.runtime?.capabilities.runtimeRegion)
	.map((entry) => entry.runtime?.key ?? entry.id);

export type RegionType = string;

/** Tipe region yang boleh membawa `fields` (B010). */
export const FIELDS_REGION_TYPES: readonly string[] = ['resource-list', 'ir-report'];
/** Tipe region yang boleh memilih field: daftar/laporan (kolom) dan form (field tampil, P6). */
/** Tipe region yang boleh memakai filter statis: daftar, laporan, KPI, grafik, dan papan kanban. */
export const FILTER_TYPES: readonly string[] = [...FIELDS_REGION_TYPES, 'kpi', 'chart', 'kanban'];
/** Region kartu: `fields` = isi kartu berurutan (judul, subjudul, lencana, isi), maksimal `CARD_FIELDS_MAX`. */
export const CARD_REGION_TYPES: readonly string[] = ['cards', 'kanban'];
export const CARD_FIELDS_MAX = 4;
/** Tipe region yang mengelompokkan menurut satu field (`groupBy`): grafik dan kanban (kolom = opsi field select). */
export const GROUP_TYPES: readonly string[] = ['chart', 'kanban'];
/** Region wadah: tab dan panel. Region lain bisa berada di dalamnya lewat `parent` (dan `slot` untuk tab). */
export const CONTAINER_TYPES: readonly string[] = ['tabs', 'panel'];
export const TABS_MAX = 8;
export const TAB_LABEL_MAX = 60;
export const PANEL_TITLE_MAX = 120;
/** Satu region berada di dalam paling banyak ini wadah (tab di dalam panel, dan komponen di dalamnya). */
export const MAX_ANCESTORS = 2;
export const TAB_ID_PATTERN = /^[a-z][a-z0-9_]{0,31}$/;
export const TEXT_HEADING_MAX = 120;
export const TEXT_BODY_MAX = 2000;
/** Langkah proses halaman terdaftar di server (F001). */
export const PROCESS_STEPS = ['validate', 'resource.create', 'audit'] as const;

/** Urutan sah: langkah dikenal, tanpa duplikat, validate pertama, resource.create wajib, audit terakhir. */
export function validProcess(steps: readonly unknown[]): boolean {
	if (steps.length < 1 || steps.length > PROCESS_STEPS.length) return false;
	const names = steps as string[];
	if (!names.every((s) => (PROCESS_STEPS as readonly string[]).includes(s)) || new Set(names).size !== names.length) return false;
	if (!names.includes('resource.create')) return false;
	if (names.includes('validate') && names[0] !== 'validate') return false;
	if (names.includes('audit') && names[names.length - 1] !== 'audit') return false;
	return true;
}

export const METRIC_FNS = ['count', 'sum', 'avg', 'min', 'max'] as const;
export type MetricFn = (typeof METRIC_FNS)[number];
export const FIELD_PICK_TYPES: readonly string[] = [...FIELDS_REGION_TYPES, ...CARD_REGION_TYPES, 'resource-form'];
export const FIELD_NAME_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;
export const FIELDS_MAX = 50;
/** Cermin `fw.ReportPageSizes` di server. */
export const FILTERS_MAX = 5;
export const FILTER_VALUE_MAX = 128;
export const PAGE_SIZES: readonly number[] = [5, 10, 15, 20, 25, 50, 100, 200, 500, 1000];

export type FormMode = 'create' | 'edit';
export const FORM_REGION = 'resource-form';

/** Kode masalah validasi yang dikenal runtime dan builder. */
export const ISSUE_CODES = [
	'invalid_page',
	'invalid_id',
	'invalid_title',
	'invalid_shared_ref',
	'invalid_group_by',
	'invalid_date_field',
	'invalid_text',
	'invalid_parent',
	'invalid_container',
	'invalid_layout',
	'invalid_regions',
	'invalid_region',
	'duplicate_id',
	'unknown_type',
	'invalid_resource',
	'invalid_mode',
	'unknown_resource',
	'cross_resource',
	'id_mismatch',
	'page_not_registered',
	'too_large',
	'unknown_field',
	'invalid_fields',
	'unknown_field_ref',
	'duplicate_field',
	'invalid_binding',
	'invalid_process',
	'invalid_metric',
	'invalid_sort',
	'invalid_page_size',
	'invalid_filter',
	'too_many_filters',
	'invalid_row_action',
	'invalid_items',
	'invalid_item',
	'unknown_item_ref',
	'invalid_actions',
	'invalid_action',
	'unknown_action_ref'
] as const;

export type IssueCode = (typeof ISSUE_CODES)[number];

export interface RegionDefinition {
	/** Stabil dan unik di dalam satu page; dipakai sebagai key saat render. */
	id: string;
	type: RegionType;
	/** Id resource yang sudah terdaftar di server, mis. "sales.customer". */
	resourceId: string;
	/** Hanya untuk `resource-form`: create atau edit. Record ID tidak pernah ada di sini; route yang memasoknya. */
	mode?: FormMode;
	/** Hanya `resource-list` dan `ir-report` (B010): nama field, urutan = urutan kolom. Tanpa properti ini = semua field tabel default. */
	fields?: string[];
	/** Sort awal (D001); hanya `resource-list`/`ir-report`. Presentasi, bukan otorisasi. */
	sort?: RegionSort;
	/** Ukuran halaman awal (D001); salah satu `PAGE_SIZES`. */
	pageSize?: number;
	/** Filter statis `eq` (D005); maks `FILTERS_MAX`. Presentasi, bukan otorisasi. */
	filters?: RegionFilter[];
	/** Aksi klik baris (D009): `edit` (perilaku sekarang), `none`, atau `select` (master-detail: menulis id baris ke `rowItem`). */
	rowAction?: 'edit' | 'none' | 'select';
	/** Hanya dengan rowAction `select`: id item halaman yang menerima id baris terpilih. */
	rowItem?: string;
	/** `kpi` dan `chart`: satu agregat atas field resource. */
	metric?: { fn: MetricFn; field?: string };
	/** Hanya `chart`: field pengelompokan; metrik dihitung per kelompok. */
	groupBy?: string;
	/** Hanya `resource-form` mode create: proses terdaftar saat simpan (F001). */
	onSubmit?: string[];
	/** Region ditampilkan hanya di dialog lewat aksi `open_dialog` (P5). */
	dialog?: boolean;
	/** Nama data source bersama (P7) yang mengisi fields/sort/pageSize/filters yang tidak diatur region. */
	datasource?: string;
	/** Nama skema otorisasi bersama (P7): region tampil dan prosesnya jalan hanya bila izin skema dimiliki. */
	auth?: string;
	/** Penempatan di grid 12 kolom (P8). Tanpa layout = lebar penuh. Tidak berlaku untuk region dialog. */
	layout?: RegionLayout;
	/** Hanya `calendar`: field tanggal yang digambar. */
	dateField?: string;
	/** Hanya `text`: isi statis (teks polos, tanpa HTML). */
	text?: RegionText;
	/** Id region wadah (tabs/panel) tempat region ini berada; tanpa ini region berada di tingkat atas. */
	parent?: string;
	/** Id tab di dalam `parent` bertipe tabs; tidak ada untuk wadah lain. */
	slot?: string;
	/** Hanya `tabs`: daftar tab (1-8). */
	tabs?: RegionTab[];
	/** Hanya `panel`: judul panel, dan apakah bisa dilipat. */
	title?: string;
	collapsible?: boolean;
}

export interface RegionTab {
	id: string;
	label: string;
}

export interface RegionText {
	heading?: string;
	body?: string;
}

export const GRID_COLUMNS = 12;

/** Kanvas bebas: baris 0-199, tinggi 1-60 baris (3rem per baris). */
export const FREE_ROWS = 200;
export const FREE_HEIGHT_MAX = 60;

/**
 * `span`: lebar dalam kolom (1-12, bawaan 12); `newRow`: mulai di baris baru.
 * Halaman `mode: 'free'`: region tingkat atas membawa kotak penuh `x` (kolom 0-11),
 * `y` (baris), `span` (lebar) dan `h` (tinggi dalam baris); di tempat lain dilarang.
 */
export interface RegionLayout {
	span?: number;
	newRow?: boolean;
	x?: number;
	y?: number;
	h?: number;
}

export interface RegionFilter {
	field: string;
	op: 'eq';
	value: string;
}

export interface RegionSort {
	field: string;
	dir: 'asc' | 'desc';
}

export const ITEM_TYPES = ['text', 'select', 'switch', 'date', 'button'] as const;
export type ItemType = (typeof ITEM_TYPES)[number];
export const ITEM_ID_PATTERN = /^P[0-9]+_[A-Z0-9_]{1,40}$/;
export const ITEM_REF_PATTERN = /^:P[0-9]+_[A-Z0-9_]{1,40}$/;
/** Variabel konteks tepercaya (P4): dari sesi server/rute, tidak pernah dari input bebas. */
export const CONTEXT_REF_PATTERN = /^:(user\.id|company\.id|location\.id|route\.[a-z][a-z0-9_]{0,31})$/;
export const ITEMS_MAX = 30;
export const SHARED_NAME_PATTERN = /^[a-z][a-z0-9_]{0,47}$/;

export interface PageItem {
	id: string;
	type: ItemType;
	label: string;
	/** Selalu string; switch memakai "true"/"false". */
	default?: string;
	/** Untuk `select`: wajib salah satu dari `options` atau `lov`. */
	options?: string[];
	/** Nama LOV bersama (P7) yang memasok opsi `select`; tidak boleh bersama `options`. */
	lov?: string;
	/** Inisialisasi dari query URL yang dideklarasikan. */
	source?: { query: string };
}

export const ACTION_ID_PATTERN = /^A[0-9]{1,3}$/;
export const ACTIONS_MAX = 20;
export const ACTION_STEPS_MAX = 5;
export const ACTION_OPS = ['eq', 'neq', 'empty', 'notEmpty'] as const;
export type ActionOp = (typeof ACTION_OPS)[number];

export type ActionStep =
	| { type: 'set_item'; item: string; value: string }
	| { type: 'show' | 'hide'; region: string }
	| { type: 'navigate'; resourceId: string }
	| { type: 'enable' | 'disable'; item: string }
	| { type: 'refresh_region' | 'open_dialog'; region: string }
	| { type: 'call_server_action'; resourceId: string; action: string; idItem?: string };

export interface PageAction {
	id: string;
	/** `load` atau id item yang nilainya berubah. */
	on: string;
	when?: { item: string; op: ActionOp; value?: string };
	do: ActionStep[];
}

export interface PageDefinition {
	/** Id page, mis. "sales.customer". */
	id: string;
	/** Judul cadangan; teks yang tampil tetap lewat ResourceMeta/i18n. */
	title: string;
	/** Item halaman bertipe (P4, ADR C000); state bersama antar region. */
	items?: PageItem[];
	/** Aksi dinamis terdaftar (P5, ADR A000): event item -> langkah tetap, tanpa skrip. */
	actions?: PageAction[];
	/** `free`: region tingkat atas diposisikan bebas (`layout.x/y/span/h`); tanpa mode = grid mengalir. */
	mode?: 'free';
	regions: RegionDefinition[];
}

export interface PageDefinitionIssue {
	/** `page`, id region, atau `#<index>` bila id region itu sendiri tidak valid. */
	location: string;
	/** Kode stabil dan aman ditampilkan; UI memetakannya lewat i18n. */
	code: string;
}

export type PageDefinitionResult =
	| { ok: true; page: PageDefinition }
	| { ok: false; issues: PageDefinitionIssue[] };

/** Huruf kecil, angka, titik, garis bawah, tanda hubung — sama seperti id resource. */
const ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/;
const TITLE_MAX_LENGTH = 200;

const KNOWN_TYPES = REGION_TYPES;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Mengembalikan id apa adanya bila aman ditampilkan (cocok `ID_PATTERN`),
 * selain itu penanda posisi `#<index>`. Lokasi tidak pernah memuat teks bebas
 * dari input, jadi hasil validasi selalu aman dirender.
 */
function issueLocation(id: unknown, index: number): string {
	return typeof id === 'string' && ID_PATTERN.test(id) ? id : `#${index}`;
}

/**
 * Memvalidasi sebuah PageDefinition secara deterministik dan fail-closed:
 * semua masalah dikumpulkan dalam satu lintasan (urutan tetap: page dulu, lalu
 * region sesuai urutan array), dan tidak ada page yang dikembalikan bila ada
 * satu masalah pun.
 */
export function validatePageDefinition(input: unknown): PageDefinitionResult {
	if (!isRecord(input)) {
		return { ok: false, issues: [{ location: 'page', code: 'invalid_page' }] };
	}

	const issues: PageDefinitionIssue[] = [];

	if (typeof input.id !== 'string' || !ID_PATTERN.test(input.id)) {
		issues.push({ location: 'page', code: 'invalid_id' });
	}
	if (
		typeof input.title !== 'string' ||
		input.title.trim() === '' ||
		input.title.length > TITLE_MAX_LENGTH
	) {
		issues.push({ location: 'page', code: 'invalid_title' });
	}

	if (input.mode !== undefined && input.mode !== 'free') {
		issues.push({ location: 'page', code: 'invalid_mode' });
	}
	const free = input.mode === 'free';

	const itemResult = validateItems(input.items, issues);

	const actionsRaw = input.actions;

	const rawRegions = input.regions;
	if (!Array.isArray(rawRegions) || rawRegions.length === 0) {
		issues.push({ location: 'page', code: 'invalid_regions' });
		return { ok: false, issues };
	}

	const seen = new Set<string>();
	const regions: RegionDefinition[] = [];
	for (const [index, raw] of rawRegions.entries()) {
		if (!isRecord(raw)) {
			issues.push({ location: `#${index}`, code: 'invalid_region' });
			continue;
		}
		const location = issueLocation(raw.id, index);
		let clean = true;

		if (typeof raw.id !== 'string' || !ID_PATTERN.test(raw.id)) {
			issues.push({ location, code: 'invalid_id' });
			clean = false;
		} else if (seen.has(raw.id)) {
			issues.push({ location, code: 'duplicate_id' });
			clean = false;
		} else {
			seen.add(raw.id);
		}

		if (typeof raw.type !== 'string' || !KNOWN_TYPES.includes(raw.type)) {
			issues.push({ location, code: 'unknown_type' });
			clean = false;
		}

		if (typeof raw.resourceId !== 'string' || !ID_PATTERN.test(raw.resourceId)) {
			issues.push({ location, code: 'invalid_resource' });
			clean = false;
		}

		const isForm = raw.type === FORM_REGION;
		if (isForm ? raw.mode !== 'create' && raw.mode !== 'edit' : raw.mode !== undefined) {
			issues.push({ location, code: 'invalid_mode' });
			clean = false;
		}

		let fields: string[] | undefined;
		if (raw.fields !== undefined) {
			const list = raw.fields;
			if (
				!FIELD_PICK_TYPES.includes(raw.type as string) ||
				!Array.isArray(list) ||
				list.length < 1 ||
				list.length > (CARD_REGION_TYPES.includes(raw.type as string) ? CARD_FIELDS_MAX : FIELDS_MAX) ||
				list.some((n) => typeof n !== 'string' || !FIELD_NAME_PATTERN.test(n))
			) {
				issues.push({ location, code: 'invalid_fields' });
				clean = false;
			} else if (new Set(list).size !== list.length) {
				issues.push({ location, code: 'duplicate_field' });
				clean = false;
			} else {
				fields = [...(list as string[])];
			}
		}

		let sort: RegionSort | undefined;
		let pageSize: number | undefined;
		if (raw.sort !== undefined || raw.pageSize !== undefined) {
			if (!FIELDS_REGION_TYPES.includes(raw.type as string)) {
				issues.push({ location, code: 'invalid_binding' });
				clean = false;
			} else {
				if (raw.sort !== undefined) {
					const s = raw.sort;
					if (
						!isRecord(s) ||
						typeof s.field !== 'string' ||
						!FIELD_NAME_PATTERN.test(s.field) ||
						(s.dir !== 'asc' && s.dir !== 'desc')
					) {
						issues.push({ location, code: 'invalid_sort' });
						clean = false;
					} else {
						sort = { field: s.field, dir: s.dir };
					}
				}
				if (raw.pageSize !== undefined) {
					if (typeof raw.pageSize !== 'number' || !PAGE_SIZES.includes(raw.pageSize)) {
						issues.push({ location, code: 'invalid_page_size' });
						clean = false;
					} else {
						pageSize = raw.pageSize;
					}
				}
			}
		}

		if (raw.dialog !== undefined && raw.dialog !== true) {
			issues.push({ location, code: 'invalid_binding' });
			clean = false;
		}
		let onSubmit: string[] | undefined;
		if (raw.onSubmit !== undefined) {
			if (raw.type !== FORM_REGION || raw.mode !== 'create' || !Array.isArray(raw.onSubmit) || !validProcess(raw.onSubmit)) {
				issues.push({ location, code: 'invalid_process' });
				clean = false;
			} else {
				onSubmit = [...(raw.onSubmit as string[])];
			}
		}
		let metric: RegionDefinition['metric'];
		if (raw.type === 'kpi' || raw.type === 'chart') {
			const m = raw.metric;
			const fieldOk = isRecord(m) && (m.field === undefined || (typeof m.field === 'string' && FIELD_NAME_PATTERN.test(m.field)));
			if (!isRecord(m) || !(METRIC_FNS as readonly unknown[]).includes(m.fn) || !fieldOk || (m.fn !== 'count' && m.field === undefined)) {
				issues.push({ location, code: 'invalid_metric' });
				clean = false;
			} else {
				metric = { fn: m.fn as MetricFn, ...(m.field ? { field: m.field as string } : {}) };
			}
		} else if (raw.metric !== undefined) {
			issues.push({ location, code: 'invalid_metric' });
			clean = false;
		}
		let rowAction: 'edit' | 'none' | 'select' | undefined;
		let rowItem: string | undefined;
		if (raw.rowAction !== undefined) {
			if (!FIELDS_REGION_TYPES.includes(raw.type as string) || (raw.rowAction !== 'edit' && raw.rowAction !== 'none' && raw.rowAction !== 'select') || (raw.rowAction === 'select' && raw.type !== 'ir-report')) {
				issues.push({ location, code: 'invalid_row_action' });
				clean = false;
			} else {
				rowAction = raw.rowAction;
			}
		}
		const declaredItems = new Set((itemResult ?? []).map((i) => i.id));
		if (rowAction === 'select' ? typeof raw.rowItem !== 'string' || !declaredItems.has(raw.rowItem) : raw.rowItem !== undefined) {
			issues.push({ location, code: 'invalid_row_action' });
			clean = false;
		} else if (rowAction === 'select') {
			rowItem = raw.rowItem as string;
		}
		let layout: RegionLayout | undefined;
		if (raw.layout !== undefined) {
			const l = raw.layout;
			const valid =
				isRecord(l) &&
				raw.dialog !== true &&
				Object.keys(l).every((k) => k === 'span' || k === 'newRow' || k === 'x' || k === 'y' || k === 'h') &&
				(l.x === undefined || intIn(l.x, 0, GRID_COLUMNS - 1)) &&
				(l.y === undefined || intIn(l.y, 0, FREE_ROWS - 1)) &&
				(l.h === undefined || intIn(l.h, 1, FREE_HEIGHT_MAX)) &&
				(l.span === undefined || (typeof l.span === 'number' && Number.isInteger(l.span) && l.span >= 1 && l.span <= GRID_COLUMNS)) &&
				(l.newRow === undefined || typeof l.newRow === 'boolean');
			if (!valid) {
				issues.push({ location, code: 'invalid_layout' });
				clean = false;
			} else {
				const lay = l as RegionLayout;
				layout = {
					...(lay.span !== undefined ? { span: lay.span } : {}),
					...(lay.newRow ? { newRow: true } : {}),
					...(lay.x !== undefined ? { x: lay.x } : {}),
					...(lay.y !== undefined ? { y: lay.y } : {}),
					...(lay.h !== undefined ? { h: lay.h } : {})
				};
			}
		}
		let groupBy: string | undefined;
		if (GROUP_TYPES.includes(raw.type as string) ? typeof raw.groupBy !== 'string' || !FIELD_NAME_PATTERN.test(raw.groupBy) : raw.groupBy !== undefined) {
			issues.push({ location, code: 'invalid_group_by' });
			clean = false;
		} else if (GROUP_TYPES.includes(raw.type as string)) {
			groupBy = raw.groupBy as string;
		}
		let dateField: string | undefined;
		if (raw.type === 'calendar' ? typeof raw.dateField !== 'string' || !FIELD_NAME_PATTERN.test(raw.dateField) : raw.dateField !== undefined) {
			issues.push({ location, code: 'invalid_date_field' });
			clean = false;
		} else if (raw.type === 'calendar') {
			dateField = raw.dateField as string;
		}
		let tabs: RegionTab[] | undefined;
		if (raw.type === 'tabs' ? !validTabs(raw.tabs) : raw.tabs !== undefined) {
			issues.push({ location, code: 'invalid_container' });
			clean = false;
		} else if (raw.type === 'tabs') {
			tabs = (raw.tabs as RegionTab[]).map((tab) => ({ id: tab.id, label: tab.label }));
		}
		let title: string | undefined;
		if (
			raw.title !== undefined &&
			(raw.type !== 'panel' || typeof raw.title !== 'string' || raw.title.length > PANEL_TITLE_MAX)
		) {
			issues.push({ location, code: 'invalid_container' });
			clean = false;
		} else if (typeof raw.title === 'string' && raw.title !== '') {
			title = raw.title;
		}
		if (raw.collapsible !== undefined && (raw.type !== 'panel' || raw.collapsible !== true)) {
			issues.push({ location, code: 'invalid_container' });
			clean = false;
		}
		let parent: string | undefined;
		let slot: string | undefined;
		if (raw.parent !== undefined) {
			if (typeof raw.parent !== 'string' || !ID_PATTERN.test(raw.parent) || raw.dialog === true) {
				issues.push({ location, code: 'invalid_parent' });
				clean = false;
			} else {
				parent = raw.parent;
			}
		}
		if (raw.slot !== undefined) {
			if (typeof raw.slot !== 'string' || !TAB_ID_PATTERN.test(raw.slot)) {
				issues.push({ location, code: 'invalid_parent' });
				clean = false;
			} else {
				slot = raw.slot;
			}
		}
		let text: RegionText | undefined;
		if (raw.type === 'text' ? !validText(raw.text) : raw.text !== undefined) {
			issues.push({ location, code: 'invalid_text' });
			clean = false;
		} else if (raw.type === 'text') {
			const tx = raw.text as RegionText;
			text = { ...(tx.heading ? { heading: tx.heading } : {}), ...(tx.body ? { body: tx.body } : {}) };
		}
		let datasource: string | undefined;
		if (raw.datasource !== undefined) {
			if (typeof raw.datasource !== 'string' || !SHARED_NAME_PATTERN.test(raw.datasource) || !(raw.type === 'resource-list' || raw.type === 'ir-report')) {
				issues.push({ location, code: 'invalid_shared_ref' });
				clean = false;
			} else {
				datasource = raw.datasource;
			}
		}
		let auth: string | undefined;
		if (raw.auth !== undefined) {
			if (typeof raw.auth !== 'string' || !SHARED_NAME_PATTERN.test(raw.auth)) {
				issues.push({ location, code: 'invalid_shared_ref' });
				clean = false;
			} else {
				auth = raw.auth;
			}
		}
		let filters: RegionFilter[] | undefined;
		const declared = new Set((itemResult ?? []).map((i) => i.id));
		if (raw.filters !== undefined) {
			const list = raw.filters;
			if (!FILTER_TYPES.includes(raw.type as string) || !Array.isArray(list) || list.length < 1) {
				issues.push({ location, code: 'invalid_filter' });
				clean = false;
			} else if (list.length > FILTERS_MAX) {
				issues.push({ location, code: 'too_many_filters' });
				clean = false;
			} else if (
				list.some(
					(f) =>
						!isRecord(f) ||
						typeof f.field !== 'string' ||
						!FIELD_NAME_PATTERN.test(f.field) ||
						f.op !== 'eq' ||
						typeof f.value !== 'string' ||
						f.value.length < 1 ||
						f.value.length > FILTER_VALUE_MAX
				)
			) {
				issues.push({ location, code: 'invalid_filter' });
				clean = false;
			} else {
				filters = (list as RegionFilter[]).map((f) => ({ field: f.field, op: 'eq', value: f.value }));
				if (
					filters.some(
						(f) =>
							f.value.startsWith(':') &&
							!CONTEXT_REF_PATTERN.test(f.value) &&
							(!ITEM_REF_PATTERN.test(f.value) || !declared.has(f.value.slice(1)))
					)
				) {
					issues.push({ location, code: 'unknown_item_ref' });
					clean = false;
				}
			}
		}

		if (clean) {
			regions.push({
				id: raw.id as string,
				type: raw.type as RegionType,
				resourceId: raw.resourceId as string,
				...(isForm ? { mode: raw.mode as FormMode } : {}),
				...(fields ? { fields } : {}),
				...(sort ? { sort } : {}),
				...(pageSize ? { pageSize } : {}),
				...(filters ? { filters } : {}),
				...(rowAction ? { rowAction } : {}),
				...(rowItem ? { rowItem } : {}),
				...(metric ? { metric } : {}),
				...(groupBy ? { groupBy } : {}),
				...(layout ? { layout } : {}),
				...(dateField ? { dateField } : {}),
				...(text ? { text } : {}),
				...(parent ? { parent } : {}),
				...(slot ? { slot } : {}),
				...(tabs ? { tabs } : {}),
				...(title ? { title } : {}),
				...(raw.collapsible === true ? { collapsible: true } : {}),
				...(raw.dialog === true ? { dialog: true } : {}),
				...(datasource ? { datasource } : {}),
				...(auth ? { auth } : {}),
				...(onSubmit ? { onSubmit } : {})
			});
		}
	}

	validateNesting(regions, issues);
	validateFreeLayout(regions, free, issues);
	const actions = validateActions(actionsRaw, itemResult ?? [], regions, issues);
	if (issues.length > 0) {
		return { ok: false, issues };
	}
	return {
		ok: true,
		page: {
			id: input.id as string,
			title: input.title as string,
			...(itemResult && itemResult.length > 0 ? { items: itemResult } : {}),
			...(actions && actions.length > 0 ? { actions } : {}),
			...(free ? { mode: 'free' as const } : {}),
			regions
		}
	};
}

const intIn = (v: unknown, min: number, max: number): boolean => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

/**
 * Kotak bebas: di halaman `free` tiap region tingkat atas (bukan dialog) wajib punya
 * `x`, `y`, `span`, `h` utuh dan di dalam 12 kolom tanpa `newRow`; di tempat lain
 * (halaman mengalir, region bersarang) koordinat dilarang. Tumpang tindih diizinkan.
 */
function validateFreeLayout(regions: readonly RegionDefinition[], free: boolean, issues: PageDefinitionIssue[]): void {
	for (const r of regions) {
		const l = r.layout;
		const hasPos = l !== undefined && (l.x !== undefined || l.y !== undefined || l.h !== undefined);
		if (!(free && r.parent === undefined && !r.dialog)) {
			if (hasPos) issues.push({ location: r.id, code: 'invalid_layout' });
			continue;
		}
		const complete = l !== undefined && l.x !== undefined && l.y !== undefined && l.h !== undefined && l.span !== undefined && !l.newRow;
		if (!complete || l.x! + l.span! > GRID_COLUMNS) issues.push({ location: r.id, code: 'invalid_layout' });
	}
}

const ITEM_QUERY_PATTERN = /^[a-z][a-z0-9_]{0,31}$/;

/** Daftar tab: 1-8 entri `{id, label}`, id unik berpola `TAB_ID_PATTERN`, label tidak kosong dan dibatasi. */
function validTabs(value: unknown): boolean {
	if (!Array.isArray(value) || value.length < 1 || value.length > TABS_MAX) return false;
	const seen = new Set<string>();
	for (const tab of value) {
		if (!isRecord(tab) || !Object.keys(tab).every((k) => k === 'id' || k === 'label')) return false;
		if (typeof tab.id !== 'string' || !TAB_ID_PATTERN.test(tab.id) || seen.has(tab.id)) return false;
		if (typeof tab.label !== 'string' || tab.label.trim() === '' || tab.label.length > TAB_LABEL_MAX) return false;
		seen.add(tab.id);
	}
	return true;
}

/**
 * Tautan `parent`/`slot` antar-region (setelah tiap region valid sendiri): parent harus
 * region tabs atau panel di halaman yang sama, tab butuh `slot` salah satu id tab-nya
 * (wadah lain tanpa slot), tidak ada siklus, dan kedalaman paling banyak `MAX_ANCESTORS`.
 */
function validateNesting(regions: readonly RegionDefinition[], issues: PageDefinitionIssue[]): void {
	const byId = new Map(regions.map((r) => [r.id, r]));
	for (const r of regions) {
		if (r.parent === undefined) {
			if (r.slot !== undefined) issues.push({ location: r.id, code: 'invalid_parent' });
			continue;
		}
		const parent = byId.get(r.parent);
		if (!parent || parent.id === r.id || !CONTAINER_TYPES.includes(parent.type)) {
			issues.push({ location: r.id, code: 'invalid_parent' });
			continue;
		}
		const slotOk = parent.type === 'tabs' ? (parent.tabs ?? []).some((tab) => tab.id === r.slot) : r.slot === undefined;
		let depth = 0;
		const seen = new Set<string>();
		for (let cur: RegionDefinition | undefined = r; cur?.parent !== undefined; cur = byId.get(cur.parent)) {
			if (seen.has(cur.id)) {
				depth = MAX_ANCESTORS + 1;
				break;
			}
			seen.add(cur.id);
			if (!byId.has(cur.parent)) break;
			depth++;
		}
		if (!slotOk || depth > MAX_ANCESTORS) issues.push({ location: r.id, code: 'invalid_parent' });
	}
}

/** Isi region teks: hanya `heading`/`body` (string polos, dibatasi), sedikitnya satu tidak kosong. */
function validText(value: unknown): boolean {
	if (!isRecord(value) || !Object.keys(value).every((k) => k === 'heading' || k === 'body')) return false;
	const { heading, body } = value;
	if (heading !== undefined && (typeof heading !== 'string' || heading.length > TEXT_HEADING_MAX)) return false;
	if (body !== undefined && (typeof body !== 'string' || body.length > TEXT_BODY_MAX)) return false;
	return ((heading as string | undefined)?.trim() ?? '') !== '' || ((body as string | undefined)?.trim() ?? '') !== '';
}

/** Memvalidasi `items` halaman; mengisi `issues` dan mengembalikan item bersih (undefined bila tidak ada). */
function validateItems(raw: unknown, issues: PageDefinitionIssue[]): PageItem[] | undefined {
	if (raw === undefined) return undefined;
	if (!Array.isArray(raw) || raw.length < 1 || raw.length > ITEMS_MAX) {
		issues.push({ location: 'page', code: 'invalid_items' });
		return undefined;
	}
	const seen = new Set<string>();
	const out: PageItem[] = [];
	for (const [index, entry] of raw.entries()) {
		const location = `items[${index}]`;
		if (!isRecord(entry)) {
			issues.push({ location, code: 'invalid_item' });
			continue;
		}
		const { id, type, label } = entry;
		let ok =
			typeof id === 'string' &&
			ITEM_ID_PATTERN.test(id) &&
			typeof type === 'string' &&
			(ITEM_TYPES as readonly string[]).includes(type) &&
			typeof label === 'string' &&
			label.trim() !== '' &&
			label.length <= TITLE_MAX_LENGTH;
		if (ok && seen.has(id as string)) {
			issues.push({ location, code: 'duplicate_id' });
			continue;
		}
		const options = entry.options;
		if (ok) {
			const lov = entry.lov;
			if (type === 'select' && lov !== undefined) {
				ok = options === undefined && entry.default === undefined && typeof lov === 'string' && SHARED_NAME_PATTERN.test(lov);
			} else if (type === 'select') {
				ok =
					Array.isArray(options) &&
					options.length >= 1 &&
					options.length <= 20 &&
					options.every((o) => typeof o === 'string' && o.length >= 1 && o.length <= 64);
			} else {
				ok = options === undefined && lov === undefined;
			}
		}
		const def = entry.default;
		if (ok && def !== undefined) {
			ok = typeof def === 'string' && def.length <= 128;
			if (ok && type === 'select') ok = (options as string[]).includes(def as string);
			if (ok && type === 'switch') ok = def === 'true' || def === 'false';
		}
		const source = entry.source;
		if (ok && source !== undefined) {
			ok = isRecord(source) && typeof source.query === 'string' && ITEM_QUERY_PATTERN.test(source.query);
		}
		if (!ok) {
			issues.push({ location, code: 'invalid_item' });
			continue;
		}
		seen.add(id as string);
		out.push({
			id: id as string,
			type: type as ItemType,
			label: label as string,
			...(options ? { options: [...(options as string[])] } : {}),
			...(entry.lov ? { lov: entry.lov as string } : {}),
			...(def !== undefined ? { default: def as string } : {}),
			...(source ? { source: { query: (source as { query: string }).query } } : {})
		});
	}
	return out;
}

/** Memvalidasi `actions` (P5). Rujukan item/region harus dideklarasikan; `navigate` hanya id resource (server memeriksa registri). */
function validateActions(
	raw: unknown,
	items: readonly PageItem[],
	regions: readonly RegionDefinition[],
	issues: PageDefinitionIssue[]
): PageAction[] | undefined {
	if (raw === undefined) return undefined;
	if (!Array.isArray(raw) || raw.length < 1 || raw.length > ACTIONS_MAX) {
		issues.push({ location: 'page', code: 'invalid_actions' });
		return undefined;
	}
	const itemById = new Map(items.map((i) => [i.id, i]));
	const regionIds = new Set(regions.map((r) => r.id));
	const seen = new Set<string>();
	const out: PageAction[] = [];
	for (const [index, entry] of raw.entries()) {
		const location = `actions[${index}]`;
		if (!isRecord(entry) || typeof entry.id !== 'string' || !ACTION_ID_PATTERN.test(entry.id)) {
			issues.push({ location, code: 'invalid_action' });
			continue;
		}
		if (seen.has(entry.id)) {
			issues.push({ location, code: 'duplicate_id' });
			continue;
		}
		const on = entry.on;
		const eventRegion = typeof entry.on === 'string' ? /^(submit_success|dialog_close):(.+)$/.exec(entry.on) : null;
		const eventOk = eventRegion ? regionIds.has(eventRegion[2]) : false;
		if (typeof on !== 'string' || (on !== 'load' && !itemById.has(on) && !eventOk)) {
			issues.push({ location, code: typeof on === 'string' && ITEM_ID_PATTERN.test(on) ? 'unknown_action_ref' : 'invalid_action' });
			continue;
		}
		let when: PageAction['when'];
		if (entry.when !== undefined) {
			const w = entry.when;
			const needsValue = isRecord(w) && (w.op === 'eq' || w.op === 'neq');
			if (
				!isRecord(w) ||
				typeof w.item !== 'string' ||
				!(ACTION_OPS as readonly unknown[]).includes(w.op) ||
				(needsValue ? typeof w.value !== 'string' || w.value.length > 128 : w.value !== undefined)
			) {
				issues.push({ location, code: 'invalid_action' });
				continue;
			}
			if (!itemById.has(w.item)) {
				issues.push({ location, code: 'unknown_action_ref' });
				continue;
			}
			when = { item: w.item, op: w.op as ActionOp, ...(needsValue ? { value: w.value as string } : {}) };
		}
		const steps = entry.do;
		if (!Array.isArray(steps) || steps.length < 1 || steps.length > ACTION_STEPS_MAX) {
			issues.push({ location, code: 'invalid_action' });
			continue;
		}
		const cleanSteps: ActionStep[] = [];
		let code: string | null = null;
		for (const step of steps) {
			if (!isRecord(step)) {
				code = 'invalid_action';
				break;
			}
			if (step.type === 'set_item') {
				const target = typeof step.item === 'string' ? itemById.get(step.item) : undefined;
				if (!target) code = 'unknown_action_ref';
				else if (typeof step.value !== 'string' || step.value.length > 128 || !itemValueOk(target, step.value)) code = 'invalid_action';
				else cleanSteps.push({ type: 'set_item', item: step.item as string, value: step.value });
			} else if (step.type === 'show' || step.type === 'hide') {
				if (typeof step.region !== 'string' || !regionIds.has(step.region)) code = 'unknown_action_ref';
				else cleanSteps.push({ type: step.type, region: step.region });
			} else if (step.type === 'enable' || step.type === 'disable') {
				if (typeof step.item !== 'string' || !itemById.has(step.item)) code = 'unknown_action_ref';
				else cleanSteps.push({ type: step.type, item: step.item });
			} else if (step.type === 'refresh_region' || step.type === 'open_dialog') {
				if (typeof step.region !== 'string' || !regionIds.has(step.region)) code = 'unknown_action_ref';
				else cleanSteps.push({ type: step.type, region: step.region });
			} else if (step.type === 'call_server_action') {
				const idItemOk = step.idItem === undefined || (typeof step.idItem === 'string' && itemById.has(step.idItem));
				if (typeof step.resourceId !== 'string' || !ID_PATTERN.test(step.resourceId) || typeof step.action !== 'string' || !/^[a-z][a-z0-9_]{0,63}$/.test(step.action)) code = 'invalid_action';
				else if (!idItemOk) code = 'unknown_action_ref';
				else cleanSteps.push({ type: 'call_server_action', resourceId: step.resourceId, action: step.action, ...(step.idItem ? { idItem: step.idItem as string } : {}) });
			} else if (step.type === 'navigate') {
				if (typeof step.resourceId !== 'string' || !ID_PATTERN.test(step.resourceId)) code = 'invalid_action';
				else cleanSteps.push({ type: 'navigate', resourceId: step.resourceId });
			} else {
				code = 'invalid_action';
			}
			if (code) break;
		}
		if (code) {
			issues.push({ location, code });
			continue;
		}
		seen.add(entry.id);
		out.push({ id: entry.id, on, ...(when ? { when } : {}), do: cleanSteps });
	}
	return out;
}

/** Nilai yang boleh diset ke item: kosong selalu boleh; select harus salah satu opsi; switch true/false. */
function itemValueOk(item: PageItem, value: string): boolean {
	if (value === '') return true;
	if (item.type === 'select') return item.options?.includes(value) ?? false;
	if (item.type === 'switch') return value === 'true' || value === 'false';
	if (item.type === 'date') return /^\d{4}-\d{2}-\d{2}$/.test(value);
	return true;
}
