/**
 * Studio tema (P8): bentuk datar untuk formulir <-> definisi tema server.
 * Murni dan tanpa DOM; server tetap memvalidasi enum, kontras, dan URL logo.
 */
export interface ThemeDraft {
	label: string;
	preset: string;
	density: string;
	radius: string;
	primary: string;
	primary_dark: string;
	accent: string;
	app_name: string;
	logo_url: string;
	content_width: string;
	sidebar: string;
	card: string;
	table: string;
}

export interface ThemeBody {
	label: string;
	preset?: string;
	density?: string;
	radius?: string;
	primary?: string;
	primary_dark?: string;
	accent?: string;
	app_name?: string;
	logo_url?: string;
	layout?: { content_width?: 'full' | 'narrow'; sidebar?: 'expanded' | 'collapsed' };
	variants?: { card?: 'flat' | 'elevated'; table?: 'plain' | 'striped' };
}

export function emptyThemeDraft(): ThemeDraft {
	return { label: '', preset: '', density: '', radius: '', primary: '', primary_dark: '', accent: '', app_name: '', logo_url: '', content_width: '', sidebar: '', card: '', table: '' };
}

/** Definisi tema untuk server: nilai kosong dibuang, layout/varian hanya bila terisi. */
export function draftToTheme(d: ThemeDraft): ThemeBody {
	const out: ThemeBody = { label: d.label.trim() };
	for (const key of ['preset', 'density', 'radius', 'primary', 'primary_dark', 'accent', 'app_name', 'logo_url'] as const) {
		if (d[key].trim() !== '') out[key] = d[key].trim();
	}
	if (d.content_width || d.sidebar) {
		out.layout = {
			...(d.content_width ? { content_width: d.content_width as 'full' | 'narrow' } : {}),
			...(d.sidebar ? { sidebar: d.sidebar as 'expanded' | 'collapsed' } : {})
		};
	}
	if (d.card || d.table) {
		out.variants = {
			...(d.card ? { card: d.card as 'flat' | 'elevated' } : {}),
			...(d.table ? { table: d.table as 'plain' | 'striped' } : {})
		};
	}
	return out;
}

/** Definisi tersimpan -> formulir datar. */
export function themeToDraft(body: Partial<ThemeBody>): ThemeDraft {
	return {
		...emptyThemeDraft(),
		label: body.label ?? '',
		preset: body.preset ?? '',
		density: body.density ?? '',
		radius: body.radius ?? '',
		primary: body.primary ?? '',
		primary_dark: body.primary_dark ?? '',
		accent: body.accent ?? '',
		app_name: body.app_name ?? '',
		logo_url: body.logo_url ?? '',
		content_width: body.layout?.content_width ?? '',
		sidebar: body.layout?.sidebar ?? '',
		card: body.variants?.card ?? '',
		table: body.variants?.table ?? ''
	};
}
