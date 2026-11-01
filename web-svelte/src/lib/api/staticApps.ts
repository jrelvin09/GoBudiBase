import type { RuntimeApp, AppListItem, SchemaTable } from './builderClient';

export const STATIC_APPS_LIST: AppListItem[] = [
	{
		id: 2,
		slug: 'gopimsbase',
		name: 'Harvest Cloud - PIMS (GoPimsBase)',
		description: 'Kloning UI, data riil, dan fungsi bisnis dari Oracle APEX Harvest Cloud PIMS (App 103) di GoBudiBase Engine',
		icon: 'Trees',
		theme: 'light',
		version: '1.0.0',
		is_published: true,
		page_count: 11,
		created_at: '2026-10-31T18:10:02Z',
		updated_at: '2026-11-01T01:30:00Z'
	},
	{
		id: 1,
		slug: 'bmn-enterprise',
		name: 'Sistem Pengelolaan Barang Milik Negara (BMN)',
		description: 'Aplikasi Enterprise Terintegrasi Paritas Oracle APEX untuk Tata Kelola Aset & Audit',
		icon: 'Layers',
		theme: 'dark',
		version: '2.0.0',
		is_published: true,
		page_count: 8,
		created_at: '2026-10-31T05:06:36Z',
		updated_at: '2026-10-31T05:06:36Z'
	}
];

