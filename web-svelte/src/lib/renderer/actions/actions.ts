import { apiRequest, type AdminContext } from '$lib/api/client';
import type { DataEnvelope } from '$lib/api/types';
import type { ActionMeta, ResourceMeta } from '$lib/api/resource-types';

export type { ActionMeta };

/** Menjalankan satu aksi resource (F2-09) atas daftar id record. */
export function runAction(
	ctx: AdminContext,
	resId: string,
	name: string,
	ids: string[],
	values: Record<string, unknown>,
	csrfToken: string,
	signal?: AbortSignal
): Promise<DataEnvelope<{ affected: number }>> {
	return apiRequest<DataEnvelope<{ affected: number }>>(`/r/${resId}/_actions/${name}`, {
		method: 'POST',
		body: { ids, values },
		csrfToken,
		companyId: ctx.companyId,
		locationId: ctx.locationId ?? undefined,
		contextVersion: ctx.contextVersion,
		signal
	});
}

export function rowActions(meta: ResourceMeta): ActionMeta[] {
	return (meta.actions ?? []).filter((action) => action.row);
}

export function bulkActions(meta: ResourceMeta): ActionMeta[] {
	return (meta.actions ?? []).filter((action) => action.bulk);
}

export function headerActions(meta: ResourceMeta): ActionMeta[] {
	return (meta.actions ?? []).filter((action) => action.header);
}
