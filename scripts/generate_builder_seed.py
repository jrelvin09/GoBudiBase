import json

def esc(s):
    if s is None:
        return 'NULL'
    return "'" + str(s).replace("'", "''") + "'"

with open('/tmp/user_informations.json', 'r', encoding='utf-8') as f:
    users = json.load(f)

with open('/tmp/user_menus.json', 'r', encoding='utf-8') as f:
    menus = json.load(f)

with open('/tmp/roles.json', 'r', encoding='utf-8') as f:
    roles_data = json.load(f)

with open('/tmp/approval_hier.json', 'r', encoding='utf-8') as f:
    hierarchies = json.load(f)

sql = []
sql.append("-- ============================================================================")
sql.append("-- SEED GOPIMSBASE LOW-CODE APPLICATION INTO GOBUDIBASE BUILDER (App 103)")
sql.append("-- ============================================================================")
sql.append("BEGIN;")
sql.append("CREATE SCHEMA IF NOT EXISTS pims;")
sql.append("GRANT ALL ON SCHEMA pims TO postgres, public;")

# 1. PIMS Tables
sql.append("""
DROP TABLE IF EXISTS pims.users CASCADE;
CREATE TABLE pims.users (
    id SERIAL PRIMARY KEY,
    nik VARCHAR(64) UNIQUE,
    nama VARCHAR(255) NOT NULL,
    manager VARCHAR(255),
    subsidiary VARCHAR(255),
    role VARCHAR(100),
    aktif VARCHAR(10) DEFAULT 'Ya',
    dibuat_oleh VARCHAR(100),
    tgl_dibuat VARCHAR(100),
    diubah_oleh VARCHAR(100),
    tgl_diubah VARCHAR(100)
);

DROP TABLE IF EXISTS pims.menus CASCADE;
CREATE TABLE pims.menus (
    id SERIAL PRIMARY KEY,
    row_no INT,
    parent_menu VARCHAR(128),
    nama_menu VARCHAR(255) NOT NULL,
    menu_link VARCHAR(255),
    aktif VARCHAR(10) DEFAULT 'Ya',
    dibuat_oleh VARCHAR(100),
    tgl_dibuat VARCHAR(100),
    diubah_oleh VARCHAR(100),
    tgl_diubah VARCHAR(100)
);

DROP TABLE IF EXISTS pims.roles CASCADE;
CREATE TABLE pims.roles (
    id SERIAL PRIMARY KEY,
    role_id VARCHAR(64),
    role_name VARCHAR(128) NOT NULL,
    role_status VARCHAR(10) DEFAULT 'A',
    descr TEXT
);

DROP TABLE IF EXISTS pims.approval_hierarchy CASCADE;
CREATE TABLE pims.approval_hierarchy (
    id SERIAL PRIMARY KEY,
    module VARCHAR(128) NOT NULL,
    subsidiary VARCHAR(255) NOT NULL,
    type_name VARCHAR(64) NOT NULL,
    site VARCHAR(128),
    afdeling VARCHAR(128),
    approver_level VARCHAR(10) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    is_active VARCHAR(10) DEFAULT 'Y'
);
""")

# 2. Insert Users
sql.append("-- Insert Users Data")
for u in users:
    sql.append(f"""INSERT INTO pims.users (nik, nama, manager, subsidiary, role, aktif, dibuat_oleh, tgl_dibuat, diubah_oleh, tgl_diubah)
VALUES ({esc(u.get('nik'))}, {esc(u.get('nama'))}, {esc(u.get('manager'))}, {esc(u.get('subsidiary'))}, {esc(u.get('role'))}, {esc(u.get('aktif'))}, {esc(u.get('dibuatOleh'))}, {esc(u.get('tglDibuat'))}, {esc(u.get('diubahOleh'))}, {esc(u.get('tglDiubah'))})
ON CONFLICT (nik) DO NOTHING;""")

# 3. Insert Menus
sql.append("-- Insert Menus Data")
for m in menus:
    sql.append(f"""INSERT INTO pims.menus (row_no, parent_menu, nama_menu, menu_link, aktif, dibuat_oleh, tgl_dibuat, diubah_oleh, tgl_diubah)
VALUES ({m.get('rowNo') or 'NULL'}, {esc(m.get('parentMenu'))}, {esc(m.get('namaMenu'))}, {esc(m.get('menuLink'))}, {esc(m.get('aktif'))}, {esc(m.get('dibuatOleh'))}, {esc(m.get('tglDibuat'))}, {esc(m.get('diubahOleh'))}, {esc(m.get('tglDiubah'))});""")

