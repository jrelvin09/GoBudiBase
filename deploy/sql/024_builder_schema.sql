-- ============================================================================
-- GOBUDIBASE ENTERPRISE LOW-CODE PLATFORM METADATA SCHEMA (024_builder_schema.sql)
-- Oracle APEX & Budibase Native Parity Engine in PostgreSQL 17
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS builder;

-- 1. Applications Registry
CREATE TABLE IF NOT EXISTS builder.apps (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(64) DEFAULT 'Layers',
    theme VARCHAR(64) DEFAULT 'dark',
    version VARCHAR(32) DEFAULT '1.0.0',
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Application Pages
CREATE TABLE IF NOT EXISTS builder.pages (
    id SERIAL PRIMARY KEY,
    app_id INT NOT NULL REFERENCES builder.apps(id) ON DELETE CASCADE,
    slug VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    icon VARCHAR(64) DEFAULT 'FileText',
    layout VARCHAR(64) DEFAULT 'single', -- single, split-2, dashboard-4, sidebar-left
    order_num INT DEFAULT 0,
    is_home BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(app_id, slug)
);

-- 3. Page Components (The Reusable APEX / Low-Code Building Blocks)
CREATE TABLE IF NOT EXISTS builder.components (
    id SERIAL PRIMARY KEY,
    page_id INT NOT NULL REFERENCES builder.pages(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(64) NOT NULL, -- interactive_grid, pivot_matrix, dynamic_actions, calendar_timeline, asset_map, tree_view, faceted_search, signature_bast, metric_card
    region VARCHAR(64) DEFAULT 'main', -- main, secondary, sidebar, header
    order_num INT DEFAULT 0,
    datasource_type VARCHAR(32) DEFAULT 'table', -- table, query, rpc
    datasource_config JSONB DEFAULT '{}'::jsonb,
    props JSONB DEFAULT '{}'::jsonb,
    actions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Custom SQL Datasources
CREATE TABLE IF NOT EXISTS builder.datasources (
    id SERIAL PRIMARY KEY,
    app_id INT NOT NULL REFERENCES builder.apps(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    query_sql TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_builder_pages_app_id ON builder.pages(app_id);
CREATE INDEX IF NOT EXISTS idx_builder_components_page_id ON builder.components(page_id);

-- ============================================================================
-- STORED PROCEDURES & INTROSPECTION ENGINES
-- ============================================================================

-- A. Runtime App Compiler: Returns full application tree in a single query (0-latency)
CREATE OR REPLACE FUNCTION builder.get_runtime_app(p_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'app', jsonb_build_object(
            'id', a.id,
            'slug', a.slug,
            'name', a.name,
            'description', a.description,
            'icon', a.icon,
            'theme', a.theme,
            'version', a.version
        ),
        'pages', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', p.id,
                    'slug', p.slug,
                    'title', p.title,
                    'icon', p.icon,
                    'layout', p.layout,
                    'order_num', p.order_num,
                    'is_home', p.is_home,
                    'components', COALESCE((
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'id', c.id,
                                'name', c.name,
                                'type', c.type,
                                'region', c.region,
                                'order_num', c.order_num,
                                'datasource_type', c.datasource_type,
                                'datasource_config', c.datasource_config,
                                'props', c.props,
                                'actions', c.actions
                            ) ORDER BY c.order_num ASC, c.id ASC
                        )
                        FROM builder.components c
                        WHERE c.page_id = p.id
                    ), '[]'::jsonb)
                ) ORDER BY p.order_num ASC, p.id ASC
            )
            FROM builder.pages p
            WHERE p.app_id = a.id
        ), '[]'::jsonb)
    )
    INTO v_result
    FROM builder.apps a
    WHERE a.slug = p_slug;

    RETURN v_result;
END;
$$;

-- B. Database Introspection: List user tables and views
CREATE OR REPLACE FUNCTION builder.get_schema_tables()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(
            jsonb_build_object(
                'schema', table_schema,
                'name', table_name,
                'type', table_type
            ) ORDER BY table_schema, table_name
        )
        FROM information_schema.tables
        WHERE table_schema IN ('app', 'api', 'public', 'builder')
          AND table_name NOT LIKE 'pg_%'
          AND table_name NOT LIKE 'sql_%'
    );
END;
$$;

-- C. Database Introspection: List table columns with datatypes
CREATE OR REPLACE FUNCTION builder.get_table_columns(p_schema TEXT, p_table TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(
            jsonb_build_object(
                'name', column_name,
                'data_type', data_type,
                'is_nullable', is_nullable,
                'default_val', column_default,
                'position', ordinal_position
            ) ORDER BY ordinal_position
        )
        FROM information_schema.columns
        WHERE table_schema = p_schema
          AND table_name = p_table
    );
