export interface RuntimeComponent {
	id: number;
	name: string;
	type: string;
	region: string;
	order_num: number;
	datasource_type: string;
	datasource_config: Record<string, unknown>;
	props: Record<string, unknown>;
	actions: Array<Record<string, unknown>>;
}

export interface RuntimePage {
	id: number;
	slug: string;
	title: string;
	icon: string;
	layout: string;
	order_num: number;
	is_home: boolean;
	components: RuntimeComponent[];
}

export interface RuntimeApp {
	app: {
		id: number;
		slug: string;
		name: string;
		description: string;
		icon: string;
		theme: string;
		version: string;
	};
	pages: RuntimePage[];
}

export interface AppListItem {
	id: number;
	slug: string;
	name: string;
	description: string;
	icon: string;
	theme: string;
	version: string;
	is_published: boolean;
	page_count: number;
	created_at: string;
	updated_at: string;
}

export interface SchemaTable {
	schema: string;
	name: string;
	type: string;
}

export interface TableColumn {
	name: string;
	data_type: string;
	is_nullable: string;
	default_val: string | null;
	position: number;
}

const API_BUILDER = '/api/v1/builder';

export async function fetchRuntimeApp(slug: string = 'bmn-enterprise'): Promise<RuntimeApp> {
	const res = await fetch(`${API_BUILDER}/runtime?slug=${encodeURIComponent(slug)}`);
	if (!res.ok) {
		const txt = await res.text();
		throw new Error(`Failed to load runtime app [${res.status}]: ${txt}`);
	}
	return res.json();
}

export async function fetchAppsList(): Promise<AppListItem[]> {
	const res = await fetch(`${API_BUILDER}/apps`);
	if (!res.ok) throw new Error('Failed to fetch apps list');
	return res.json();
}

export async function createNewApp(data: {
	slug: string;
	name: string;
	description?: string;
	icon?: string;
	theme?: string;
}): Promise<{ app_id: number; slug: string }> {
	const res = await fetch(`${API_BUILDER}/apps/create`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	});
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}

export async function createNewPage(data: {
	app_id: number;
	slug: string;
	title: string;
	icon?: string;
	layout?: string;
}): Promise<{ page_id: number }> {
	const res = await fetch(`${API_BUILDER}/pages/create`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	});
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}

export async function deletePage(page_id: number): Promise<void> {
	const res = await fetch(`${API_BUILDER}/pages/delete`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ page_id })
	});
	if (!res.ok) throw new Error(await res.text());
}

export async function createComponent(data: {
	page_id: number;
	name: string;
	type: string;
	region?: string;
	datasource_type?: string;
	datasource_config?: Record<string, unknown>;
	props?: Record<string, unknown>;
	actions?: Array<Record<string, unknown>>;
}): Promise<{ component_id: number }> {
	const res = await fetch(`${API_BUILDER}/components/create`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	});
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}

export async function updateComponent(data: {
	component_id: number;
	name: string;
	region?: string;
	datasource_type?: string;
	datasource_config?: Record<string, unknown>;
	props?: Record<string, unknown>;
	actions?: Array<Record<string, unknown>>;
}): Promise<void> {
	const res = await fetch(`${API_BUILDER}/components/update`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	});
	if (!res.ok) throw new Error(await res.text());
}

export async function deleteComponent(component_id: number): Promise<void> {
	const res = await fetch(`${API_BUILDER}/components/delete`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ component_id })
	});
	if (!res.ok) throw new Error(await res.text());
}

export async function fetchSchemaTables(): Promise<SchemaTable[]> {
	const res = await fetch(`${API_BUILDER}/schema/tables`);
	if (!res.ok) throw new Error('Failed to fetch schema tables');
	return res.json();
}

export async function fetchTableColumns(schema: string, table: string): Promise<TableColumn[]> {
	const res = await fetch(`${API_BUILDER}/schema/columns?schema=${encodeURIComponent(schema)}&table=${encodeURIComponent(table)}`);
	if (!res.ok) throw new Error('Failed to fetch table columns');
	return res.json();
}

export async function executeSqlStudio(sql: string, limit: number = 100): Promise<{ columns: string[]; rows: any[]; total: number }> {
	const res = await fetch(`${API_BUILDER}/query/execute`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ sql, limit })
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({ error: 'Query execution failed' }));
		throw new Error(err.error || 'Query failed');
	}
	return res.json();
}
