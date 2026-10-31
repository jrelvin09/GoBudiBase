/** Satu sumber daftar tipe field di frontend. */
export const fieldTypes = ['text', 'textarea', 'email', 'number', 'select', 'toggle', 'date', 'belongs_to', 'file', 'image'] as const;

export type FieldType = (typeof fieldTypes)[number];