# 4. Insert Roles
sql.append("-- Insert Roles Data")
hcm_roles = roles_data.get('hcmRoles', [])
for r in hcm_roles:
    sql.append(f"""INSERT INTO pims.roles (role_id, role_name, role_status, descr)
VALUES ({esc(r.get('roleId'))}, {esc(r.get('roleName'))}, {esc(r.get('roleStatus'))}, {esc(r.get('descr'))});""")

# 5. Insert Approval Hierarchies
sql.append("-- Insert Approval Hierarchies Data")
for h in hierarchies:
    sql.append(f"""INSERT INTO pims.approval_hierarchy (module, subsidiary, type_name, site, afdeling, approver_level, user_name, is_active)
VALUES ({esc(h.get('module'))}, {esc(h.get('subsidiary'))}, {esc(h.get('typeName'))}, {esc(h.get('site'))}, {esc(h.get('afdeling'))}, {esc(h.get('approverLevel'))}, {esc(h.get('userName'))}, {esc(h.get('isActive'))});""")

# 6. Builder App Registration
sql.append("""
-- Register GoPimsBase Application in builder.apps
DELETE FROM builder.apps WHERE slug = 'gopimsbase';

INSERT INTO builder.apps (slug, name, description, icon, theme, version, is_published, nav_type)
VALUES (
    'gopimsbase',
    'Harvest Cloud - PIMS (GoPimsBase)',
    'Kloning UI, data riil, dan fungsi bisnis dari Oracle APEX Harvest Cloud PIMS (App 103) di GoBudiBase Engine',
    'Trees',
    'light',
    '1.0.0',
    true,
    'side'
);
""")

# Helper function to insert a page and its components
def insert_page_and_components(slug, title, group_name, icon, layout, order_num, is_home, components):
    page_sql = f"""
    INSERT INTO builder.pages (app_id, slug, title, icon, layout, order_num, is_home, group_name)
    VALUES (
        (SELECT id FROM builder.apps WHERE slug = 'gopimsbase'),
        {esc(slug)}, {esc(title)}, {esc(icon)}, {esc(layout)}, {order_num}, {str(is_home).lower()}, {esc(group_name)}
    );
    """
    sql.append(page_sql)

    for idx, c in enumerate(components, 1):
        comp_sql = f"""
        INSERT INTO builder.components (page_id, name, type, region, order_num, datasource_type, datasource_config, props, actions)
        VALUES (
            (SELECT p.id FROM builder.pages p JOIN builder.apps a ON a.id = p.app_id WHERE a.slug = 'gopimsbase' AND p.slug = {esc(slug)}),
            {esc(c['name'])},
            {esc(c['type'])},
            {esc(c.get('region', 'main'))},
            {idx},
            {esc(c.get('datasource_type', 'table'))},
            {esc(json.dumps(c.get('datasource_config', {})))}::jsonb,
            {esc(json.dumps(c.get('props', {})))}::jsonb,
            {esc(json.dumps(c.get('actions', [])))}::jsonb
        );
        """
        sql.append(comp_sql)

# 7. Pages & Components Definition

# Page 1: Dashboard
insert_page_and_components(
    slug='dashboard',
    title='Dashboard PIMS',
    group_name='Dashboard',
    icon='Home',
    layout='dashboard-4',
    order_num=1,
    is_home=True,
    components=[
        {
            'name': 'Total Pengguna Aktif',
            'type': 'metric_card',
            'region': 'main',
            'props': {'title': 'Total Pengguna Aktif', 'value': '761', 'subtitle': 'Akun terdaftar di database', 'icon': 'Users', 'color': 'blue'}
        },
        {
            'name': 'Menu Sistem Navigasi',
            'type': 'metric_card',
            'region': 'main',
            'props': {'title': 'Menu Sistem Navigasi', 'value': '269', 'subtitle': 'Menu APEX terintegrasi', 'icon': 'FolderTree', 'color': 'emerald'}
        },
        {
            'name': 'Aturan Persetujuan',
            'type': 'metric_card',
            'region': 'main',
            'props': {'title': 'Aturan Persetujuan', 'value': '48', 'subtitle': 'Routing hierarchy aktif', 'icon': 'GitCommit', 'color': 'amber'}
        },
        {
            'name': 'Subsidiary Perkebunan',
            'type': 'metric_card',
            'region': 'main',
            'props': {'title': 'Subsidiary Perkebunan', 'value': '4', 'subtitle': 'KYA, SWA, CPEA, TMM', 'icon': 'Building2', 'color': 'purple'}
        },
        {
            'name': 'Distribusi Pengguna per Subsidiary',
            'type': 'chart',
            'region': 'main',
            'datasource_type': 'table',
            'datasource_config': {'table': 'pims.users'},
            'props': {'title': 'Distribusi Pengguna per Subsidiary', 'chartType': 'bar', 'xField': 'subsidiary', 'yField': 'count'}
        },
        {
            'name': 'Aktivitas Pengguna & Audit Terbaru',
            'type': 'interactive_grid',
            'region': 'main',
            'datasource_type': 'table',
            'datasource_config': {'table': 'pims.users'},
            'props': {'title': 'Aktivitas Pengguna Terbaru', 'pageSize': 10, 'editable': False, 'columns': ['nik', 'nama', 'role', 'subsidiary', 'aktif', 'tgl_diubah']}
        }
    ]
)

