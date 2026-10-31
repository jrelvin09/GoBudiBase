import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResourceMeta } from '$lib/api/resource-types';
import { relationIds, resolveLabels } from './labels';

vi.mock('$lib/api/resources', () => ({ labels: vi.fn() }));
import { labels as fetchLabels } from '$lib/api/resources';

const ctx = { companyId: 'c1', contextVersion: 1 };
const mock = vi.mocked(fetchLabels);

function meta(...fields: { name: string; type: string }[]): ResourceMeta {
	return { id: 'sales.customer', fields } as unknown as ResourceMeta;
}

beforeEach(() => {
	mock.mockReset();
	mock.mockResolvedValue({ data: { labels: {} } } as never);
});
describe('relationIds', () => {
	it('mengambil id unik per field belongs_to dan mengabaikan null', () => {
		const m = meta({ name: 'salesperson_id', type: 'belongs_to' }, { name: 'name', type: 'text' });
		const ids = relationIds(m, [
			{ salesperson_id: 'a' },
			{ salesperson_id: 'a' },
			{ salesperson_id: 'b' },
			{ salesperson_id: null },
			{ name: 'x' }
		]);
		expect(ids).toEqual({ salesperson_id: ['a', 'b'] });
	});
});

describe('resolveLabels', () => {
	it('id unik dikirim satu kali per field', async () => {
		const m = meta({ name: 'salesperson_id', type: 'belongs_to' });
		mock.mockResolvedValue({ data: { labels: { a: 'Ana', b: 'Budi' } } } as never);
		const result = await resolveLabels(ctx, m, [
			{ salesperson_id: 'a' },
			{ salesperson_id: 'a' },
			{ salesperson_id: 'b' }
		]);
		expect(mock).toHaveBeenCalledTimes(1);
		expect(mock).toHaveBeenCalledWith(ctx, 'sales.customer', 'salesperson_id', ['a', 'b']);
		expect(result).toEqual({ salesperson_id: { a: 'Ana', b: 'Budi' } });
	});

	it('tanpa id tidak memanggil server', async () => {
		const m = meta({ name: 'salesperson_id', type: 'belongs_to' });
		const result = await resolveLabels(ctx, m, [{ name: 'x' }]);
		expect(mock).not.toHaveBeenCalled();
		expect(result).toEqual({});
	});

	it('null dan kosong diabaikan', async () => {
		const m = meta({ name: 'salesperson_id', type: 'belongs_to' });
		await resolveLabels(ctx, m, [{ salesperson_id: null }, { salesperson_id: '' }]);
		expect(mock).not.toHaveBeenCalled();
	});

	it('dua field memanggil server sekali per field', async () => {
		const m = meta({ name: 'salesperson_id', type: 'belongs_to' }, { name: 'other_id', type: 'belongs_to' });
		const result = await resolveLabels(ctx, m, [{ salesperson_id: 'a', other_id: 'z' }]);
		expect(mock).toHaveBeenCalledTimes(2);
		expect(Object.keys(result).sort()).toEqual(['other_id', 'salesperson_id']);
	});
});