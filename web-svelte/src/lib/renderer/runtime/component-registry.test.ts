import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { assertUnique, catalog, registry } from '$lib/kit/catalog';
import { REGION_TYPES, RESOURCE_LIST_REGION } from './page-definition';
import {
	getComponentManifest,
	listComponentManifests,
	resolveComponentRef,
	resolveRegionComponent
} from './component-registry';

describe('komponen registry runtime', () => {
	it('mendaftarkan semua region dan komponen yang boleh dipakai builder (manifest lengkap)', () => {
		const manifests = listComponentManifests();
		expect(manifests.map((manifest) => manifest.key).sort()).toEqual(['button', 'calendar', 'card', 'cards', 'chart', 'facets', 'grid', 'ir-report', 'kanban', 'kpi', 'panel', 'resource-form', RESOURCE_LIST_REGION, 'tabs', 'text']);
		expect(manifests.find((m) => m.key === RESOURCE_LIST_REGION)).toMatchObject({
			key: 'resource-list',
			labelKey: 'kit.runtime.region.resource-list',
			version: 1,
			requiresResource: true
		});
		for (const manifest of manifests) expect(manifest.label).not.toBe('');
	});

	it('resolveRegionComponent mengembalikan komponen untuk key dikenal', () => {
		expect(resolveRegionComponent(RESOURCE_LIST_REGION)).toBeTruthy();
	});

	it('key tidak dikenal gagal terkontrol (undefined, bukan error)', () => {
		expect(getComponentManifest('chart-widget')).toBeUndefined();
		expect(resolveRegionComponent('chart-widget')).toBeUndefined();
		expect(getComponentManifest('')).toBeUndefined();
	});

	it('setiap manifest punya komponen yang bisa diresolve', () => {
		for (const manifest of listComponentManifests()) {
			expect(resolveComponentRef(manifest.key)).toBeTruthy();
		}
	});

	it('pemanggil tidak bisa mengubah registry lewat hasil lookup', () => {
		const manifest = getComponentManifest(RESOURCE_LIST_REGION);
		expect(manifest).toBeDefined();
		if (manifest) manifest.key = 'diubah';
		const list = listComponentManifests();
		list.push({ key: 'palsu', category: '', capabilities: { runtimeRegion: false }, label: '', labelKey: '', version: 0, requiresResource: false });
		expect(getComponentManifest(RESOURCE_LIST_REGION)?.key).toBe(RESOURCE_LIST_REGION);
		expect(listComponentManifests()).toHaveLength(15);
	});

	it('tidak memakai eval, Function, atau import dinamis dari metadata', () => {
		const source = readFileSync(fileURLToPath(new URL('./component-registry.ts', import.meta.url)), 'utf8');
		expect(source).not.toMatch(/\beval\s*\(/);
		expect(source).not.toMatch(/\bnew\s+Function\b/);
		expect(source).not.toMatch(/\bimport\s*\(/);
		expect(source).not.toMatch(/\bimport\.meta\.glob\b/);
	});

	describe('satu sumber registry bersama dengan /kit (FP-01)', () => {
		it('ID registry unik dan katalog demo hanyalah entri registry yang punya demo', () => {
			const ids = registry.map((entry) => entry.id);
			expect(new Set(ids).size).toBe(ids.length);
			expect(catalog.map((entry) => entry.id)).toEqual(registry.filter((e) => e.load).map((e) => e.id));
		});

		it('allowlist region dan manifest runtime diturunkan dari entri registry bertanda runtime', () => {
			const key = (e: (typeof registry)[number]) => e.runtime?.key ?? e.id;
			const withRuntime = registry.filter((entry) => entry.runtime);
			expect([...REGION_TYPES]).toEqual(withRuntime.filter((e) => e.runtime?.capabilities.runtimeRegion).map(key));
			expect(listComponentManifests().map((m) => m.key)).toEqual(withRuntime.map(key));
		});

		it('Button dan Card discoverable tetapi bukan region; ir-report dan resource-list region', () => {
			for (const id of ['button', 'card']) {
				expect(getComponentManifest(id)?.capabilities.runtimeRegion).toBe(false);
				expect(resolveComponentRef(id)).toBeTruthy();
				expect(resolveRegionComponent(id)).toBeUndefined();
				expect(REGION_TYPES).not.toContain(id);
			}
			for (const id of ['ir-report', RESOURCE_LIST_REGION]) {
				expect(getComponentManifest(id)?.capabilities.runtimeRegion).toBe(true);
				expect(resolveRegionComponent(id)).toBeTruthy();
				expect(REGION_TYPES).toContain(id);
			}
			for (const manifest of listComponentManifests()) {
				expect(manifest.version).toBeGreaterThan(0);
				expect(manifest.category).not.toBe('');
			}
			expect(registry.find((e) => e.id === 'ir-table')?.runtime?.key).toBe('ir-report');
		});

		it('ID atau key runtime ganda gagal saat registrasi', () => {
			const entry = registry[0];
			expect(() => assertUnique([entry, { ...entry }])).toThrow(/ganda/);
			const card = registry.find((e) => e.id === 'card')!;
			const other = { ...card, id: 'card-2', runtime: { ...card.runtime!, key: 'card' } };
			expect(() => assertUnique([registry.find((e) => e.id === 'card')!, other])).toThrow(/key runtime ganda/);
		});

		it('resource-list hanya runtime: tidak muncul sebagai demo /kit', () => {
			expect(catalog.some((entry) => entry.id === RESOURCE_LIST_REGION)).toBe(false);
		});
	});
});