# Page 2: SETUP Informasi User (Page 160)
insert_page_and_components(
    slug='setup-user-informations',
    title='SETUP Informasi User (P-160)',
    group_name='Konfigurasi Setup',
    icon='Users',
    layout='single',
    order_num=1,
    is_home=False,
    components=[
        {
            'name': 'Interactive Grid Informasi User (Page 160)',
            'type': 'interactive_grid',
            'region': 'main',
            'datasource_type': 'table',
            'datasource_config': {'table': 'pims.users', 'schema': 'pims'},
            'props': {
                'title': 'SETUP Informasi User',
                'pageSize': 25,
                'editable': True,
                'showSearch': True,
                'showExport': True,
                'columns': ['nik', 'nama', 'manager', 'subsidiary', 'role', 'aktif', 'dibuat_oleh', 'tgl_dibuat', 'diubah_oleh', 'tgl_diubah']
            }
        },
        {
            'name': 'Detail Akun Pengguna (Page 432)',
            'type': 'form',
            'region': 'main',
            'datasource_type': 'table',
            'datasource_config': {'table': 'pims.users', 'schema': 'pims'},
            'props': {
                'title': 'SETUP Informasi User - Ubah Data',
                'fields': [
                    {'name': 'nik', 'label': 'Username / NIK', 'type': 'text', 'readOnly': True},
                    {'name': 'nama', 'label': 'Nama Lengkap', 'type': 'text'},
                    {'name': 'subsidiary', 'label': 'Subsidiary (Multi-select)', 'type': 'select'},
                    {'name': 'role', 'label': 'Role / Hak Akses', 'type': 'select'},
                    {'name': 'aktif', 'label': 'Data Aktif', 'type': 'checkbox'}
                ]
            }
        }
    ]
)

# Page 3: SETUP Menu User (Page 161)
insert_page_and_components(
    slug='setup-user-menus',
    title='SETUP Menu User (P-161)',
    group_name='Konfigurasi Setup',
    icon='FolderTree',
    layout='single',
    order_num=2,
    is_home=False,
    components=[
        {
            'name': 'Interactive Grid Menu User (Page 161)',
            'type': 'interactive_grid',
            'region': 'main',
            'datasource_type': 'table',
            'datasource_config': {'table': 'pims.menus', 'schema': 'pims'},
            'props': {
                'title': 'SETUP Menu User',
                'pageSize': 25,
                'editable': True,
                'showSearch': True,
                'columns': ['row_no', 'parent_menu', 'nama_menu', 'menu_link', 'aktif', 'dibuat_oleh', 'tgl_dibuat']
            }
        },
        {
            'name': 'Form Buat / Ubah Menu User (Page 453)',
            'type': 'form',
            'region': 'main',
            'datasource_type': 'table',
            'datasource_config': {'table': 'pims.menus', 'schema': 'pims'},
            'props': {
                'title': 'SETUP Menu User - Create',
                'fields': [
                    {'name': 'parent_menu', 'label': 'Menu Utama (Parent LOV)', 'type': 'select'},
                    {'name': 'nama_menu', 'label': 'Nama Menu', 'type': 'text'},
                    {'name': 'menu_link', 'label': 'Halaman Menu (Target Link)', 'type': 'text'},
                    {'name': 'aktif', 'label': 'Data Aktif', 'type': 'checkbox'}
                ]
            }
        }
    ]
)

# Page 4: SETUP Akses Halaman (Page 162)
insert_page_and_components(
    slug='role-management',
    title='SETUP Akses Halaman (P-162)',
    group_name='Konfigurasi Setup',
    icon='Shield',
    layout='single',
    order_num=3,
    is_home=False,
    components=[
        {
            'name': 'Daftar Role Sistem HCM (Page 162)',
            'type': 'interactive_grid',
            'region': 'main',
            'datasource_type': 'table',
            'datasource_config': {'table': 'pims.roles', 'schema': 'pims'},
            'props': {
                'title': 'ROLE MANAGEMENT',
                'pageSize': 20,
                'columns': ['role_id', 'role_name', 'role_status', 'descr']
            }
        },
        {
            'name': 'Matrix Hak Akses Modul per Role',
            'type': 'pivot_matrix',
            'region': 'main',
            'datasource_type': 'table',
            'datasource_config': {'table': 'pims.roles', 'schema': 'pims'},
            'props': {
                'title': 'Matriks Hak Akses Halaman',
                'metric': 'count',
                'col_dim': 'role_status',
                'row_dim': 'role_name'
            }
        }
    ]
)

