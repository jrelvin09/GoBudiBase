import { describe, expect, it } from 'vitest';
import { applyMask, maskDigitCount } from './mask';

describe('applyMask', () => {
	it('menyisipkan pemisah saat digit bertambah', () => {
		expect(applyMask('0812', '9999-9999-9999')).toBe('0812');
		expect(applyMask('08123456', '9999-9999-9999')).toBe('0812-3456');
		expect(applyMask('081234567890', '9999-9999-9999')).toBe('0812-3456-7890');
	});

	it('membuang karakter non-digit dari input pengguna', () => {
		expect(applyMask('12ab34', '99.999')).toBe('12.34');
		expect(applyMask('abc', '999')).toBe('');
	});

	it('membuang digit di luar pola', () => {
		expect(applyMask('1234567890', '99/99')).toBe('12/34');
		expect(maskDigitCount('99/99')).toBe(4);
	});
});
