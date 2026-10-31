import type { AdminContext } from '$lib/api/client';
import { fileMeta } from '$lib/api/resources';
import type { ResourceMeta } from '$lib/api/resource-types';

// Names of the file values on one page (F6-03): the list shows a file as a link
// with its name, which `?meta=1` returns without the bytes. An image needs no
// name, only its download URL, so only `file` fields are fetched here.

export type FileNameMap = Record<string, Record<string, string>>;

export async function resolveFileNames(
	ctx: AdminContext,
	meta: ResourceMeta,
	rows: Record<string, unknown>[]
): Promise<FileNameMap> {
	const out: FileNameMap = {};
	const fields = meta.fields.filter((field) => field.type === 'file');
	if (fields.length === 0) return out;
	await Promise.all(
		fields.map(async (field) => {
			const names: Record<string, string> = {};
			await Promise.all(
				rows.map(async (row) => {
					const id = row[field.name];
					if (id === null || id === undefined || id === '') return;
					try {
						names[String(id)] = (await fileMeta(ctx, meta.id, String(row.id), field.name)).data.name;
					} catch {
						// the cell falls back to the file id
					}
				})
			);
			out[field.name] = names;
		})
	);
	return out;
}