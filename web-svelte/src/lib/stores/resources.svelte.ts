import { getPageDraftMeta, type AdminContext } from '$lib/api/client';
import { fetchResourceMeta } from '$lib/api/resources';
import type { ResourceMeta } from '$lib/api/resource-types';

export type ResourcesStatus = 'idle' | 'loading' | 'ready' | 'error';

/** Metadata dimuat sekali per konteks; dibuang saat konteks berganti. */
class ResourcesStore {
	status = $state<ResourcesStatus>('idle');
	locale = $state('');
	list = $state<ResourceMeta[]>([]);
	byId = $state<Map<string, ResourceMeta>>(new Map());
	error = $state<string | null>(null);
	/** Nomor permintaan; respons dengan nomor lama diabaikan (race ganti konteks). */
	private seq = 0;

	getResource(id: string): ResourceMeta | undefined {
		return this.byId.get(id);
	}

	async loadResources(ctx: AdminContext): Promise<void> {
		const request = ++this.seq;
		this.status = 'loading';
		this.error = null;
		try {
			const resp = await fetchResourceMeta(ctx);
			if (request !== this.seq) return;
			this.locale = resp.data.locale;
			this.list = resp.data.resources;
			this.byId = new Map(resp.data.resources.map((resource) => [resource.id, resource]));
			this.status = 'ready';
		} catch (err) {
			if (request !== this.seq) return;
			this.error = err instanceof Error ? err.message : 'Could not load resources.';
			this.status = 'error';
		}
	}

	async loadPlatformResources(cv: number): Promise<void> {
		const request = ++this.seq;
		this.status = 'loading';
		this.error = null;
		try {
			const resp = await getPageDraftMeta(cv);
			if (request !== this.seq) return;
			this.locale = resp.data.locale;
			this.list = resp.data.resources;
			this.byId = new Map(resp.data.resources.map((resource) => [resource.id, resource]));
			this.status = 'ready';
		} catch (err) {
			if (request !== this.seq) return;
			this.error = err instanceof Error ? err.message : 'Could not load resources.';
			this.status = 'error';
		}
	}

	async refresh(context: { kind: string; company_id?: string | null; location_id?: string | null; context_version: number }): Promise<void> {
		if (context.kind === 'PLATFORM') {
			await this.loadPlatformResources(context.context_version);
		} else if (context.kind === 'COMPANY' || context.kind === 'LOCATION') {
			await this.loadResources({
				companyId: context.company_id ?? '',
				locationId: context.location_id ?? null,
				contextVersion: context.context_version
			});
		}
	}

	clearResources(): void {

		this.seq += 1;
		this.status = 'idle';
		this.locale = '';
		this.list = [];
		this.byId = new Map();
		this.error = null;
	}
}

export const resourcesStore = new ResourcesStore();
