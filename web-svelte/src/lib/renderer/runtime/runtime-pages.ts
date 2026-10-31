/**
 * PageDefinition statis untuk pilot (MR-04). Definisi tinggal di kode frontend;
 * penyimpanan/editor metadata adalah pekerjaan setelah MVP.
 */
import { FORM_REGION, RESOURCE_LIST_REGION, type FormMode, type PageDefinition } from './page-definition';

export const SALES_CUSTOMER_PAGE: PageDefinition = {
	id: 'sales.customer',
	title: 'Customers',
	regions: [{ id: 'customer-list', type: RESOURCE_LIST_REGION, resourceId: 'sales.customer' }]
};

/** PageDefinition satu region `resource-list` untuk resource yang route list-nya generik (M9). */
function listPage(id: string, title: string, regionId: string): PageDefinition {
	return { id, title, regions: [{ id: regionId, type: RESOURCE_LIST_REGION, resourceId: id }] };
}

/**
 * Satu-satunya daftar resource yang punya PageDefinition. Selector memakai
 * daftar ini, jadi resource lain tidak pernah bisa masuk jalur runtime.
 * Customers default ON (MR-07); resource lain default OFF (M9), tiap resource
 * dengan flag build sendiri di `runtime-flag.ts`.
 */
export const RUNTIME_PAGES: Readonly<Record<string, PageDefinition>> = {
	[SALES_CUSTOMER_PAGE.id]: SALES_CUSTOMER_PAGE,
	'sales.salesperson': listPage('sales.salesperson', 'Salespeople', 'salesperson-list'),
	'inventory.item': listPage('inventory.item', 'Items', 'item-list'),
	'sales.order': listPage('sales.order', 'Orders', 'order-list'),
	'sales.order_line': listPage('sales.order_line', 'Order lines', 'order-line-list'),
	'inventory.stock_count': listPage('inventory.stock_count', 'Stock counts', 'stock-count-list'),
	'inventory.stock_count_line': listPage('inventory.stock_count_line', 'Stock count lines', 'stock-count-line-list'),
	'sales.purchase_order': listPage('sales.purchase_order', 'Purchase orders', 'purchase-order-list'),
	'sales.onboarding': listPage('sales.onboarding', 'Onboarding', 'onboarding-list')
};

const customerForm = (mode: FormMode): PageDefinition => ({
	id: 'sales.customer',
	title: 'Customers',
	regions: [{ id: 'customer-form', type: FORM_REGION, resourceId: 'sales.customer', mode }]
});

/** PageDefinition form per resource dan mode. Hanya resource di sini yang bisa memakai form runtime. */
export const RUNTIME_FORM_PAGES: Readonly<Record<string, Readonly<Record<FormMode, PageDefinition>>>> = {
	'sales.customer': { create: customerForm('create'), edit: customerForm('edit') }
};