END;
$$;

-- ============================================================================
-- SEED DATA: APEX ENTERPRISE STARTER TEMPLATE
-- ============================================================================

DO $$
DECLARE
    v_app_id INT;
    v_p_registry INT;
    v_p_pivot INT;
    v_p_sla INT;
    v_p_gis INT;
    v_p_bast INT;
BEGIN
    -- Only seed if builder.apps is empty
    IF NOT EXISTS (SELECT 1 FROM builder.apps WHERE slug = 'bmn-enterprise') THEN
        INSERT INTO builder.apps (slug, name, description, icon, theme, version)
        VALUES (
            'bmn-enterprise',
            'Sistem Pengelolaan Barang Milik Negara (BMN)',
            'Aplikasi Enterprise Terintegrasi Paritas Oracle APEX untuk Tata Kelola Aset & Audit',
            'Layers',
            'dark',
            '2.0.0'
        ) RETURNING id INTO v_app_id;

        -- Page 1: Registry Grid
        INSERT INTO builder.pages (app_id, slug, title, icon, layout, order_num, is_home)
        VALUES (v_app_id, 'registry', 'Data Inventaris Aset', 'TableProperties', 'single', 1, true)
        RETURNING id INTO v_p_registry;

        INSERT INTO builder.components (page_id, name, type, region, order_num, datasource_type, datasource_config, props)
        VALUES (
            v_p_registry,
            'Interactive Grid 100k Aset',
            'interactive_grid',
            'main',
            1,
            'table',
            '{"schema":"app","table":"registry_items"}'::jsonb,
            '{"title":"Master Inventaris Aset BMN","pageSize":50,"editable":true}'::jsonb
        );

        -- Page 2: Analytics & Pivot
        INSERT INTO builder.pages (app_id, slug, title, icon, layout, order_num, is_home)
        VALUES (v_app_id, 'analytics', 'Pivot Matrix & Analitik', 'Grid3X3', 'single', 2, false)
        RETURNING id INTO v_p_pivot;

        INSERT INTO builder.components (page_id, name, type, region, order_num, datasource_type, datasource_config, props)
        VALUES (
            v_p_pivot,
            'Dynamic Cross-tab Matrix',
            'pivot_matrix',
            'main',
            1,
            'rpc',
            '{"endpoint":"/pivot"}'::jsonb,
            '{"row_dim":"category","col_dim":"status","metric":"sum_value"}'::jsonb
        );

        -- Page 3: SLA & Maintenance
        INSERT INTO builder.pages (app_id, slug, title, icon, layout, order_num, is_home)
        VALUES (v_app_id, 'sla', 'Kalender & Gantt SLA', 'Calendar', 'single', 3, false)
        RETURNING id INTO v_p_sla;

        INSERT INTO builder.components (page_id, name, type, region, order_num, datasource_type, datasource_config, props)
        VALUES (
            v_p_sla,
            'Jadwal Pemeliharaan & SLA',
            'calendar_timeline',
            'main',
            1,
            'rpc',
            '{"endpoint":"/calendar/events"}'::jsonb,
            '{"defaultMode":"timeline"}'::jsonb
        );

        -- Page 4: GIS & Spasial
        INSERT INTO builder.pages (app_id, slug, title, icon, layout, order_num, is_home)
        VALUES (v_app_id, 'gis', 'Peta GIS & Pohon Lokasi', 'MapPin', 'split-2', 4, false)
        RETURNING id INTO v_p_gis;

        INSERT INTO builder.components (page_id, name, type, region, order_num, datasource_type, datasource_config, props)
        VALUES (
            v_p_gis,
            'Peta Spasial Kampus',
            'asset_map',
            'main',
            1,
            'rpc',
            '{"endpoint":"/spatial/map"}'::jsonb,
            '{}'::jsonb
        ), (
            v_p_gis,
            'Hierarki Lokasi Gedung',
            'tree_view',
            'secondary',
            2,
            'rpc',
            '{"endpoint":"/spatial/tree"}'::jsonb,
            '{}'::jsonb
        );

        -- Page 5: Digital BAST & TTD
        INSERT INTO builder.pages (app_id, slug, title, icon, layout, order_num, is_home)
        VALUES (v_app_id, 'bast', 'Pengesahan Digital BAST', 'FileSignature', 'single', 5, false)
        RETURNING id INTO v_p_bast;

        INSERT INTO builder.components (page_id, name, type, region, order_num, datasource_type, datasource_config, props)
        VALUES (
            v_p_bast,
            'Form BAST & Signature Pad',
            'signature_bast',
            'main',
            1,
            'custom',
            '{}'::jsonb,
            '{"title":"Berita Acara Serah Terima Aset Digital"}'::jsonb
        );
    END IF;
END $$;
