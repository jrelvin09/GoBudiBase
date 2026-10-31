import { beforeEach, describe, expect, it } from 'vitest';
import en from '$lib/i18n/en.json';
import id from '$lib/i18n/id.json';
import { setLocale, t } from '$lib/i18n/index.svelte';
import { ISSUE_CODES, validatePageDefinition } from './page-definition';
import { describeIssuesLocalized } from './runtime-plan';

beforeEach(() => {
	setLocale('en');
});

describe('issue-messages (B004a)', () => {
	it('(a) setiap elemen ISSUE_CODES punya kunci di en.json dan id.json', () => {
		expect(ISSUE_CODES.length).toBeGreaterThan(0);
		for (const code of ISSUE_CODES) {
			const key = `kit.runtime.issue.${code}`;
			expect(key in en, `en.json missing key: ${key}`).toBe(true);
			expect(key in id, `id.json missing key: ${key}`).toBe(true);
			expect((en as Record<string, string>)[key].trim().length).toBeGreaterThan(0);
			expect((id as Record<string, string>)[key].trim().length).toBeGreaterThan(0);
		}
	});

	it('(b) setiap code yang dihasilkan validatePageDefinition untuk 8 input rusak ∈ ISSUE_CODES', () => {
		const badInputs: unknown[] = [
			// 1. bukan objek (invalid_page)
			null,
			// 2. id hilang (invalid_id)
			{ title: 'Customers', regions: [{ id: 'list', type: 'resource-list', resourceId: 'sales.customer' }] },
			// 3. judul kosong (invalid_title)
			{ id: 'sales.customer', title: '', regions: [{ id: 'list', type: 'resource-list', resourceId: 'sales.customer' }] },
			// 4. regions kosong (invalid_regions)
			{ id: 'sales.customer', title: 'Customers', regions: [] },
			// 5. elemen regions bukan objek (invalid_region)
			{ id: 'sales.customer', title: 'Customers', regions: ['not-an-object'] },
			// 6. id region duplikat (duplicate_id)
			{
				id: 'sales.customer',
				title: 'Customers',
				regions: [
					{ id: 'list', type: 'resource-list', resourceId: 'sales.customer' },
					{ id: 'list', type: 'resource-list', resourceId: 'sales.order' }
				]
			},
			// 7. tipe region tidak dikenal (unknown_type)
			{
				id: 'sales.customer',
				title: 'Customers',
				regions: [{ id: 'list', type: 'chart-widget', resourceId: 'sales.customer' }]
			},
			// 8. resourceId kosong (invalid_resource)
			{
				id: 'sales.customer',
				title: 'Customers',
				regions: [{ id: 'list', type: 'resource-list', resourceId: '' }]
			},
			// Tambahan form mode invalid (invalid_mode)
			{
				id: 'sales.customer',
				title: 'Customers',
				regions: [{ id: 'form', type: 'resource-form', resourceId: 'sales.customer', mode: 'destroy' }]
			}
		];

		expect(badInputs.length).toBeGreaterThanOrEqual(8);

		const codesObserved = new Set<string>();
		for (const input of badInputs) {
			const result = validatePageDefinition(input);
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.issues.length).toBeGreaterThan(0);
				for (const issue of result.issues) {
					expect(ISSUE_CODES).toContain(issue.code);
					codesObserved.add(issue.code);
				}
			}
		}

		// Pastikan semua kode masalah validator utama teruji
		expect(codesObserved).toContain('invalid_page');
		expect(codesObserved).toContain('invalid_id');
		expect(codesObserved).toContain('invalid_title');
		expect(codesObserved).toContain('invalid_regions');
		expect(codesObserved).toContain('invalid_region');
		expect(codesObserved).toContain('duplicate_id');
		expect(codesObserved).toContain('unknown_type');
		expect(codesObserved).toContain('invalid_resource');
		expect(codesObserved).toContain('invalid_mode');
	});

	it('(c) describeIssuesLocalized memuat location dan kalimat terlokalisasi', () => {
		// Kasus 1: issue tunggal memuat location dan kalimat bahasa Inggris
		setLocale('en');
		const enOutput = describeIssuesLocalized(
			[{ location: 'customer-list', code: 'unknown_type' }],
			t
		);
		expect(enOutput).toBe('customer-list: Unknown component type.');
		expect(enOutput).toContain('customer-list');

		// Kasus 2: ganti locale ke Indonesia
		setLocale('id');
		const idOutput = describeIssuesLocalized(
			[{ location: 'customer-list', code: 'unknown_type' }],
			t
		);
		expect(idOutput).toBe('customer-list: Tipe komponen tidak dikenal.');
		expect(idOutput).toContain('customer-list');

		// Kasus 3: multiple issues
		setLocale('en');
		const multiOutput = describeIssuesLocalized(
			[
				{ location: 'page', code: 'invalid_title' },
				{ location: 'region-a', code: 'duplicate_id' }
			],
			t
		);
		expect(multiOutput).toContain('page: The page title is required.');
		expect(multiOutput).toContain('region-a: The region ID is already used on this page.');
		expect(multiOutput).toBe(
			'page: The page title is required., region-a: The region ID is already used on this page.'
		);

		// Kasus 4: kode tak dikenal jatuh ke fallback kit.runtime.issue.invalid_page
		const fallbackOutput = describeIssuesLocalized(
			[{ location: 'custom-loc', code: 'unknown_code_999' }],
			t
		);
		expect(fallbackOutput).toBe('custom-loc: The page definition is not valid.');
		expect(fallbackOutput).toContain('custom-loc');
	});
});
