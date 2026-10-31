import { describe, expect, it } from 'vitest';
import fieldTypesJson from './field-types.json';
import { fieldTypes } from './field-types';

describe('field-types', () => {
	it('daftar tipe == field-types.json', () => {
		expect([...fieldTypes].sort()).toEqual([...(fieldTypesJson as string[])].sort());
	});
});
