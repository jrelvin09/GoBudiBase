/** Aturan sandi minimum yang dipakai meter kekuatan (mengikuti kebijakan
 * panjang/keragaman; bukan pengganti validasi server). */
export type PasswordRules = { length: boolean; lower: boolean; upper: boolean; digit: boolean };
export type PasswordStrength = { score: number; rules: PasswordRules };

export function passwordStrength(value: string): PasswordStrength {
	const rules: PasswordRules = {
		length: value.length >= 8,
		lower: /[a-z]/.test(value),
		upper: /[A-Z]/.test(value),
		digit: /\d/.test(value)
	};
	return { score: Object.values(rules).filter(Boolean).length, rules };
}
