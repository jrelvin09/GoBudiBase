import type { Component } from 'svelte';

export type CatalogEntry = {
	id: string;
	tier: 'atom' | 'molecule' | 'organism' | 'region' | 'page';
	/** Judul asli (Inggris). Dipakai apa adanya oleh entri lama dan menjadi
	 * cadangan bila kunci terjemahannya belum ada. */
	title: string;
	/** Kunci i18n judul; opsional agar 40 entri lama tidak perlu diubah. */
	titleKey?: string;
	/** Demo halaman /kit. Entri tanpa `load` hanya ada di registry, bukan demo. */
	load?: () => Promise<{ default: Component }>;
	/** Ada = boleh jadi tipe region PageDefinition; renderernya di runtime/component-registry.ts. */
	runtime?: RuntimeManifest;
};

/** Metadata tampilan region runtime; ResourceMeta tetap sumber field dan izin. */
export type RuntimeManifest = {
	/** Key region di PageDefinition bila beda dari id demo (mis. ir-table -> ir-report). */
	key?: string;
	labelKey: string;
	version: number;
	/** `runtimeRegion`: boleh dipilih sebagai region PageDefinition. false = hanya discoverable (butuh binding/props aman dulu). */
	capabilities: { runtimeRegion: boolean };
	/** Region hanya render bila resourceId-nya ketemu di ResourceMeta. */
	requiresResource: boolean;
};

/** Key region pilot metadata runtime (MR-01). */
export const RESOURCE_LIST_REGION = 'resource-list';

