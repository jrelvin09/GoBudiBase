/**
 * Perencanaan render Page/Region (MR-03): logika murni yang dipakai
 * `PageRuntime.svelte`, dipisah supaya bisa diuji tanpa DOM.
 *
 * Aturan penting: `ResourceMeta` yang diikat hanya metadata dengan id yang sama
 * dengan `resourceId` region. Metadata lain (atau metadata yang belum ada)
 * tidak pernah dipakai diam-diam — region itu jatuh ke state tidak ditemukan,
 * atau ke state error bila pemuatan metadata memang gagal.
 */
import type { ResourceMeta } from '$lib/api/resource-types';
import { getComponentManifest } from './component-registry';
import {
	ISSUE_CODES,
	validatePageDefinition,
	type PageDefinition,
	type PageDefinitionIssue,
	type RegionDefinition
} from './page-definition';

/** Status pemuatan metadata yang dikenal runtime (MR-R01). */
export type RuntimeStatus = 'loading' | 'ready' | 'error';

export type RegionPhase = RuntimeStatus | 'not_found' | 'unknown_region';

export interface RegionPlan {
	region: RegionDefinition;
	phase: RegionPhase;
}

export type PagePlan =
	| { state: 'invalid'; issues: PageDefinitionIssue[] }
	| { state: 'ready'; page: PageDefinition; regions: RegionPlan[] };

/**
 * Memetakan status store resource (idle|loading|ready|error) ke status runtime
 * tanpa menyatukan `error` dengan loading (MR-R01).
 */
export function runtimeStatus(status: string): RuntimeStatus {
	if (status === 'ready') return 'ready';
	if (status === 'error') return 'error';
	return 'loading';
}

function regionPhase(
	region: RegionDefinition,
	meta: ResourceMeta | undefined,
	status: RuntimeStatus,
	resolveManifest: (key: string) => unknown,
	metaFor?: (resourceId: string) => ResourceMeta | undefined
): RegionPhase {
	const manifest = resolveManifest(region.type) as { requiresResource?: boolean } | undefined;
	if (manifest === undefined) return 'unknown_region';
	// Wadah (tabs/panel) tidak membaca data resource: selalu siap, anak-anaknya yang memuat datanya sendiri.
	if (manifest.requiresResource === false) return 'ready';
	// Beberapa resource per halaman: metadata region dicari lewat `metaFor` (store resource yang sudah terfilter izin).
	const bound = metaFor?.(region.resourceId) ?? (meta && meta.id === region.resourceId ? meta : undefined);
	if (bound) return 'ready';
	// Metadata yang sudah dimuat selalu menang, meski pemuatan berikutnya gagal.
	if (meta && !metaFor) return 'not_found';
	if (status === 'error') return 'error';
	if (status === 'loading') return 'loading';
	// Pemuatan selesai tanpa resource ini: region tidak punya metadata untuk diikat.
	return 'not_found';
}

/**
 * Memvalidasi page lebih dulu (fail-closed), lalu menyusun rencana render per
 * region dengan key stabil (`region.id`) dan urutan tetap.
 *
 * `resolveManifest` hanya seam untuk tes; produksi memakai registry.
 */
export function planPage(
	page: unknown,
	meta: ResourceMeta | undefined,
	status: RuntimeStatus,
	resolveManifest: (key: string) => unknown = getComponentManifest,
	metaFor?: (resourceId: string) => ResourceMeta | undefined
): PagePlan {
	const result = validatePageDefinition(page);
	if (!result.ok) return { state: 'invalid', issues: result.issues };
	return {
		state: 'ready',
		page: result.page,
		regions: result.page.regions.map((region) => ({
			region,
			phase: regionPhase(region, meta, status, resolveManifest, metaFor)
		}))
	};
}

/** Ringkasan kode masalah untuk ditampilkan; hanya berisi lokasi/kode tervalidasi. */
export function describeIssues(issues: PageDefinitionIssue[]): string {
	return issues.map((issue) => `${issue.location}:${issue.code}`).join(', ');
}

const KNOWN_ISSUE_CODES = new Set<string>(ISSUE_CODES);

/**
 * Ringkasan masalah validasi yang terlokalisasi dalam format "<location>: <pesan>, ...".
 * Kode masalah tak dikenal memakai fallback `kit.runtime.issue.invalid_page`.
 */
export function describeIssuesLocalized(
	issues: PageDefinitionIssue[],
	translate: (key: string, params?: Record<string, string | number>) => string
): string {
	return issues
		.map((issue) => {
			const key = KNOWN_ISSUE_CODES.has(issue.code)
				? `kit.runtime.issue.${issue.code}`
				: 'kit.runtime.issue.invalid_page';
			return `${issue.location}: ${translate(key)}`;
		})
		.join(', ');
}
