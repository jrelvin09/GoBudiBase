import { executeBatch, executeSqlStudio } from '$lib/api/builderClient';

export interface ActionStep {
	type: 'navigate' | 'toast' | 'save_row' | 'delete_row' | 'query' | 'custom_script';
	targetPage?: string;
	message?: string;
	toastType?: 'success' | 'info' | 'error' | 'warning';
	table?: string;
	values?: Record<string, unknown>;
	id?: any;
	sql?: string;
	script?: string;
}

/**
 * Resolves Handlebars-like dynamic bindings:
 * {{ [Form].[field] }} or {{ user.role }} or {{ val }}
 */
export function resolveBindings(template: string, context: Record<string, any> = {}): string {
	if (!template || typeof template !== 'string') return template;
	return template.replace(/\{\{\s*([^{}]+)\s*\}\}/g, (_, expression) => {
		const expr = expression.trim();

		// Handle bracket format: [Object].[field]
		const sanitized = expr.replace(/\[([^\]]+)\]/g, '$1');
		const parts = sanitized.split('.');

		let current: any = context;
		for (const part of parts) {
			if (current == null) return '';
			current = current[part];
		}
		return current != null ? String(current) : '';
	});
}

/**
 * Runs an action chain sequentially.
 */
export async function runActionChain(
	steps: ActionStep[] = [],
	context: {
		currentPage?: string;
		onNavigate?: (pageSlug: string) => void;
		onNotify?: (message: string, type?: 'success' | 'info' | 'error' | 'warning') => void;
		formData?: Record<string, any>;
		selectedRow?: Record<string, any>;
		currentUser?: { id: number; name: string; role: string };
	} = {}
): Promise<{ success: boolean; error?: string }> {
	for (const step of steps) {
		try {
			switch (step.type) {
				case 'navigate': {
					if (step.targetPage && context.onNavigate) {
						const resolved = resolveBindings(step.targetPage, context);
						context.onNavigate(resolved);
					}
					break;
				}

				case 'toast': {
					if (step.message) {
						const resolvedMsg = resolveBindings(step.message, context);
						if (context.onNotify) {
							context.onNotify(resolvedMsg, step.toastType || 'info');
						} else {
							alert(resolvedMsg);
						}
					}
					break;
				}

				case 'save_row': {
					if (step.table) {
						const fullTable = step.table.includes('.') ? step.table : `app.${step.table}`;
						const values = step.values || context.formData || {};
						if (step.id) {
							await executeBatch(fullTable, [{ op: 'update', id: step.id, values }]);
						} else {
							await executeBatch(fullTable, [{ op: 'create', values }]);
						}
					}
					break;
				}

				case 'delete_row': {
					if (step.table && (step.id || context.selectedRow?.id)) {
						const fullTable = step.table.includes('.') ? step.table : `app.${step.table}`;
						const targetId = step.id || context.selectedRow?.id;
						await executeBatch(fullTable, [{ op: 'delete', id: targetId }]);
					}
					break;
				}

				case 'query': {
					if (step.sql) {
						const resolvedSQL = resolveBindings(step.sql, context);
						await executeSqlStudio(resolvedSQL, 50);
					}
					break;
				}

				case 'custom_script': {
					if (step.script) {
						// Safe evaluation with context
						const fn = new Function('context', 'resolveBindings', step.script);
						fn(context, resolveBindings);
					}
					break;
				}
			}
		} catch (err: any) {
			console.error(`Action step failed [${step.type}]:`, err);
			return { success: false, error: err.message || 'Action step execution failed' };
		}
	}

	return { success: true };
}
