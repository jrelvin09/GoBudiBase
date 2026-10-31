import type { PageDefinition } from './page-definition';

export type PageSourceKind = 'published' | 'static' | 'legacy';

export interface ChoosePageOptions {
	published?: PageDefinition | null;
	staticPage?: PageDefinition | null;
	flagOn: boolean;
}

export interface ChosenPage {
	kind: PageSourceKind;
	page?: PageDefinition;
}

/**
 * Resolusi halaman produksi sesuai keputusan arsitektur LC-D4 (B014).
 *
 * Urutan resolusi:
 * 1. `published` — hanya bila flagOn bernilai true dan definisi published tersedia.
 * 2. `staticPage` — fallback ke definisi statis di kode (RUNTIME_PAGES).
 * 3. `legacy` — jatuh ke jalur lama (ResourceListPage) tanpa PageDefinition.
 */
export function choosePage({ published, staticPage, flagOn }: ChoosePageOptions): ChosenPage {
	if (flagOn && published) {
		return { kind: 'published', page: published };
	}
	if (staticPage) {
		return { kind: 'static', page: staticPage };
	}
	return { kind: 'legacy' };
}

export interface PublishedLoadingInput {
	flagOn: boolean;
	/** Metadata resource sedang dimuat. */
	metaLoading: boolean;
	/** Metadata resource siap dan resource ini dikenal. */
	metaReady: boolean;
	/** Indeks halaman terbit untuk konteks ini sudah dimuat. */
	indexReady: boolean;
	/** Hash aktif halaman ini menurut indeks; undefined = tidak ada halaman terbit. */
	entryHash?: string;
	/** Hash definisi yang sudah diambil untuk halaman ini. */
	fetchedHash?: string;
}

/**
 * Apakah route harus menampilkan loading alih-alih halaman statis/lama (LC-D4):
 * hanya saat keputusan "ada halaman terbit atau tidak" belum diketahui, atau saat
 * definisi terbit yang ada belum diambil. Resource tanpa halaman terbit tidak
 * menunggu permintaan apa pun begitu indeks konteks dimuat.
 */
export function isPublishedLoading(i: PublishedLoadingInput): boolean {
	if (!i.flagOn) return false;
	if (i.metaLoading) return true;
	if (!i.metaReady) return false;
	if (!i.indexReady) return true;
	return i.entryHash !== undefined && i.entryHash !== i.fetchedHash;
}
