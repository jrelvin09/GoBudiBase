import { formatNumber } from '$lib/i18n/format';

/** More categories than this and the tail is merged into "Other" (K4 §1.2). */
export const CATEGORY_MAX = 50;

export type ChartPoint = { label: string; value: number };
export type Scale = { min: number; max: number; step: number; ticks: number[] };

/** Palette classes are spelled out so Tailwind emits them (T0-02). */
export const PALETTE_FILL = [
	'fill-palette-1',
	'fill-palette-2',
	'fill-palette-3',
	'fill-palette-4',
	'fill-palette-5',
	'fill-palette-6',
	'fill-palette-7',
	'fill-palette-8',
	'fill-palette-9',
	'fill-palette-10',
	'fill-palette-11',
	'fill-palette-12'
] as const;

export const PALETTE_STROKE = [
	'stroke-palette-1',
	'stroke-palette-2',
	'stroke-palette-3',
	'stroke-palette-4',
	'stroke-palette-5',
	'stroke-palette-6',
	'stroke-palette-7',
	'stroke-palette-8',
	'stroke-palette-9',
	'stroke-palette-10',
	'stroke-palette-11',
	'stroke-palette-12'
] as const;

/** Palette index for a series/bar: 1..12, rotating. */
export function paletteIndex(index: number): number {
	return (((index % 12) + 12) % 12) + 1;
}

/** Linear scale with "nice" 1/2/5×10^n steps and 5-6 ticks (K4-06). Zero is
 * always inside the range, so bars have a baseline to grow from. */
export function niceScale(values: number[], tickTarget = 5): Scale {
	const finite = values.filter((value) => Number.isFinite(value));
	let max = finite.length > 0 ? Math.max(0, ...finite) : 0;
	let min = finite.length > 0 ? Math.min(0, ...finite) : 0;
	if (max === min) {
		// A flat series still needs a range to draw.
		if (max === 0) return { min: 0, max: 1, step: 0.2, ticks: ticksOf(0, 1, 0.2) };
		min = Math.min(0, min);
		max = max + Math.abs(max) * 0.1;
	}
	const rawStep = (max - min) / Math.max(1, tickTarget);
	const magnitude = 10 ** Math.floor(Math.log10(rawStep));
	const normalized = rawStep / magnitude;
	const niceStep = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude;
	const niceMin = Math.floor(min / niceStep) * niceStep;
	const niceMax = Math.ceil(max / niceStep) * niceStep;
	return { min: niceMin, max: niceMax, step: niceStep, ticks: ticksOf(niceMin, niceMax, niceStep) };
}

function ticksOf(min: number, max: number, step: number): number[] {
	const out: number[] = [];
	for (let value = min, guard = 0; value <= max + step / 2 && guard < 100; value += step, guard++) {
		// Floating point noise (0.1+0.2) must not reach the axis labels.
		out.push(Number(value.toFixed(10)));
	}
	return out;
}

/** Axis label for one tick, in the active locale. */
export function tickLabel(value: number): string {
	return formatNumber(value);
}

/** Y position (SVG space, y grows downwards) of a value inside a plot box. */
export function scaleToY(value: number, scale: Scale, top: number, height: number): number {
	if (scale.max === scale.min) return top + height;
	const ratio = (value - scale.min) / (scale.max - scale.min);
	return top + height - ratio * height;
}

/** Height of a bar from the zero line to its value. */
export function barHeight(value: number, scale: Scale, height: number): number {
	const zero = scaleToY(0, scale, 0, height);
	const valueY = scaleToY(value, scale, 0, height);
	return Math.abs(zero - valueY);
}

/** Width of one category band, leaving `gap` between bands. */
export function bandWidth(count: number, width: number, gap = 4): number {
	if (count <= 0) return 0;
	return Math.max(1, width / count - gap);
}

/** SVG polyline points for a line series. */
export function linePoints(values: number[], scale: Scale, width: number, height: number): string {
	if (values.length === 0) return '';
	const step = values.length === 1 ? 0 : width / (values.length - 1);
	return values
		.map((value, index) => `${round(index * step)},${round(scaleToY(value, scale, 0, height))}`)
		.join(' ');
}

/** SVG polyline points for a scale-less inline trend line (KPI sparkline):
 * the series is stretched to fill the box, so small changes stay visible. */
export function sparklinePath(values: number[], width: number, height: number, padding = 2): string {
	if (values.length === 0) return '';
	const min = Math.min(...values);
	const max = Math.max(...values);
	const span = max - min || 1;
	const step = values.length === 1 ? 0 : width / (values.length - 1);
	return values
		.map(
			(value, index) =>
				`${round(index * step)},${round(padding + (1 - (value - min) / span) * (height - padding * 2))}`
		)
		.join(' ');
}

export type PieSlice = { label: string; value: number; from: number; to: number; share: number };

/** Pie slices in radians, starting at 12 o'clock and going clockwise. */
export function pieSlices(values: ChartPoint[], total = values.reduce((sum, point) => sum + Math.max(0, point.value), 0)): PieSlice[] {
	if (total <= 0) return [];
	let angle = -Math.PI / 2;
	return values.map((point) => {
		const share = Math.max(0, point.value) / total;
		const slice = { label: point.label, value: point.value, from: angle, to: angle + share * Math.PI * 2, share };
		angle = slice.to;
		return slice;
	});
}

/** SVG arc path for one slice; a full circle is drawn as two arcs. */
export function piePath(slice: PieSlice, radius: number, cx = 0, cy = 0): string {
	const large = slice.to - slice.from > Math.PI ? 1 : 0;
	const x1 = round(cx + radius * Math.cos(slice.from));
	const y1 = round(cy + radius * Math.sin(slice.from));
	const x2 = round(cx + radius * Math.cos(slice.to));
	const y2 = round(cy + radius * Math.sin(slice.to));
	return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`;
}

/** Keeps the `limit` largest categories and merges the rest into "Other"
 * (K4-07: > 50 categories become 49 + "Other"). */
export function topWithOther(points: ChartPoint[], limit = CATEGORY_MAX): ChartPoint[] {
	if (points.length <= limit || limit <= 0) return points;
	const sorted = [...points].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
	const kept = sorted.slice(0, limit - 1);
	const rest = sorted.slice(limit - 1);
	return [...kept, { label: 'Other', value: rest.reduce((sum, point) => sum + point.value, 0) }];
}

function round(value: number): number {
	return Number(value.toFixed(2));
}
