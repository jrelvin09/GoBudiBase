import type { AdminContext } from '$lib/api/client';
import { getPublishedIndex } from '$lib/api/resources';

export interface PublishedEntry {
	revision: number;
	hash: string;
}

export function contextKey(ctx: AdminContext): string {
	return `${ctx.companyId}:${ctx.locationId ?? ''}:${ctx.contextVersion}`;
}

/** Indeks maksimum umur sebelum dimuat ulang di latar saat pengguna berpindah halaman. */
const REFRESH_AFTER_MS = 5000;

/**
 * Indeks halaman terbit per konteks: id halaman -> revisi dan hash aktif. Dimuat
 * satu kali per konteks (menggantikan satu permintaan 404 pada tiap navigasi) dan
 * dimuat ulang di latar agar publikasi atau rollback baru terlihat tanpa muat ulang.
 * Gagal memuat = tak ada halaman terbit (jalur statis/lama tetap jalan).
 */
class PublishedStore {
	index = $state<Record<string, PublishedEntry>>({});
	/** Kunci konteks yang indeksnya sudah dimuat; null = belum ada. */
	loadedKey = $state<string | null>(null);
	private fetchedAt = 0;
	private seq = 0;
	private inflight: { key: string; promise: Promise<void> } | null = null;

	entry(pageId: string): PublishedEntry | undefined {
		return this.index[pageId];
	}

	ready(key: string): boolean {
		return this.loadedKey === key;
	}

	refresh(ctx: AdminContext, force = false): Promise<void> {
		const key = contextKey(ctx);
		if (this.inflight?.key === key) return this.inflight.promise;
		if (this.loadedKey === key && !force && Date.now() - this.fetchedAt < REFRESH_AFTER_MS) return Promise.resolve();
		if (this.loadedKey !== key) {
			this.index = {};
			this.loadedKey = null;
		}
		const request = ++this.seq;
		const promise: Promise<void> = getPublishedIndex(ctx)
			.then((resp) => {
				if (request !== this.seq) return;
				this.index = Object.fromEntries(resp.data.map((p) => [p.page_id, { revision: p.revision, hash: p.hash }]));
				this.loadedKey = key;
				this.fetchedAt = Date.now();
			})
			.catch(() => {
				if (request !== this.seq || this.loadedKey === key) return; // indeks lama tetap dipakai bila muat ulang gagal
				this.index = {};
				this.loadedKey = key;
				this.fetchedAt = Date.now();
			})
			.finally(() => {
				if (this.inflight?.promise === promise) this.inflight = null;
			});
		this.inflight = { key, promise };
		return promise;
	}

	clear(): void {
		this.seq += 1;
		this.index = {};
		this.loadedKey = null;
		this.fetchedAt = 0;
		this.inflight = null;
	}
}

export const publishedStore = new PublishedStore();