export const STATIC_PIMS_APP: RuntimeApp = {
	app: {
		id: 2,
		slug: 'gopimsbase',
		name: 'Harvest Cloud - PIMS (GoPimsBase)',
		description: 'Kloning UI, data riil, dan fungsi bisnis dari Oracle APEX Harvest Cloud PIMS (App 103) di GoBudiBase Engine',
		icon: 'Trees',
		theme: 'light',
		version: '1.0.0',
		nav_type: 'side'
	},
	pages: [
		{
			id: 22,
			slug: 'login',
			title: 'Login Harvest Cloud (P-9999)',
			icon: 'KeyRound',
			layout: 'single',
			group_name: 'Autentikasi & Akses',
			order_num: 0,
			is_home: false,
			components: [
				{
					id: 50,
					name: 'Form Autentikasi Pengguna (Page 9999)',
					type: 'form',
					region: 'main',
					order_num: 1,
					datasource_type: 'none',
					datasource_config: {},
					props: {
						title: 'Plantation Integrated Management System (PIMS)',
						subtitle: 'Oracle APEX Redwood Login',
						fields: [
							{ name: 'username', label: 'Username / NIK', type: 'text', placeholder: 'IT000002', required: true },
							{ name: 'password', label: 'Password', type: 'password', placeholder: '••••••••••••', required: true },
							{ name: 'remember_me', label: 'Ingat Username di Perangkat Ini', type: 'checkbox', default: true }
						]
					},
					actions: []
				},
				{
					id: 51,
					name: 'Tombol Masuk / Sign In',
					type: 'button',
					region: 'main',
					order_num: 2,
					datasource_type: 'none',
					datasource_config: {},
					props: {
						title: 'Sign In',
						variant: 'primary',
						color: '#026cb6'
					},
					actions: [
						{ type: 'submit', target: '/api/v1/auth/login' }
					]
				}
			]
		},
		{
			id: 11,
			slug: 'dashboard',
			title: 'Dashboard PIMS',
			icon: 'Home',
			layout: 'dashboard-4',
			group_name: 'Dashboard',
			order_num: 1,
			is_home: true,
			components: [
				{
					id: 29,
					name: 'Total Pengguna Aktif',
					type: 'metric_card',
					region: 'main',
					order_num: 1,
					datasource_type: 'table',
					datasource_config: { table: 'pims.users' },
					props: {
						title: 'Total Pengguna Aktif',
						value: '761',
						subtitle: 'Akun terdaftar di database',
						icon: 'Users',
						color: 'blue'
					},
					actions: []
				},
				{
					id: 30,
					name: 'Menu Sistem Navigasi',
					type: 'metric_card',
					region: 'main',
					order_num: 2,
					datasource_type: 'table',
					datasource_config: { table: 'pims.menus' },
					props: {
						title: 'Menu Sistem Navigasi',
						value: '269',
						subtitle: 'Menu APEX terintegrasi',
						icon: 'FolderTree',
						color: 'emerald'
					},
					actions: []
				},
				{
					id: 31,
					name: 'Aturan Persetujuan',
					type: 'metric_card',
					region: 'main',
					order_num: 3,
					datasource_type: 'table',
					datasource_config: { table: 'pims.approval_hierarchy' },
					props: {
						title: 'Aturan Persetujuan',
						value: '48',
						subtitle: 'Routing hierarchy aktif',
						icon: 'GitCommit',
						color: 'amber'
					},
					actions: []
				},
				{
					id: 32,
					name: 'Subsidiary Perkebunan',
					type: 'metric_card',
					region: 'main',
					order_num: 4,
					datasource_type: 'table',
					datasource_config: {},
					props: {
						title: 'Subsidiary Perkebunan',
						value: '4',
						subtitle: 'KYA, SWA, CPEA, TMM',
						icon: 'Building2',
						color: 'purple'
					},
					actions: []
				},
				{
					id: 33,
					name: 'Distribusi Pengguna per Subsidiary',
					type: 'chart',
					region: 'main',
					order_num: 5,
					datasource_type: 'table',
					datasource_config: { table: 'pims.users' },
					props: {
						title: 'Distribusi Pengguna per Subsidiary',
						chartType: 'bar',
						xField: 'subsidiary',
						yField: 'count'
					},
					actions: []
				},
				{
					id: 34,
					name: 'Aktivitas Pengguna & Audit Terbaru',
					type: 'interactive_grid',
					region: 'main',
					order_num: 6,
					datasource_type: 'table',
					datasource_config: { table: 'pims.users' },
					props: {
						title: 'Aktivitas Pengguna Terbaru',
						pageSize: 10,
						editable: false,
						columns: ['nik', 'nama', 'role', 'subsidiary', 'aktif', 'tgl_diubah']
					},
					actions: []
				}
			]
		},
		{
			id: 12,
			slug: 'setup-user-informations',
			title: 'SETUP Informasi User (P-160)',
			icon: 'Users',
			layout: 'single',
			group_name: 'Konfigurasi Setup',
			order_num: 2,
			is_home: false,
			components: [
				{
					id: 35,
					name: 'Interactive Grid Informasi User (Page 160)',
					type: 'interactive_grid',
					region: 'main',
					order_num: 1,
					datasource_type: 'table',
					datasource_config: { table: 'pims.users', schema: 'pims' },
					props: {
						title: 'SETUP Informasi User',
						pageSize: 25,
						editable: true,
						showSearch: true,
						showExport: true,
						columns: [
							'nik',
							'nama',
							'manager',
							'subsidiary',
							'role',
							'aktif',
							'dibuat_oleh',
							'tgl_dibuat',
							'diubah_oleh',
							'tgl_diubah'
						]
					},
					actions: []
				},
				{
					id: 36,
					name: 'Detail Akun Pengguna (Page 432)',
					type: 'form',
					region: 'main',
					order_num: 2,
					datasource_type: 'table',
					datasource_config: { table: 'pims.users', schema: 'pims' },
					props: {
						title: 'SETUP Informasi User - Ubah Data',
						fields: [
							{ name: 'nik', label: 'Username / NIK', type: 'text', readOnly: true },
							{ name: 'nama', label: 'Nama Lengkap', type: 'text' },
							{ name: 'subsidiary', label: 'Subsidiary (Multi-select)', type: 'select' },
							{ name: 'role', label: 'Role / Hak Akses', type: 'select' },
							{ name: 'aktif', label: 'Data Aktif', type: 'checkbox' }
						]
					},
					actions: []
				}
			]
		},
		{
			id: 13,
			slug: 'setup-user-menus',
			title: 'SETUP Menu User (P-161)',
			icon: 'FolderTree',
			layout: 'single',
			group_name: 'Konfigurasi Setup',
			order_num: 3,
			is_home: false,
			components: [
				{
					id: 37,
					name: 'Interactive Grid Menu User (Page 161)',
					type: 'interactive_grid',
					region: 'main',
					order_num: 1,
					datasource_type: 'table',
					datasource_config: { table: 'pims.menus', schema: 'pims' },
					props: {
						title: 'SETUP Menu User',
						pageSize: 25,
						editable: true,
						showSearch: true,
						columns: [
							'row_no',
							'parent_menu',
							'nama_menu',
							'menu_link',
							'aktif',
							'dibuat_oleh',
							'tgl_dibuat'
						]
					},
					actions: []
				},
				{
					id: 38,
					name: 'Form Buat / Ubah Menu User (Page 453)',
					type: 'form',
					region: 'main',
					order_num: 2,
					datasource_type: 'table',
					datasource_config: { table: 'pims.menus', schema: 'pims' },
					props: {
						title: 'SETUP Menu User - Create',
						fields: [
							{ name: 'parent_menu', label: 'Menu Utama (Parent LOV)', type: 'select' },
							{ name: 'nama_menu', label: 'Nama Menu', type: 'text' },
							{ name: 'menu_link', label: 'Halaman Menu (Target Link)', type: 'text' },
							{ name: 'aktif', label: 'Data Aktif', type: 'checkbox' }
						]
					},
					actions: []
				}
			]
		},
		{
			id: 14,
			slug: 'role-management',
			title: 'SETUP Akses Halaman (P-162)',
			icon: 'Shield',
			layout: 'single',
			group_name: 'Konfigurasi Setup',
			order_num: 4,
			is_home: false,
			components: [
				{
					id: 39,
					name: 'Daftar Role Sistem HCM (Page 162)',
					type: 'interactive_grid',
					region: 'main',
					order_num: 1,
					datasource_type: 'table',
					datasource_config: { table: 'pims.roles', schema: 'pims' },
					props: {
						title: 'ROLE MANAGEMENT',
						pageSize: 20,
						columns: ['role_id', 'role_name', 'role_status', 'descr']
					},
					actions: []
				},
				{
					id: 40,
					name: 'Matrix Hak Akses Modul per Role',
					type: 'pivot_matrix',
					region: 'main',
					order_num: 2,
					datasource_type: 'table',
					datasource_config: { table: 'pims.roles', schema: 'pims' },
					props: {
						title: 'Matriks Hak Akses Halaman',
						metric: 'count',
						col_dim: 'role_status',
						row_dim: 'role_name'
					},
					actions: []
				}
			]
		},
		{
			id: 15,
			slug: 'approval-hierarchy',
			title: 'SETUP Approval Hierarchy (P-163)',
			icon: 'GitCommit',
			layout: 'single',
			group_name: 'Konfigurasi Setup',
			order_num: 5,
			is_home: false,
			components: [
				{
					id: 41,
					name: 'Routing Persetujuan Multi-Level (Page 163)',
					type: 'interactive_grid',
					region: 'main',
					order_num: 1,
					datasource_type: 'table',
					datasource_config: { table: 'pims.approval_hierarchy', schema: 'pims' },
					props: {
						title: 'TO Result Approval Hierarchy',
						pageSize: 25,
						editable: true,
						columns: [
							'module',
							'subsidiary',
							'type_name',
							'site',
							'afdeling',
							'approver_level',
							'user_name',
							'is_active'
						]
					},
					actions: []
				},
				{
					id: 42,
					name: 'Alur Jenjang Persetujuan Level 1-4',
					type: 'kanban_board',
					region: 'main',
					order_num: 2,
					datasource_type: 'table',
					datasource_config: { table: 'pims.approval_hierarchy', schema: 'pims' },
					props: {
						title: 'Jenjang Approval Visualizer',
						columnField: 'approver_level'
					},
					actions: []
				}
			]
		},
		{
			id: 16,
			slug: 'reset-password',
			title: 'Reset Password (P-164)',
			icon: 'KeyRound',
			layout: 'single',
			group_name: 'Konfigurasi Setup',
			order_num: 6,
			is_home: false,
			components: [
				{
					id: 43,
					name: 'Form Reset Kata Sandi User (Page 164)',
					type: 'form',
					region: 'main',
					order_num: 1,
					datasource_type: 'table',
					datasource_config: {},
					props: {
						title: 'Reset Password User Terpusat',
						fields: [
							{ name: 'username', label: 'Username / NIK (P164_USERNAME)', type: 'select' },
							{ name: 'new_password', label: 'Password Baru', type: 'password' },
							{ name: 'confirm_password', label: 'Konfirmasi Password Baru', type: 'password' },
							{ name: 'force_change', label: 'Wajib Ubah Kata Sandi saat Login Berikutnya', type: 'checkbox' }
						]
					},
					actions: []
				}
			]
		},
		{
			id: 17,
			slug: 'md-unit-types',
			title: 'Master Tipe Unit (P-127)',
			icon: 'Layers',
			layout: 'single',
			group_name: 'Master Data',
			order_num: 7,
			is_home: false,
			components: [
				{
					id: 44,
					name: 'Master Data Tipe Unit Kendaraan & Traktor',
					type: 'interactive_grid',
					region: 'main',
					order_num: 1,
					datasource_type: 'table',
					datasource_config: {},
					props: {
						title: 'MD Unit Types Landing (P-127)',
						pageSize: 25,
						editable: true
					},
					actions: []
				}
			]
		},
		{
			id: 18,
			slug: 'md-items',
			title: 'Master Items & Barang (P-145)',
			icon: 'Package',
			layout: 'single',
			group_name: 'Master Data',
			order_num: 8,
			is_home: false,
			components: [
				{
					id: 45,
					name: 'Master Data Item Barang & Material',
					type: 'interactive_grid',
					region: 'main',
					order_num: 1,
					datasource_type: 'table',
					datasource_config: {},
					props: {
						title: 'MD Items Landing (P-145)',
						pageSize: 25,
						editable: true
					},
					actions: []
				}
			]
		},
		{
			id: 19,
			slug: 'to-result',
			title: 'Task Order Result (P-201)',
			icon: 'ClipboardCheck',
			layout: 'single',
			group_name: 'Transaction',
			order_num: 9,
			is_home: false,
			components: [
				{
					id: 46,
					name: 'Input & Verifikasi Hasil Task Order',
					type: 'interactive_grid',
					region: 'main',
					order_num: 1,
					datasource_type: 'table',
					datasource_config: {},
					props: {
						title: 'Task Order Result Landing (P-201)',
						pageSize: 25,
						editable: true
					},
					actions: []
				}
			]
		},
		{
			id: 20,
			slug: 'cost-production',
			title: 'Cost Production Report (P-261)',
			icon: 'BarChart3',
			layout: 'single',
			group_name: 'Report',
			order_num: 10,
			is_home: false,
			components: [
				{
					id: 47,
					name: 'Analisis Biaya Produksi Multi-Dimensi',
					type: 'pivot_matrix',
					region: 'main',
					order_num: 1,
					datasource_type: 'table',
					datasource_config: {},
					props: {
						title: 'Cost Production Interactive Report',
						metric: 'sum',
						col_dim: 'subsidiary',
						row_dim: 'kategori'
					},
					actions: []
				}
			]
		}
	],
	roles: [
		{ name: 'Admin', slug: 'admin', level: 100, description: 'Full administrator access to studio and data' },
		{ name: 'Power User', slug: 'power', level: 50, description: 'Can edit records and execute batch operations' },
		{ name: 'Basic User', slug: 'basic', level: 20, description: 'Can view and submit forms' },
		{ name: 'Public', slug: 'public', level: 0, description: 'Anonymous read-only access' }
	],
	automations: []
};

export const STATIC_PIMS_TABLES: SchemaTable[] = [
	{ schema: 'pims', name: 'users', type: 'BASE TABLE' },
	{ schema: 'pims', name: 'menus', type: 'BASE TABLE' },
	{ schema: 'pims', name: 'roles', type: 'BASE TABLE' },
	{ schema: 'pims', name: 'approval_hierarchy', type: 'BASE TABLE' },
	{ schema: 'bmn', name: 'master_barang', type: 'BASE TABLE' },
	{ schema: 'bmn', name: 'transaksi_mutasi', type: 'BASE TABLE' },
	{ schema: 'bmn', name: 'jadwal_audit', type: 'BASE TABLE' },
	{ schema: 'bmn', name: 'ruangan', type: 'BASE TABLE' }
];
