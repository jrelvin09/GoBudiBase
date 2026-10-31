import type { FieldType } from './field-types';
import type { FieldInputComponent } from './types';
import UnknownField from './UnknownField.svelte';
import TextField from './TextField.svelte';
import TextareaField from './TextareaField.svelte';
import EmailField from './EmailField.svelte';
import NumberField from './NumberField.svelte';
import SelectField from './SelectField.svelte';
import ToggleField from './ToggleField.svelte';
import DateField from './DateField.svelte';
import BelongsToField from './BelongsToField.svelte';
import FileField from './FileField.svelte';
import ImageField from './ImageField.svelte';

/**
 * Pemetaan `field.type` → komponen input. `Record<FieldType, …>` memaksa
 * kuncinya persis sama dengan `field-types.ts` (dan `field-types.json`, dan
 * `fw.FieldTypes` di Go lewat contract_test.go).
 */
const components: Record<FieldType, FieldInputComponent> = {
	text: TextField as unknown as FieldInputComponent,
	textarea: TextareaField as unknown as FieldInputComponent,
	email: EmailField as unknown as FieldInputComponent,
	number: NumberField as unknown as FieldInputComponent,
	select: SelectField as unknown as FieldInputComponent,
	toggle: ToggleField as unknown as FieldInputComponent,
	date: DateField as unknown as FieldInputComponent,
	belongs_to: BelongsToField as unknown as FieldInputComponent,
	file: FileField as unknown as FieldInputComponent,
	image: ImageField as unknown as FieldInputComponent
};

export const fieldInputs: Record<string, FieldInputComponent> = components;

export function getFieldInput(type: string): FieldInputComponent {
	return fieldInputs[type] ?? (UnknownField as unknown as FieldInputComponent);
}
