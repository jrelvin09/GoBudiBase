import type { Component } from 'svelte';
import type { ItemLabelPosition } from '$lib/kit/molecules/Item.svelte';
import type { FieldType } from './field-types';

export type { FieldType };

/** `fw.VisibleWhen` (F6-04): the field shows only while `field` matches `values`. */
export type VisibleWhen = { field: string; values: unknown[] };

export type OptionMeta = {
	value: string;
	label: string;
};

/** Cermin `fw.FieldMeta` (backend/internal/core/fw/meta.go); nama properti = tag JSON Go. */
export type FieldMeta = {
	name: string;
	type: FieldType;
	label: string;
	required: boolean;
	max_length?: number;
	min?: number;
	max?: number;
	default?: unknown;
	options?: OptionMeta[];
	upper?: boolean;
	searchable?: boolean;
	sortable?: boolean;
	filterable?: boolean;
	/** Faceted Search facet (K6-01); only select/toggle/number/date fields. */
	facet?: boolean;
	in_table: boolean;
	/** Field tampil di form/grid tapi tidak bisa diedit klien (F8-02). */
	read_only?: boolean;
	/** File/image upload size cap and allowed MIME types (F6-03). */
	max_size?: number;
	accept?: string[];
	/** Conditional visibility (F6-04). */
	visible_when?: VisibleWhen;
};

/** Kontrak setiap input field di registry. */
export type FieldInputProps = {
	field: FieldMeta;
	id: string;
	value: unknown;
	error?: string;
	readOnly?: boolean;
	/** Diteruskan ke *Item; grid memakai `hidden` supaya label hanya untuk pembaca layar. */
	labelPosition?: ItemLabelPosition;
	onchange: (value: unknown) => void;
};

export type FieldInputComponent = Component<FieldInputProps>;
