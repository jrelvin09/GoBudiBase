export type Mode = 'system' | 'light' | 'dark';
export type Density = 'comfortable' | 'compact';
export type ThemePreset = 'neutral' | 'forest';

/** Wire shape of `GET /api/v1/theme` (PRD-Theme-Engine §5.3). */
export interface ThemeResponse {
	preset: string;
	mode: Mode;
	density: Density;
	tokens: Record<string, string>;
	app_name?: string;
	version: number;
	/** Branding, layout, dan varian dari tema terbit (P8). */
	logo_url?: string;
	layout?: { content_width?: 'full' | 'narrow'; sidebar?: 'expanded' | 'collapsed' };
	variants?: { card?: 'flat' | 'elevated'; table?: 'plain' | 'striped' };
}

/** Atribut `data-*` pada <html> yang membawa layout/varian tema terbit. Murni, supaya bisa diuji. */
export function themeAttributes(theme: Pick<ThemeResponse, 'layout' | 'variants'>): Record<string, string> {
	const out: Record<string, string> = {};
	if (theme.layout?.content_width) out['content-width'] = theme.layout.content_width;
	if (theme.layout?.sidebar) out['sidebar'] = theme.layout.sidebar;
	if (theme.variants?.card) out['card'] = theme.variants.card;
	if (theme.variants?.table) out['table'] = theme.variants.table;
	return out;
}

/** `tokens` keys the frontend is allowed to apply (T1-05). */
export const TOKEN_ALLOWLIST = [
	'primary',
	'primary-foreground',
	'accent',
	'accent-foreground',
	'radius',
	'font-sans'
] as const;
