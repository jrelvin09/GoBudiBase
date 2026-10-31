/** Colour helpers for the Theme Engine (T2-06), mirroring fw/color.go. */

export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export function isHexColor(value: string | null | undefined): value is string {
	return typeof value === 'string' && HEX_COLOR.test(value);
}

function channel(part: number): number {
	const x = part / 255;
	return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
	const value = hex.replace('#', '');
	const r = channel(parseInt(value.slice(0, 2), 16));
	const g = channel(parseInt(value.slice(2, 4), 16));
	const b = channel(parseInt(value.slice(4, 6), 16));
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
	const la = relativeLuminance(a);
	const lb = relativeLuminance(b);
	const [high, low] = la < lb ? [lb, la] : [la, lb];
	return (high + 0.05) / (low + 0.05);
}

/** The readable text colour on top of `hex` (the same choice the server makes). */
export function foregroundFor(hex: string): '#ffffff' | '#111111' {
	const white = contrastRatio(hex, '#ffffff');
	const dark = contrastRatio(hex, '#111111');
	return white >= dark ? '#ffffff' : '#111111';
}
