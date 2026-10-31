import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import LineChart from './LineChart.svelte';
import { setLocale } from '$lib/i18n/index.svelte';
import {
	bandWidth,
	barHeight,
	CATEGORY_MAX,
	linePoints,
	niceScale,
	paletteIndex,
	piePath,
	pieSlices,
	scaleToY,
	sparklinePath,
	tickLabel,
	topWithOther
} from './chart-scale';

describe('niceScale', () => {
	it('data kosong tetap punya rentang yang bisa digambar', () => {
		const scale = niceScale([]);
		expect(scale.min).toBe(0);
		expect(scale.max).toBeGreaterThan(0);
		expect(scale.ticks.length).toBeGreaterThanOrEqual(5);
	});

	it('nilai nol semua tidak menghasilkan pembagian nol', () => {
		const scale = niceScale([0, 0, 0]);
		expect(scale.max).toBeGreaterThan(scale.min);
	});

	it('selalu memuat nol dan langkah 1/2/5 x 10^n', () => {
		const scale = niceScale([7, 12, 25]);
		expect(scale.min).toBe(0);
		expect(scale.max).toBeGreaterThanOrEqual(25);
		const mantissa = scale.step / 10 ** Math.floor(Math.log10(scale.step));
		expect([1, 2, 5, 10]).toContain(Math.round(mantissa));
	});

	it('memberi 5-6 tick', () => {
		for (const values of [[1], [1, 2, 3], [1234], [0.001, 0.002], [5, 500000]]) {
			const scale = niceScale(values);
			expect(scale.ticks.length).toBeGreaterThanOrEqual(4);
			expect(scale.ticks.length).toBeLessThanOrEqual(8);
		}
	});

	it('tick-nya bebas derau floating point', () => {
		const scale = niceScale([0.3]);
		for (const tick of scale.ticks) {
			expect(String(tick)).not.toMatch(/0{6,}\d/);
		}
	});

	it('nilai negatif ikut masuk rentang', () => {
		const scale = niceScale([-10, 20]);
		expect(scale.min).toBeLessThanOrEqual(-10);
		expect(scale.max).toBeGreaterThanOrEqual(20);
	});
});

describe('skala dan geometri', () => {
	it('scaleToY menaruh nilai minimum di bawah', () => {
		const scale = { min: 0, max: 10, step: 2, ticks: [] };
		expect(scaleToY(0, scale, 0, 100)).toBe(100);
		expect(scaleToY(10, scale, 0, 100)).toBe(0);
		expect(scaleToY(5, scale, 0, 100)).toBe(50);
	});

	it('barHeight dari garis nol', () => {
		const scale = { min: 0, max: 10, step: 2, ticks: [] };
		expect(barHeight(4, scale, 100)).toBe(40);
		expect(barHeight(0, scale, 100)).toBe(0);
	});

	it('bandWidth membagi lebar dan menyisakan celah', () => {
		expect(bandWidth(0, 100)).toBe(0);
		expect(bandWidth(4, 100, 4)).toBe(21);
		expect(bandWidth(4, 100, 4)).toBeGreaterThan(0);
	});

	it('linePoints memetakan setiap nilai ke titik SVG', () => {
		const scale = { min: 0, max: 10, step: 2, ticks: [] };
		expect(linePoints([0, 10], scale, 100, 100)).toBe('0,100 100,0');
		expect(linePoints([], scale, 100, 100)).toBe('');
		// Satu titik saja tidak boleh membagi nol.
		expect(linePoints([5], scale, 100, 100)).toBe('0,50');
	});
});

describe('pieSlices', () => {
	it('sudut menutup lingkaran penuh dan mulai dari atas', () => {
		const slices = pieSlices([
			{ label: 'a', value: 1 },
			{ label: 'b', value: 3 }
		]);
		expect(slices[0].from).toBeCloseTo(-Math.PI / 2);
		expect(slices[1].to).toBeCloseTo(-Math.PI / 2 + Math.PI * 2);
		expect(slices[0].share).toBeCloseTo(0.25);
		expect(slices[1].share).toBeCloseTo(0.75);
	});

	it('total nol tidak menghasilkan slice', () => {
		expect(pieSlices([{ label: 'a', value: 0 }])).toEqual([]);
	});

	it('piePath menghasilkan busur dengan flag yang benar', () => {
		const slices = pieSlices([
			{ label: 'a', value: 1 },
			{ label: 'b', value: 1 }
		]);
		expect(piePath(slices[0], 50, 0, 0)).toMatch(/^M 0 0 L .* A 50 50 0 0 1 .* Z$/);
	});
});

describe('paletteIndex', () => {
	it('berputar 1..12', () => {
		expect(paletteIndex(0)).toBe(1);
		expect(paletteIndex(11)).toBe(12);
		expect(paletteIndex(12)).toBe(1);
		expect(paletteIndex(13)).toBe(2);
	});
});

describe('topWithOther', () => {
	it('mempertahankan limit-1 terbesar dan menggabung sisanya', () => {
		const points = Array.from({ length: 5 }, (_, i) => ({ label: `c${i}`, value: i + 1 }));
		const capped = topWithOther(points, 3);
		expect(capped).toHaveLength(3);
		expect(capped.map((point) => point.label)).toEqual(['c4', 'c3', 'Other']);
		// The merged tail sums c0+c1+c2 = 1+2+3.
		expect(capped[2].value).toBe(6);
	});

	it('tidak menyentuh data yang sudah cukup kecil', () => {
		const points = [{ label: 'a', value: 1 }];
		expect(topWithOther(points)).toEqual(points);
		expect(CATEGORY_MAX).toBe(50);
	});
});

describe('tickLabel', () => {
	it('mengikuti locale aktif', () => {
		setLocale('en');
		expect(tickLabel(1500)).toBe('1,500');
		setLocale('id');
		expect(tickLabel(1500)).toBe('1.500');
		setLocale('en');
	});
});

describe('sparklinePath', () => {
	it('meregangkan seri dari nilai terkecil ke terbesar di dalam kotak', () => {
		const points = sparklinePath([1, 3, 2], 100, 20, 2)
			.split(' ')
			.map((pair) => pair.split(',').map(Number));
		expect(points).toHaveLength(3);
		expect(points[0]).toEqual([0, 18]);
		expect(points[1]).toEqual([50, 2]);
		expect(points[2][1]).toBe(10);
	});

	it('seri rata dan seri kosong tidak menghasilkan NaN', () => {
		expect(sparklinePath([5, 5], 10, 10)).toBe('0,8 10,8');
		expect(sparklinePath([], 10, 10)).toBe('');
	});
});

it('area chart campuran menutup isi pada garis nol', () => {
	const values = [-10, 20];
	const scale = niceScale(values);
	const zeroY = scaleToY(0, scale, 0, 240 - 12 - 32);
	const { html } = render(LineChart, {
		props: { data: values.map((value, index) => ({ label: String(index), value })), label: 'Mixed', area: true }
	});
	const points = html.match(/<polygon[^>]*points="([^"]+)"/)?.[1];
	expect(points).toContain(`572,${zeroY} 0,${zeroY}`);
	expect(zeroY).toBeLessThan(240 - 12 - 32);
});
