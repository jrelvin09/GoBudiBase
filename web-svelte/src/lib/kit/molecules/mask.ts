/**
 * Masker pola sederhana (padanan Inputmask pada demo template): `9` adalah
 * slot digit, karakter lain literal. Digit di luar pola dibuang, jadi sekaligus
 * menjadi batas panjang. Kursor melompat ke akhir setelah koreksi — untuk
 * input ERP nilai pendek ini cukup dan tidak menambah dependensi.
 */
export function applyMask(raw: string, pattern: string): string {
	const digits = raw.replace(/\D/g, '');
	let out = '';
	let index = 0;
	for (const slot of pattern) {
		if (index >= digits.length) break;
		if (slot === '9') out += digits[index++];
		else out += slot;
	}
	return out;
}

/** Panjang digit maksimum yang masih diterima pola. */
export function maskDigitCount(pattern: string): number {
	return pattern.split('').filter((slot) => slot === '9').length;
}
