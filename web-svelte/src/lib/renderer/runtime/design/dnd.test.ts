import { describe, expect, it } from 'vitest';
import { dragKind, dropMark, dropTarget, MIME_MOVE, MIME_NEW, type Box } from './dnd';

const W = 1000;
const box = (left: number, right: number, top: number, bottom: number): Box => ({ left, right, top, bottom });

describe('dnd kanvas', () => {
	// Satu kolom: tiga region selebar penuh.
	const stack = [box(0, 1000, 0, 100), box(0, 1000, 116, 216), box(0, 1000, 232, 332)];
	// Baris 1: dua region (4 + 8 kolom); baris 2: satu region penuh.
	const rows = [box(0, 320, 0, 100), box(336, 1000, 0, 100), box(0, 1000, 116, 216)];

	it('region selebar penuh: sisip di atas/bawah menurut titik tengah vertikal', () => {
		expect(dropTarget(stack, W, 500, -5)).toEqual({ index: 0, edge: 'top' }); // di atas semuanya
		expect(dropTarget(stack, W, 500, 40)).toEqual({ index: 0, edge: 'top' });
		expect(dropTarget(stack, W, 500, 60)).toEqual({ index: 1, edge: 'bottom' });
		expect(dropTarget(stack, W, 500, 108)).toEqual({ index: 1, edge: 'top' }); // celah antar region
		expect(dropTarget(stack, W, 500, 300)).toEqual({ index: 3, edge: 'bottom' });
		expect(dropTarget(stack, W, 500, 9999)).toEqual({ index: 3, edge: 'bottom' });
	});

	it('baris dengan beberapa region: sisip di kiri/kanan menurut titik tengah horizontal', () => {
		expect(dropTarget(rows, W, 100, 50)).toEqual({ index: 0, edge: 'left' });
		expect(dropTarget(rows, W, 200, 50)).toEqual({ index: 1, edge: 'left' });
		expect(dropTarget(rows, W, 900, 50)).toEqual({ index: 2, edge: 'right' }); // setelah region terakhir di baris itu
	});

	it('tanpa region: sisip di awal', () => {
		expect(dropTarget([], W, 10, 10)).toEqual({ index: 0, edge: 'top' });
	});

	it('dropMark menggambar garis sesuai sisi dan jarak antar region', () => {
		const top = dropMark(stack, { index: 1, edge: 'top' }, 16)!;
		expect(top).toEqual({ left: 0, top: 116 - 8 - 2, width: 1000, height: 4 });
		const bottom = dropMark(stack, { index: 3, edge: 'bottom' }, 16)!;
		expect(bottom.top).toBe(332 + 8 - 2);
		const left = dropMark(rows, { index: 1, edge: 'left' }, 16)!;
		expect(left).toEqual({ left: 336 - 8 - 2, top: 0, width: 4, height: 100 });
		const right = dropMark(rows, { index: 2, edge: 'right' }, 16)!;
		expect(right.left).toBe(1000 + 8 - 2); // jangkar = region indeks 1, tepi kanannya
	});

	it('dropMark: indeks tanpa jangkar = null', () => {
		expect(dropMark([], { index: 0, edge: 'top' }, 16)).toBeNull();
		expect(dropMark(stack, { index: 0, edge: 'bottom' }, 16)).toBeNull();
	});

	it('dragKind mengenali seretan builder dan mengabaikan yang lain', () => {
		expect(dragKind([MIME_NEW])).toBe('new');
		expect(dragKind([MIME_MOVE, 'text/plain'])).toBe('move');
		expect(dragKind(['Files'])).toBeNull();
		expect(dragKind([])).toBeNull();
		expect(dragKind(null)).toBeNull();
	});
});
