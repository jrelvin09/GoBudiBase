import type { FilterOperator, IgFilter, IgRecord } from './types';

export function evaluateFilter(record: IgRecord, filter: IgFilter): boolean {
	if (!filter.enabled) return true;
	const raw = record[filter.column];
	const valStr = raw === null || raw === undefined ? '' : String(raw).trim();
	const targetStr = (filter.value || '').trim();
	const targetNum = Number(targetStr);
	const valNum = Number(raw);

	switch (filter.op) {
		case 'equals':
			if (!isNaN(valNum) && !isNaN(targetNum) && targetStr !== '') {
				return valNum === targetNum;
			}
			return valStr.toLowerCase() === targetStr.toLowerCase();

		case 'not_equals':
			if (!isNaN(valNum) && !isNaN(targetNum) && targetStr !== '') {
				return valNum !== targetNum;
			}
			return valStr.toLowerCase() !== targetStr.toLowerCase();

		case 'contains':
			return valStr.toLowerCase().includes(targetStr.toLowerCase());

		case 'does_not_contain':
			return !valStr.toLowerCase().includes(targetStr.toLowerCase());

		case 'starts_with':
			return valStr.toLowerCase().startsWith(targetStr.toLowerCase());

		case 'ends_with':
			return valStr.toLowerCase().endsWith(targetStr.toLowerCase());

		case 'greater_than':
			if (!isNaN(valNum) && !isNaN(targetNum)) {
				return valNum > targetNum;
			}
			return valStr.localeCompare(targetStr) > 0;

		case 'less_than':
			if (!isNaN(valNum) && !isNaN(targetNum)) {
				return valNum < targetNum;
			}
			return valStr.localeCompare(targetStr) < 0;

		case 'between': {
			const minNum = Number(filter.value);
			const maxNum = Number(filter.value2);
			if (!isNaN(valNum) && !isNaN(minNum) && !isNaN(maxNum)) {
				return valNum >= minNum && valNum <= maxNum;
			}
			const minStr = filter.value || '';
			const maxStr = filter.value2 || '';
			return valStr >= minStr && valStr <= maxStr;
		}

		case 'in': {
			const tokens = targetStr.split(',').map((s) => s.trim().toLowerCase());
			return tokens.includes(valStr.toLowerCase());
		}

		case 'is_null':
			return raw === null || raw === undefined || valStr === '';

		case 'is_not_null':
			return raw !== null && raw !== undefined && valStr !== '';

		default:
			return true;
	}
}

export function evaluateAllFilters(record: IgRecord, filters: IgFilter[]): boolean {
	for (const f of filters) {
		if (!evaluateFilter(record, f)) return false;
	}
	return true;
}
