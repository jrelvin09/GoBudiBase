import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { ResourceMeta } from '$lib/api/resource-types';
import { previewPlan } from './builder';
import { RUNTIME_PAGES } from './runtime-pages';
import { planPage } from './runtime-plan';

describe('preview-parity guard tests (B003)', () => {
	const previewSource = readFileSync(
		fileURLToPath(new URL('../../../routes/(app)/builder-preview/[resource]/+page.svelte', import.meta.url)),
		'utf8'
	);
	const productionSource = readFileSync(
		fileURLToPath(new URL('../../../routes/(app)/r/[resource]/+page.svelte', import.meta.url)),
		'utf8'
	);

	it('route preview mengimpor PageRuntime dan tidak mengimpor renderer khusus list/report/form', () => {
		expect(previewSource).toContain("import PageRuntime from '$lib/renderer/runtime/PageRuntime.svelte'");
		expect(previewSource).not.toContain('ResourceListPage');
		expect(previewSource).not.toContain('InteractiveReport');
		expect(previewSource).not.toContain('ResourceFormPage');
	});

	it('route produksi r/[resource] mengimpor PageRuntime yang sama', () => {
		expect(productionSource).toContain("import PageRuntime from '$lib/renderer/runtime/PageRuntime.svelte'");
	});

	it('previewPlan mengembalikan halaman yang sama persis bila tidak ada form edit', () => {
		const def = RUNTIME_PAGES['sales.customer'];
		expect(def).toBeDefined();
		const plan = previewPlan(def);
		expect(plan.page).toEqual(def);
		expect(plan.skipped).toBe(0);
	});

	it('planPage adalah fungsi murni yang deterministik', () => {
		const def = RUNTIME_PAGES['sales.customer'];
		const meta: ResourceMeta = {
			id: 'sales.customer',
			label: 'Customer',
			plural: 'Customers',
			nav_order: 10,
			title_field: 'name',
			list_view: 'report',
			form_mode: 'page',
			fields: [],
			capabilities: { view: true }
		};

		const first = planPage(def, meta, 'ready');
		const second = planPage(def, meta, 'ready');
		expect(first).toEqual(second);
	});
});