/** Satu-satunya deklarasi ID/manifest komponen: dipakai /kit, /kit/[id], dan allowlist region runtime. */
export const registry: CatalogEntry[] = [
	{
		id: RESOURCE_LIST_REGION,
		tier: 'region',
		title: 'Resource list',
		runtime: { labelKey: 'kit.runtime.region.resource-list', version: 1, capabilities: { runtimeRegion: true }, requiresResource: true }
	},
	{
		id: 'resource-form',
		tier: 'region',
		title: 'Resource form',
		runtime: { labelKey: 'kit.runtime.region.resource-form', version: 1, capabilities: { runtimeRegion: true }, requiresResource: true }
	},
	{
		id: 'chart-region',
		tier: 'region',
		title: 'Chart (aggregate by group)',
		runtime: { key: 'chart', labelKey: 'kit.runtime.region.chart', version: 1, capabilities: { runtimeRegion: true }, requiresResource: true }
	},
	{
		id: 'kpi',
		tier: 'region',
		title: 'KPI',
		runtime: { labelKey: 'kit.runtime.region.kpi', version: 1, capabilities: { runtimeRegion: true }, requiresResource: true }
	},
	{ id: 'button', tier: 'atom', title: 'Button', runtime: { labelKey: 'kit.runtime.region.button', version: 1, capabilities: { runtimeRegion: false }, requiresResource: false }, load: () => import('./demos/button.demo.svelte') },
	{ id: 'badge', tier: 'atom', title: 'Badge', load: () => import('./demos/badge.demo.svelte') },
	{ id: 'palette', tier: 'atom', title: 'Palette', load: () => import('./demos/palette.demo.svelte') },
	{ id: 'item', tier: 'molecule', title: 'Item', load: () => import('./demos/item.demo.svelte') },
	{ id: 'text-item', tier: 'molecule', title: 'Text Item', load: () => import('./demos/textitem.demo.svelte') },
	{ id: 'textarea-item', tier: 'molecule', title: 'Textarea Item', load: () => import('./demos/textareaitem.demo.svelte') },
	{ id: 'number-item', tier: 'molecule', title: 'Number Item', load: () => import('./demos/numberitem.demo.svelte') },
	{ id: 'date-picker', tier: 'molecule', title: 'Date Picker (Sederhana)', load: () => import('./demos/simpledatepicker.demo.svelte') },
	{ id: 'date-picker-item', tier: 'molecule', title: 'Date Range Picker', load: () => import('./demos/datepickeritem.demo.svelte') },
	{ id: 'select-list-item', tier: 'molecule', title: 'Select List Item', load: () => import('./demos/selectlistitem.demo.svelte') },
	{ id: 'radio-group-item', tier: 'molecule', title: 'Radio Group Item', load: () => import('./demos/radiogroupitem.demo.svelte') },
	{ id: 'checkbox-item', tier: 'molecule', title: 'Checkbox Item', load: () => import('./demos/checkboxitem.demo.svelte') },
	{ id: 'switch-item', tier: 'molecule', title: 'Switch Item', load: () => import('./demos/switchitem.demo.svelte') },
	{ id: 'display-only', tier: 'molecule', title: 'Display Only', runtime: { key: 'text', labelKey: 'kit.runtime.region.text', version: 1, capabilities: { runtimeRegion: true }, requiresResource: true }, load: () => import('./demos/displayonly.demo.svelte') },
	{ id: 'confirm', tier: 'molecule', title: 'Confirm Dialog', load: () => import('./demos/confirm.demo.svelte') },
	{ id: 'dialog-select', tier: 'organism', title: 'Dialog with a Select', load: () => import('./demos/dialog-select.demo.svelte') },
	{ id: 'shuttle', tier: 'molecule', title: 'Shuttle', load: () => import('./demos/shuttle.demo.svelte') },
	{ id: 'palette-picker', tier: 'molecule', title: 'Palette Picker', load: () => import('./demos/palettepicker.demo.svelte') },
	{ id: 'color-picker-item', tier: 'molecule', title: 'Color Picker Item', load: () => import('./demos/colorpickeritem.demo.svelte') },
	{ id: 'popup-lov-item', tier: 'molecule', title: 'Popup LOV Item', load: () => import('./demos/popuplovitem.demo.svelte') },
	{ id: 'file-item', tier: 'molecule', title: 'File Item', load: () => import('./demos/fileitem.demo.svelte') },
	{ id: 'image-item', tier: 'molecule', title: 'Image Item', load: () => import('./demos/imageitem.demo.svelte') },
	{ id: 'presets', tier: 'organism', title: 'Theme Presets', load: () => import('./demos/presets.demo.svelte') },
	{ id: 'chart', tier: 'organism', title: 'Charts', load: () => import('./demos/chart.demo.svelte') },
	{ id: 'region', tier: 'organism', title: 'Region', runtime: { key: 'panel', labelKey: 'kit.runtime.region.panel', version: 1, capabilities: { runtimeRegion: true }, requiresResource: false }, load: () => import('./demos/region.demo.svelte') },
	{ id: 'notification', tier: 'organism', title: 'Notification', load: () => import('./demos/notification.demo.svelte') },
	{ id: 'ir-table', tier: 'organism', title: 'IR Report Table', runtime: { key: 'ir-report', labelKey: 'kit.runtime.region.ir-report', version: 1, capabilities: { runtimeRegion: true }, requiresResource: true }, load: () => import('./demos/ir-table.demo.svelte') },
	{ id: 'ir-pagination', tier: 'organism', title: 'IR Pagination', load: () => import('./demos/ir-pagination.demo.svelte') },
	{ id: 'ir-searchbar', tier: 'organism', title: 'IR Search Bar', load: () => import('./demos/ir-searchbar.demo.svelte') },
	{ id: 'ir-chips', tier: 'organism', title: 'IR Settings Chips', load: () => import('./demos/ir-chips.demo.svelte') },
	{ id: 'ir-actions', tier: 'organism', title: 'IR Actions Menu', load: () => import('./demos/ir-actions.demo.svelte') },
	{ id: 'ig-grid', tier: 'organism', title: 'IG Grid', runtime: { key: 'grid', labelKey: 'kit.runtime.region.grid', version: 1, capabilities: { runtimeRegion: true }, requiresResource: true }, load: () => import('./demos/ig-grid.demo.svelte') },
	{ id: 'cards', tier: 'organism', title: 'Cards', runtime: { labelKey: 'kit.runtime.region.cards', version: 1, capabilities: { runtimeRegion: true }, requiresResource: true }, load: () => import('./demos/cards.demo.svelte') },
	{ id: 'facets', tier: 'organism', title: 'Facets', runtime: { labelKey: 'kit.runtime.region.facets', version: 1, capabilities: { runtimeRegion: true }, requiresResource: true }, load: () => import('./demos/facets.demo.svelte') },
	{ id: 'calendar', tier: 'organism', title: 'Calendar', runtime: { labelKey: 'kit.runtime.region.calendar', version: 1, capabilities: { runtimeRegion: true }, requiresResource: true }, load: () => import('./demos/calendar.demo.svelte') },
	{ id: 'tabs', tier: 'organism', title: 'Tabs', runtime: { labelKey: 'kit.runtime.region.tabs', version: 1, capabilities: { runtimeRegion: true }, requiresResource: false }, load: () => import('./demos/tabs.demo.svelte') },
	{ id: 'wizard-progress', tier: 'organism', title: 'Wizard Progress', load: () => import('./demos/wizardprogress.demo.svelte') },
	{ id: 'history-timeline', tier: 'organism', title: 'History Timeline', load: () => import('./demos/historytimeline.demo.svelte') },
	{ id: 'menu-popup', tier: 'molecule', title: 'Menu Popup', load: () => import('./demos/menu-popup.demo.svelte') },
	{ id: 'button-group', tier: 'molecule', title: 'Button Group', load: () => import('./demos/button-group.demo.svelte') },
	{ id: 'command-palette', tier: 'organism', title: 'Command Palette', load: () => import('./demos/commandpalette.demo.svelte') },

	// Gelombang B — pola visual & interaksi ringan dari Templates/Admin (docs/plans/templates-ui-kit-inventory.md).
	{ id: 'typography', tier: 'atom', title: 'Typography', titleKey: 'kit.catalog.typography', load: () => import('./demos/typography.demo.svelte') },
	{ id: 'avatar', tier: 'atom', title: 'Avatar', titleKey: 'kit.catalog.avatar', load: () => import('./demos/avatar.demo.svelte') },
	{ id: 'sparkline', tier: 'atom', title: 'Sparkline', titleKey: 'kit.catalog.sparkline', load: () => import('./demos/sparkline.demo.svelte') },
	{ id: 'breadcrumb', tier: 'molecule', title: 'Breadcrumb', titleKey: 'kit.catalog.breadcrumb', load: () => import('./demos/breadcrumb.demo.svelte') },
	{ id: 'list-group', tier: 'molecule', title: 'List Group', titleKey: 'kit.catalog.list-group', load: () => import('./demos/list-group.demo.svelte') },
	{ id: 'progress', tier: 'molecule', title: 'Progress', titleKey: 'kit.catalog.progress', load: () => import('./demos/progress.demo.svelte') },
	{ id: 'loading', tier: 'molecule', title: 'Loading & Skeleton', titleKey: 'kit.catalog.loading', load: () => import('./demos/loading.demo.svelte') },
	{ id: 'accordion', tier: 'molecule', title: 'Accordion & Collapse', titleKey: 'kit.catalog.accordion', load: () => import('./demos/accordion.demo.svelte') },
	{ id: 'tooltip-popover', tier: 'molecule', title: 'Tooltip & Popover', titleKey: 'kit.catalog.tooltip-popover', load: () => import('./demos/tooltip-popover.demo.svelte') },
	{ id: 'carousel', tier: 'molecule', title: 'Carousel', titleKey: 'kit.catalog.carousel', load: () => import('./demos/carousel.demo.svelte') },
	{ id: 'offcanvas', tier: 'molecule', title: 'Offcanvas (Sheet)', titleKey: 'kit.catalog.offcanvas', load: () => import('./demos/offcanvas.demo.svelte') },
	{ id: 'alert', tier: 'molecule', title: 'Inline Alert', titleKey: 'kit.catalog.alert', load: () => import('./demos/alert.demo.svelte') },
	{ id: 'card', tier: 'molecule', title: 'Card', titleKey: 'kit.catalog.card', runtime: { labelKey: 'kit.runtime.region.card', version: 1, capabilities: { runtimeRegion: false }, requiresResource: false }, load: () => import('./demos/card.demo.svelte') },
	{ id: 'empty-state', tier: 'molecule', title: 'Empty & Error State', titleKey: 'kit.catalog.empty-state', load: () => import('./demos/empty-state.demo.svelte') },
	{ id: 'stat-card', tier: 'organism', title: 'Stat Card (KPI)', titleKey: 'kit.catalog.stat-card', load: () => import('./demos/stat-card.demo.svelte') },
	{ id: 'landing-blocks', tier: 'organism', title: 'Landing Blocks', titleKey: 'kit.catalog.landing-blocks', load: () => import('./demos/landing-blocks.demo.svelte') },

	// Gelombang C — form, tabel statis, dan plugin ringan.
	{ id: 'input-group', tier: 'molecule', title: 'Input Group', titleKey: 'kit.catalog.input-group', load: () => import('./demos/input-group.demo.svelte') },
	{ id: 'validation', tier: 'molecule', title: 'Field Validation', titleKey: 'kit.catalog.validation', load: () => import('./demos/validation.demo.svelte') },
	{ id: 'range', tier: 'molecule', title: 'Range Slider', titleKey: 'kit.catalog.range', load: () => import('./demos/range.demo.svelte') },
	{ id: 'stepper', tier: 'molecule', title: 'Number Stepper', titleKey: 'kit.catalog.stepper', load: () => import('./demos/stepper.demo.svelte') },
	{ id: 'mask', tier: 'molecule', title: 'Masked Input', titleKey: 'kit.catalog.mask', load: () => import('./demos/mask.demo.svelte') },
	{ id: 'rating', tier: 'molecule', title: 'Rating', titleKey: 'kit.catalog.rating', load: () => import('./demos/rating.demo.svelte') },
	{ id: 'password-strength', tier: 'molecule', title: 'Password Strength', titleKey: 'kit.catalog.password-strength', load: () => import('./demos/password-strength.demo.svelte') },
	{ id: 'copy-button', tier: 'molecule', title: 'Copy to Clipboard', titleKey: 'kit.catalog.copy-button', load: () => import('./demos/copy-button.demo.svelte') },
	{ id: 'table', tier: 'organism', title: 'Static Table', titleKey: 'kit.catalog.table', load: () => import('./demos/table.demo.svelte') },

	// Gelombang D — grafik dan komposisi aplikasi.
	{ id: 'kanban', tier: 'organism', title: 'Kanban Board', titleKey: 'kit.catalog.kanban', runtime: { labelKey: 'kit.runtime.region.kanban', version: 1, capabilities: { runtimeRegion: true }, requiresResource: true }, load: () => import('./demos/kanban.demo.svelte') },
	{ id: 'invoice-preview', tier: 'organism', title: 'Invoice Preview', titleKey: 'kit.catalog.invoice-preview', load: () => import('./demos/invoice-preview.demo.svelte') },
	{ id: 'profile-header', tier: 'organism', title: 'Profile Header', titleKey: 'kit.catalog.profile-header', load: () => import('./demos/profile-header.demo.svelte') }
];

export function assertUnique(entries: CatalogEntry[]): void {
	const ids = new Set<string>();
	const keys = new Set<string>();
	for (const entry of entries) {
		if (ids.has(entry.id)) throw new Error(`registry: id ganda ${entry.id}`);
		ids.add(entry.id);
		const key = entry.runtime?.key ?? entry.id;
		if (entry.runtime) {
			if (keys.has(key)) throw new Error(`registry: key runtime ganda ${key}`);
			keys.add(key);
		}
	}
}

/** Gagal saat modul dimuat bila ID atau key runtime ganda. */
assertUnique(registry);

export type DemoEntry = CatalogEntry & { load: NonNullable<CatalogEntry['load']> };

/** Entri registry yang punya demo untuk halaman /kit. */
export const catalog: DemoEntry[] = registry.filter((entry): entry is DemoEntry => !!entry.load);
