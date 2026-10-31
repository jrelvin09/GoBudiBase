import { describe, expect, it } from 'vitest';
import type { PageDefinition } from './page-definition';
import { choosePage, isPublishedLoading } from './page-source';

const publishedPage: PageDefinition = {
	id: 'sales.customer',
	title: 'Customer Directory (Published)',
	regions: [
		{
			id: 'reg_pub',
			type: 'resource-list',
			resourceId: 'sales.customer'
		}
	]
};

const staticPage: PageDefinition = {
	id: 'sales.customer',
	title: 'Customer Directory (Static)',
	regions: [
		{
			id: 'reg_stat',
			type: 'resource-list',
			resourceId: 'sales.customer'
		}
	]
};

describe('choosePage (B014)', () => {
	it('kasus 1: flag off + published -> static (published diabaikan saat flag OFF)', () => {
		const result = choosePage({
			flagOn: false,
			published: publishedPage,
			staticPage
		});
		expect(result).toEqual({ kind: 'static', page: staticPage });
	});

	it('kasus 2: flag on + published -> published (published menang saat flag ON)', () => {
		const result = choosePage({
			flagOn: true,
			published: publishedPage,
			staticPage
		});
		expect(result).toEqual({ kind: 'published', page: publishedPage });
	});

	it('kasus 3: flag on tanpa published -> static (fallback ke static saat published tidak ada)', () => {
		const result = choosePage({
			flagOn: true,
			published: undefined,
			staticPage
		});
		expect(result).toEqual({ kind: 'static', page: staticPage });
	});

	it('kasus 4: flag on tanpa static dan tanpa published -> legacy (jatuh ke legacy)', () => {
		const result = choosePage({
			flagOn: true,
			published: undefined,
			staticPage: undefined
		});
		expect(result).toEqual({ kind: 'legacy' });
		expect(result.page).toBeUndefined();
	});

	it('kasus 5: flag off + published tanpa static -> legacy (published diabaikan, jatuh ke legacy)', () => {
		const result = choosePage({
			flagOn: false,
			published: publishedPage,
			staticPage: undefined
		});
		expect(result).toEqual({ kind: 'legacy' });
		expect(result.page).toBeUndefined();
	});

	it('kasus 6: flag on + published tanpa static -> published (published jalan meski tanpa static fallback)', () => {
		const result = choosePage({
			flagOn: true,
			published: publishedPage,
			staticPage: undefined
		});
		expect(result).toEqual({ kind: 'published', page: publishedPage });
	});

	it('kasus 7: flag off tanpa published dan tanpa static -> legacy', () => {
		const result = choosePage({
			flagOn: false,
			published: undefined,
			staticPage: undefined
		});
		expect(result).toEqual({ kind: 'legacy' });
	});

	it('kasus 8: published null dianggap falsy dan jatuh ke static', () => {
		const result = choosePage({
			flagOn: true,
			published: null,
			staticPage
		});
		expect(result).toEqual({ kind: 'static', page: staticPage });
	});
});

describe('isPublishedLoading (indeks halaman terbit)', () => {
	const base = { flagOn: true, metaLoading: false, metaReady: true, indexReady: true };

	it('flag off tidak pernah menunggu', () => {
		expect(isPublishedLoading({ ...base, flagOn: false, indexReady: false })).toBe(false);
	});

	it('menunggu metadata, lalu indeks', () => {
		expect(isPublishedLoading({ ...base, metaLoading: true, metaReady: false })).toBe(true);
		expect(isPublishedLoading({ ...base, indexReady: false })).toBe(true);
	});

	it('resource tak dikenal tidak menunggu', () => {
		expect(isPublishedLoading({ ...base, metaReady: false, indexReady: false })).toBe(false);
	});

	it('tanpa halaman terbit tidak menunggu permintaan apa pun setelah indeks dimuat', () => {
		expect(isPublishedLoading({ ...base })).toBe(false);
	});

	it('menunggu definisi sampai hash yang diambil sama dengan hash indeks', () => {
		expect(isPublishedLoading({ ...base, entryHash: 'h2' })).toBe(true);
		expect(isPublishedLoading({ ...base, entryHash: 'h2', fetchedHash: 'h1' })).toBe(true);
		expect(isPublishedLoading({ ...base, entryHash: 'h2', fetchedHash: 'h2' })).toBe(false);
	});
});
