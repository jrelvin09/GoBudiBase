export interface RegistryItem {
	id: number;
	code: string;
	name: string;
	category: string;
	location: string | null;
	status: string;
	value: number | null;
	acquired_at: string | null;
	last_updated: string;
}

export interface PivotResult {
	row_dimension: string;
	col_dimension: string;
	metric: string;
	columns: string[];
	rows: Array<{
		row_key: string;
		cells: Record<string, number>;
		row_total: number;
	}>;
	col_totals: Record<string, number>;
	grand_total: number;
}

export interface DynamicActionRule {
	id: number;
	rule_name: string;
	description: string;
	event_type: string;
	target_field: string;
	condition_operator: string;
	condition_value: string;
	client_actions: Array<{ action: string; field?: string; value?: unknown; css?: string; message?: string }>;
	server_action: string | null;
	is_active: boolean;
}

export interface CalendarEvent {
	id: string;
	title: string;
	start: string;
	end: string;
	backgroundColor: string;
	borderColor: string;
	type: string;
	details: {
		request_no: string;
		state: string;
		priority: string;
		requester: string;
	};
}

export interface MapBuilding {
	id: number;
	name: string;
	code: string;
	lat: number;
	lng: number;
	address: string;
	asset_count: number;
	total_value: number;
}

export interface TreeNode {
	id: string;
	name: string;
	type: 'root' | 'building' | 'floor';
	count?: number;
	value?: number;
	children?: TreeNode[];
}

const API_BASE = '/api/v1';

export async function postRPC<T>(endpoint: string, payload: Record<string, unknown> = {}): Promise<T> {
	const res = await fetch(`${API_BASE}${endpoint}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(payload)
	});

	if (!res.ok) {
		const errText = await res.text();
		throw new Error(`API Error [${res.status}]: ${errText}`);
	}

	if (res.status === 204) return {} as T;
	return res.json();
}
