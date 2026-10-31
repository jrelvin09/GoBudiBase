import { getContext, setContext } from 'svelte';
import type { LovItem } from '$lib/kit/molecules/PopupLovItem.svelte';

// belongs_to data source (F2-06). The `fields` tier may not import `$lib/api`,
// so the page (a renderer component) injects these lookups through context.
export type RelationSource = {
	search: (field: string, q: string, page: number) => Promise<{ items: LovItem[]; total: number }>;
	labels: (field: string, ids: string[]) => Promise<Record<string, string>>;
};

const KEY = Symbol('bb.relations');

export function setRelationSource(source: RelationSource): void {
	setContext(KEY, source);
}

export function getRelationSource(): RelationSource | undefined {
	return getContext<RelationSource | undefined>(KEY);
}
