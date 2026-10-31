import { t } from '$lib/i18n/index.svelte';
import type { CatalogEntry } from './catalog';

/** Judul katalog dalam locale aktif. Judul lama tetap jadi cadangan: kunci yang
 * tidak ada di katalog i18n mengembalikan dirinya sendiri, dan itu diganti. */
export function catalogTitle(entry: CatalogEntry): string {
	if (!entry.titleKey) return entry.title;
	const translated = t(entry.titleKey);
	return translated === entry.titleKey ? entry.title : translated;
}
