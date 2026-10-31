/**
 * Flag build untuk jalur runtime pilot (MR-04, default ON sejak MR-07).
 *
 * Dibaca sekali saat build frontend. ON bila variabel tidak diset (default
 * rollout MR-07) atau berisi string persis `'true'`. OFF untuk nilai lain apa
 * pun — termasuk `'false'` (rollback) dan salah ketik, sehingga salah ketik
 * jatuh ke jalur lama yang sudah terbukti. Rollback = build ulang dengan
 * `'false'` lalu rilis bundle baru — mengubah environment proses Go yang
 * sedang berjalan tidak mengubah SPA yang sudah ter-embed.
 */
import type { FormMode, PageDefinition } from './page-definition';
import { RUNTIME_FORM_PAGES, RUNTIME_PAGES } from './runtime-pages';

export const RUNTIME_FLAG_NAME = 'VITE_RUNTIME_SALES_CUSTOMER';

export function isRuntimeEnabled(value: unknown = import.meta.env.VITE_RUNTIME_SALES_CUSTOMER): boolean {
	return value === undefined || value === 'true';
}

/**
 * Flag build per resource (M9). Tabel statis dengan nama env eksplisit; tidak
 * pernah disusun dari metadata atau input browser. Nilai dibaca saat build.
 * Semua resource default ON (Customers sejak MR-07; sisanya disetujui pemilik
 * proyek 2026-09-30). Rollback resource = build ulang dengan `'false'`, tanpa
 * mengubah resource lain.
 */
export const RUNTIME_RESOURCE_FLAGS: Readonly<Record<string, unknown>> = {
	'sales.customer': import.meta.env.VITE_RUNTIME_SALES_CUSTOMER,
	'sales.salesperson': import.meta.env.VITE_RUNTIME_SALES_SALESPERSON,
	'inventory.item': import.meta.env.VITE_RUNTIME_INVENTORY_ITEM,
	'sales.order': import.meta.env.VITE_RUNTIME_SALES_ORDER,
	'sales.order_line': import.meta.env.VITE_RUNTIME_SALES_ORDER_LINE,
	'inventory.stock_count': import.meta.env.VITE_RUNTIME_INVENTORY_STOCK_COUNT,
	'inventory.stock_count_line': import.meta.env.VITE_RUNTIME_INVENTORY_STOCK_COUNT_LINE,
	'sales.purchase_order': import.meta.env.VITE_RUNTIME_SALES_PURCHASE_ORDER,
	'sales.onboarding': import.meta.env.VITE_RUNTIME_SALES_ONBOARDING
};


/**
 * PageDefinition untuk satu resource, hanya bila flag resource itu ON dan
 * resource itu punya definisi. Selain itu `undefined` — route tetap memakai
 * `ResourceListPage` seperti sekarang.
 */
export function runtimePageFor(
	resourceId: string,
	flagValue: unknown = RUNTIME_RESOURCE_FLAGS[resourceId]
): PageDefinition | undefined {
	const page = RUNTIME_PAGES[resourceId];
	if (!page) return undefined;
	const on = isRuntimeEnabled(flagValue);
	return on ? page : undefined;
}

export const RUNTIME_FORM_FLAG_NAME = 'VITE_RUNTIME_SALES_CUSTOMER_FORM';

/** Form runtime default ON (disetujui pemilik proyek 2026-09-30): flag absen atau `'true'` = ON; `'false'` dan nilai lain = jalur lama. */
export function isRuntimeFormEnabled(value: unknown = import.meta.env.VITE_RUNTIME_SALES_CUSTOMER_FORM): boolean {
	return value === undefined || value === 'true';
}

/** PageDefinition form untuk resource+mode, hanya bila flag form ON dan resource terdaftar. */
export function runtimeFormPageFor(
	resourceId: string,
	mode: FormMode,
	flagValue: unknown = import.meta.env.VITE_RUNTIME_SALES_CUSTOMER_FORM
): PageDefinition | undefined {
	if (!isRuntimeFormEnabled(flagValue)) return undefined;
	return RUNTIME_FORM_PAGES[resourceId]?.[mode];
}

export const PUBLISHED_PAGES_FLAG_NAME = 'VITE_PUBLISHED_PAGES';

/**
 * Flag build untuk resolusi halaman terbit di produksi (B014, LC-D4).
 * Default ON sejak tingkat A (2026-10-01; bukti browser di docs/reviews/lowcode-PRD-coverage-matrix.md):
 * ON bila variabel tidak diset atau persis `'true'`. Nilai lain (termasuk `'false'`
 * dan salah ketik) = OFF, jalur lama. Rollback = build ulang dengan `'false'`.
 * Tanpa halaman terbit untuk sebuah resource, perilakunya sama dengan sebelumnya.
 */
export function isPublishedPagesEnabled(value: unknown = import.meta.env.VITE_PUBLISHED_PAGES): boolean {
	return value === undefined || value === 'true';
}
