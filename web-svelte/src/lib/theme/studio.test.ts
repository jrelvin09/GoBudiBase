import { describe, expect, it } from 'vitest';
import { themeAttributes } from './types';
import { draftToTheme, emptyThemeDraft, themeToDraft } from './studio';

describe('studio tema', () => {
	it('nilai kosong dibuang dan layout/varian hanya bila terisi', () => {
		expect(draftToTheme({ ...emptyThemeDraft(), label: ' Brand ' })).toEqual({ label: 'Brand' });
		const body = draftToTheme({ ...emptyThemeDraft(), label: 'B', radius: 'lg', sidebar: 'collapsed', table: 'striped' });
		expect(body).toEqual({ label: 'B', radius: 'lg', layout: { sidebar: 'collapsed' }, variants: { table: 'striped' } });
	});

	it('bolak-balik formulir <-> definisi tidak kehilangan data', () => {
		const draft = { ...emptyThemeDraft(), label: 'B', preset: 'forest', primary: '#1d4ed8', content_width: 'narrow', card: 'elevated' };
		expect(themeToDraft(draftToTheme(draft))).toEqual(draft);
	});

	it('atribut data-* dari layout dan varian', () => {
		expect(themeAttributes({ layout: { content_width: 'narrow', sidebar: 'collapsed' }, variants: { table: 'striped' } })).toEqual({
			'content-width': 'narrow',
			sidebar: 'collapsed',
			table: 'striped'
		});
		expect(themeAttributes({})).toEqual({});
	});
});
