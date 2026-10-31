-- ============================================================================
-- 027_add_automations_and_rbac.sql: AUTOMATION ENGINE & RBAC SECURITY
-- ============================================================================

-- 1. Automations Table
CREATE TABLE IF NOT EXISTS builder.automations (
    id SERIAL PRIMARY KEY,
    app_id INT REFERENCES builder.apps(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    description TEXT DEFAULT '',
    trigger_type VARCHAR(64) NOT NULL DEFAULT 'webhook', -- 'webhook', 'cron', 'pg_listen', 'app_action'
    trigger_config JSONB DEFAULT '{}'::jsonb,
    steps JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Automation Run Execution Logs
CREATE TABLE IF NOT EXISTS builder.automation_runs (
    id SERIAL PRIMARY KEY,
    automation_id INT REFERENCES builder.automations(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'success', -- 'success', 'failed'
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    duration_ms INT DEFAULT 0,
    payload JSONB DEFAULT '{}'::jsonb,
    result JSONB DEFAULT '{}'::jsonb
);

-- 3. RBAC Roles
CREATE TABLE IF NOT EXISTS builder.roles (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(64) NOT NULL,
    level INT NOT NULL, -- 100=Admin, 50=Power User, 20=Basic User, 0=Public
    description TEXT DEFAULT ''
);

INSERT INTO builder.roles (slug, name, level, description) VALUES
    ('admin', 'Admin', 100, 'Full administrator access to studio and data'),
    ('power', 'Power User', 50, 'Can edit records and execute batch operations'),
    ('basic', 'Basic User', 20, 'Can view and submit forms'),
    ('public', 'Public', 0, 'Anonymous read-only access')
ON CONFLICT (slug) DO NOTHING;

-- 4. Screen / Page RBAC Permission
ALTER TABLE builder.pages ADD COLUMN IF NOT EXISTS min_role VARCHAR(32) DEFAULT 'public';

-- 5. Seed default sample automation for bmn-enterprise
INSERT INTO builder.automations (app_id, name, description, trigger_type, trigger_config, steps, is_active)
SELECT 
    id,
    'Notifikasi BAST & Aset Baru',
    'Kirim alert webhook ketika BAST ditandatangani atau aset baru ditambahkan',
    'webhook',
    '{"endpoint": "/api/webhooks/bmn-bast"}'::jsonb,
    '[{"type": "toast", "message": "BAST telah disahkan dan diarsipkan ke PDF"}, {"type": "query", "sql": "UPDATE app.bmn_items SET status = ''VERIFIED'' WHERE status = ''PENDING''"}]'::jsonb,
    true
FROM builder.apps WHERE slug = 'bmn-enterprise'
ON CONFLICT DO NOTHING;

-- 6. Drop any VARCHAR overload and replace builder.get_runtime_app(p_slug TEXT)
DROP FUNCTION IF EXISTS builder.get_runtime_app(VARCHAR);

CREATE OR REPLACE FUNCTION builder.get_runtime_app(p_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_app JSONB;
BEGIN
    SELECT jsonb_build_object(
        'app', jsonb_build_object(
            'id', a.id,
            'slug', a.slug,
            'name', a.name,
            'description', a.description,
            'icon', a.icon,
            'theme', a.theme,
            'version', a.version,
            'nav_type', COALESCE(a.nav_type, 'side')
        ),
        'pages', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', p.id,
                    'slug', p.slug,
                    'title', p.title,
                    'icon', p.icon,
                    'layout', p.layout,
                    'group_name', COALESCE(p.group_name, 'Menu Utama'),
                    'parent_slug', p.parent_slug,
                    'min_role', COALESCE(p.min_role, 'public'),
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
                            ) ORDER BY c.order_num ASC
                        )
                        FROM builder.components c
                        WHERE c.page_id = p.id
                    ), '[]'::jsonb)
                ) ORDER BY p.order_num ASC
            )
            FROM builder.pages p
            WHERE p.app_id = a.id
        ), '[]'::jsonb),
        'automations', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', at.id,
                    'name', at.name,
                    'description', at.description,
                    'trigger_type', at.trigger_type,
                    'trigger_config', at.trigger_config,
                    'steps', at.steps,
                    'is_active', at.is_active
                ) ORDER BY at.id ASC
            )
            FROM builder.automations at
            WHERE at.app_id = a.id
        ), '[]'::jsonb),
        'roles', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'slug', r.slug,
                    'name', r.name,
                    'level', r.level,
                    'description', r.description
                ) ORDER BY r.level DESC
            )
            FROM builder.roles r
        ), '[]'::jsonb)
    )
    INTO v_app
    FROM builder.apps a
    WHERE a.slug = p_slug;

    RETURN v_app;
END;
$$;