# Page 5: SETUP Approval Hierarchy (Page 163)
insert_page_and_components(
    slug='approval-hierarchy',
    title='SETUP Approval Hierarchy (P-163)',
    group_name='Konfigurasi Setup',
    icon='GitCommit',
    layout='single',
    order_num=4,
    is_home=False,
    components=[
        {
            'name': 'Routing Persetujuan Multi-Level (Page 163)',
            'type': 'interactive_grid',
            'region': 'main',
            'datasource_type': 'table',
            'datasource_config': {'table': 'pims.approval_hierarchy', 'schema': 'pims'},
            'props': {
                'title': 'TO Result Approval Hierarchy',
                'pageSize': 25,
                'editable': True,
                'columns': ['module', 'subsidiary', 'type_name', 'site', 'afdeling', 'approver_level', 'user_name', 'is_active']
            }
        },
        {
            'name': 'Alur Jenjang Persetujuan Level 1-4',
            'type': 'kanban_board',
            'region': 'main',
            'datasource_type': 'table',
            'datasource_config': {'table': 'pims.approval_hierarchy', 'schema': 'pims'},
            'props': {
                'title': 'Jenjang Approval Visualizer',
                'columnField': 'approver_level'
            }
        }
    ]
)

# Page 6: Reset Password (Page 164)
insert_page_and_components(
    slug='reset-password',
    title='Reset Password (P-164)',
    group_name='Konfigurasi Setup',
    icon='KeyRound',
    layout='single',
    order_num=5,
    is_home=False,
    components=[
        {
            'name': 'Form Reset Kata Sandi User (Page 164)',
            'type': 'form',
            'region': 'main',
            'props': {
                'title': 'Reset Password User Terpusat',
                'fields': [
                    {'name': 'username', 'label': 'Username / NIK (P164_USERNAME)', 'type': 'select'},
                    {'name': 'new_password', 'label': 'Password Baru', 'type': 'password'},
                    {'name': 'confirm_password', 'label': 'Konfirmasi Password Baru', 'type': 'password'},
                    {'name': 'force_change', 'label': 'Wajib Ubah Kata Sandi saat Login Berikutnya', 'type': 'checkbox'}
                ]
            }
        }
    ]
)

# Page 7: Master Tipe Unit (P-127)
insert_page_and_components(
    slug='md-unit-types',
    title='Master Tipe Unit (P-127)',
    group_name='Master Data',
    icon='Layers',
    layout='single',
    order_num=1,
    is_home=False,
    components=[
        {
            'name': 'Master Data Tipe Unit Kendaraan & Traktor',
            'type': 'interactive_grid',
            'region': 'main',
            'props': {
                'title': 'MD Unit Types Landing (P-127)',
                'pageSize': 25,
                'editable': True
            }
        }
    ]
)

# Page 8: Master Items & Barang (P-145)
insert_page_and_components(
    slug='md-items',
    title='Master Items & Barang (P-145)',
    group_name='Master Data',
    icon='Package',
    layout='single',
    order_num=2,
    is_home=False,
    components=[
        {
            'name': 'Master Data Item Barang & Material',
            'type': 'interactive_grid',
            'region': 'main',
            'props': {
                'title': 'MD Items Landing (P-145)',
                'pageSize': 25,
                'editable': True
            }
        }
    ]
)

# Page 9: Task Order Result (P-201)
insert_page_and_components(
    slug='to-result',
    title='Task Order Result (P-201)',
    group_name='Transaction',
    icon='ClipboardCheck',
    layout='single',
    order_num=1,
    is_home=False,
    components=[
        {
            'name': 'Input & Verifikasi Hasil Task Order',
            'type': 'interactive_grid',
            'region': 'main',
            'props': {
                'title': 'Task Order Result Landing (P-201)',
                'pageSize': 25,
                'editable': True
            }
        }
    ]
)

# Page 10: Cost Production Report (P-261)
insert_page_and_components(
    slug='cost-production',
    title='Cost Production Report (P-261)',
    group_name='Report',
    icon='BarChart3',
    layout='single',
    order_num=1,
    is_home=False,
    components=[
        {
            'name': 'Analisis Biaya Produksi Kebun',
            'type': 'pivot_matrix',
            'region': 'main',
            'props': {
                'title': 'Report Cost Productions (P-261)',
                'metric': 'sum_cost',
                'row_dim': 'afdeling',
                'col_dim': 'period'
            }
        }
    ]
)

sql.append("COMMIT;")

with open('/tmp/seed_gopimsbase.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql))

print(f"Seed SQL generated successfully: {len(sql)} lines written to /tmp/seed_gopimsbase.sql")
