/**
 * Registry komponen runtime (MR-02): satu allowlist statis untuk renderer.
 *
 * Impor komponen dilakukan di berkas ini lewat impor statis biasa, bukan lewat
 * `eval`, import path dari metadata, atau registrasi runtime dari browser.
 * Manifest di sini hanya metadata tampilan; `ResourceMeta` tetap sumber field
 * dan izin, dan `ResourceListPage` yang sudah ada dipakai ulang apa adanya.
 */
import type { Component } from 'svelte';
import type { ResourceMeta } from '$lib/api/resource-types';
import ResourceListPage from '$lib/renderer/pages/ResourceListPage.svelte';
import IrReportRegion from './IrReportRegion.svelte';
import ChartRegion from './ChartRegion.svelte';
import KpiRegion from './KpiRegion.svelte';
import CalendarViewRegion from './CalendarViewRegion.svelte';
import CardsViewRegion from './CardsViewRegion.svelte';
import FacetsViewRegion from './FacetsViewRegion.svelte';
import GridViewRegion from './GridViewRegion.svelte';
import KanbanRegion from './KanbanRegion.svelte';
import TextRegion from './TextRegion.svelte';
import RegionOrganism from '$lib/kit/organisms/Region.svelte';
import TabsOrganism from '$lib/kit/organisms/Tabs.svelte';
import { CONTAINER_TYPES } from './page-definition';
import ResourceFormRegion from './ResourceFormRegion.svelte';
import type { FormMode } from './page-definition';
import type { ResourceRecord } from '$lib/api/resource-types';
import { Button } from '$lib/components/ui/button';
import * as Card from '$lib/components/ui/card';
import { RESOURCE_LIST_REGION, registry } from '$lib/kit/catalog';

/** Props yang boleh dipasok runtime ke sebuah region (allowlist tertutup). */
export interface RegionProps {
	meta: ResourceMeta;
	mode?: FormMode;
	record?: ResourceRecord | null;
	prefill?: Record<string, unknown>;
	/** Kolom terpilih dari definisi halaman (B011); hanya dipakai region daftar/laporan. */
	fields?: string[];
	/** Sort dan ukuran halaman awal dari definisi halaman (D004). */
	sort?: { field: string; dir: 'asc' | 'desc' };
	pageSize?: number;
	filters?: { field: string; op: 'eq'; value: string }[];
	rowAction?: 'edit' | 'none' | 'select';
	/** Dipanggil dengan id baris saat rowAction `select`. */
	onrowselect?: (id: string) => void;
	metric?: { fn: 'count' | 'sum' | 'avg' | 'min' | 'max'; field?: string };
	groupBy?: string;
	/** `calendar`: field tanggal yang digambar. */
	dateField?: string;
	/** `text`: isi statis. */
	text?: { heading?: string; body?: string };
	ondone?: () => void;
	process?: { regionId: string };
}

export interface ComponentManifest {
	/** Key region; sama dengan `RegionDefinition.type`. */
	key: string;
	/** Kelompok komponen (tier atomic design) di registry. */
	category: string;
	/** Cadangan bila kunci i18n tidak ada. */
	label: string;
	/** Kunci i18n untuk label. */
	labelKey: string;
	version: number;
	/** Boleh dipilih sebagai region PageDefinition; false = hanya discoverable. */
	capabilities: { runtimeRegion: boolean };
	/** Region ini hanya render bila `resourceId`-nya ketemu di ResourceMeta. */
	requiresResource: boolean;
}

interface RegistryEntry {
	manifest: ComponentManifest;
	/** Komponen existing untuk discovery (props beragam, tidak dipasang ke region). */
	ref: Component<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
	/** Renderer region; hanya ada bila capability runtimeRegion. */
	region?: Component<RegionProps>;
}

/** Referensi komponen existing per key registry (bukan salinan). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const COMPONENTS: Record<string, Component<any>> = {
	[RESOURCE_LIST_REGION]: ResourceListPage,
	button: Button,
	card: Card.Root,
	'ir-report': IrReportRegion,
	chart: ChartRegion,
	kpi: KpiRegion,
	cards: CardsViewRegion,
	calendar: CalendarViewRegion,
	facets: FacetsViewRegion,
	grid: GridViewRegion,
	kanban: KanbanRegion,
	text: TextRegion,
	tabs: TabsOrganism,
	panel: RegionOrganism,
	'resource-form': ResourceFormRegion
};

const REGISTRY: readonly RegistryEntry[] = registry.flatMap((entry) => {
	if (!entry.runtime) return [];
	const key = entry.runtime.key ?? entry.id;
	const ref = COMPONENTS[key];
	if (!ref) throw new Error(`registry: ${key} tidak punya komponen`);
	const runtimeRegion = entry.runtime.capabilities.runtimeRegion;
	return [
		{
			manifest: {
				key,
				category: entry.tier,
				label: entry.title,
				labelKey: entry.runtime.labelKey,
				version: entry.runtime.version,
				capabilities: { runtimeRegion },
				requiresResource: entry.runtime.requiresResource
			},
			ref,
			// Wadah (tabs/panel) digambar PageRuntime bersama anak-anaknya, jadi tidak punya renderer region sendiri.
			region: runtimeRegion && !CONTAINER_TYPES.includes(key) ? (ref as Component<RegionProps>) : undefined
		}
	];
});

const BY_KEY: ReadonlyMap<string, RegistryEntry> = new Map(
	REGISTRY.map((entry) => [entry.manifest.key, entry])
);

/** Manifest yang terdaftar, urut sesuai deklarasi. Read-only bagi pemanggil. */
export function listComponentManifests(): ComponentManifest[] {
	return REGISTRY.map((entry) => ({ ...entry.manifest }));
}

/** Manifest satu key, atau undefined bila key tidak dikenal (fail terkontrol). */
export function getComponentManifest(key: string): ComponentManifest | undefined {
	const entry = BY_KEY.get(key);
	return entry ? { ...entry.manifest } : undefined;
}

/** Renderer region untuk satu key, atau undefined bila tidak dikenal atau bukan region (fail terkontrol). */
export function resolveRegionComponent(key: string): Component<RegionProps> | undefined {
	return BY_KEY.get(key)?.region;
}

/** Referensi komponen existing untuk discovery (Button/Card/IR), atau undefined bila key tidak dikenal. */
export function resolveComponentRef(key: string): Component<any> | undefined { // eslint-disable-line @typescript-eslint/no-explicit-any
	return BY_KEY.get(key)?.ref;
}
