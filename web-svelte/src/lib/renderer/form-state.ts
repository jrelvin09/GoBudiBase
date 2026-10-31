import type { ResourceMeta } from '$lib/api/resource-types';
import { isVisible } from './visibility';

export type FormValues = Record<string, unknown>;
export type FormErrors = Record<string, string>;

/** Bentuk `field_errors[]` dari `/api/v1/r/*` (kunci `field`, bukan `path`). */
export type ServerFieldError = { field?: string; path?: string; message: string };

/** Nilai awal tiap field dari metadata: `default` atau `null`. */
export function initialValues(meta: ResourceMeta): FormValues {
	const values: FormValues = {};
	for (const field of meta.fields) {
		// A hidden field is not required on the client either (F6-04).
		if (!isVisible(field, values)) continue;
		if (field.type === 'toggle') {
			values[field.name] = field.default === true || field.default === 'true' || field.default === 1 || field.default === '1';
		} else {
			values[field.name] = field.default ?? null;
		}
	}
	return values;
}

function isEmpty(value: unknown): boolean {
	return value === null || value === undefined || value === '';
}

/**
 * Validasi klien untuk UX saja (server tetap otoritatif); mengembalikan peta
 * field → kunci pesan.
 */
export function clientValidate(meta: ResourceMeta, values: FormValues): FormErrors {
	const errors: FormErrors = {};
	for (const field of meta.fields) {
		// A hidden field is not required on the client either (F6-04), and a
		// ReadOnly field cannot be filled by the client (F8-02).
		if (field.read_only || !isVisible(field, values)) continue;
		const value = values[field.name];
		if (isEmpty(value)) {
			if (field.required) errors[field.name] = 'kit.item.required_value';
			continue;
		}
		if (field.max_length && typeof value === 'string' && value.length > field.max_length) {
			errors[field.name] = 'kit.item.max_length';
			continue;
		}
		if (field.type === 'number' && typeof value === 'number') {
			if (field.min !== undefined && value < field.min) errors[field.name] = 'kit.item.min_value';
			else if (field.max !== undefined && value > field.max) errors[field.name] = 'kit.item.max_value';
		}
	}
	return errors;
}

function sameValue(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	return (a === null || a === undefined) && (b === null || b === undefined);
}

/** Nama field yang nilainya berbeda dari nilai awal. */
export function changedFields(original: FormValues, current: FormValues): string[] {
	const changed: string[] = [];
	for (const key of Object.keys(current)) {
		if (!sameValue(original[key], current[key])) changed.push(key);
	}
	return changed;
}

export function serverErrorsToMap(errors: ServerFieldError[]): FormErrors {
	const map: FormErrors = {};
	for (const err of errors) {
		const key = err.field ?? err.path;
		if (key) map[key] = err.message;
	}
	return map;
}
