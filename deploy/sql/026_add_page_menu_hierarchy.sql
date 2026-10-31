-- ============================================================================
-- GOBUDIBASE ENTERPRISE NAVIGATION & MENU HIERARCHY MIGRATION (026)
-- Support Side/Top Menus, Sub-menus, and Groups
-- ============================================================================

ALTER TABLE builder.pages ADD COLUMN IF NOT EXISTS group_name VARCHAR(128) DEFAULT 'Menu Utama';
ALTER TABLE builder.pages ADD COLUMN IF NOT EXISTS parent_slug VARCHAR(64) DEFAULT NULL;
ALTER TABLE builder.apps ADD COLUMN IF NOT EXISTS nav_type VARCHAR(32) DEFAULT 'side';

-- Update existing sample pages for bmn-enterprise into organized groups
UPDATE builder.pages SET group_name = 'Operasional & Fisik', order_num = 1 WHERE slug = 'registry';
UPDATE builder.pages SET group_name = 'Operasional & Fisik', order_num = 2 WHERE slug = 'kanban';
UPDATE builder.pages SET group_name = 'Operasional & Fisik', order_num = 3 WHERE slug = 'allocation';
UPDATE builder.pages SET group_name = 'Operasional & Fisik', order_num = 4 WHERE slug = 'bast';

UPDATE builder.pages SET group_name = 'Analitika & Monitoring', order_num = 1 WHERE slug = 'analytics';
UPDATE builder.pages SET group_name = 'Analitika & Monitoring', order_num = 2 WHERE slug = 'sla';
UPDATE builder.pages SET group_name = 'Analitika & Monitoring', order_num = 3 WHERE slug = 'gis';

UPDATE builder.pages SET group_name = 'Kustom & Pengujian', order_num = 1 WHERE slug = 'test';

-- Replace get_runtime_app function with full hierarchy support
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
