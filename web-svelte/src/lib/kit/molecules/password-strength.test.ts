import { describe, expect, it } from 'vitest';
import { passwordStrength } from './password-strength';

describe('passwordStrength', () => {
	it('sandi kosong tidak memenuhi satu aturan pun', () => {
		expect(passwordStrength('').score).toBe(0);
		expect(passwordStrength('').rules).toEqual({ length: false, lower: false, upper: false, digit: false });
	});

	it('menghitung aturan yang terpenuhi', () => {
		expect(passwordStrength('abcdefgh').score).toBe(2);
		expect(passwordStrength('Abcdefgh').score).toBe(3);
		expect(passwordStrength('Abcdefg1').score).toBe(4);
		expect(passwordStrength('a1').rules.length).toBe(false);
	});
});
