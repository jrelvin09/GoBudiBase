-- =========================================================================
-- Migration 030: Add custom_html and custom_css to builder.pages
-- Allows developers to write custom HTML templates and CSS stylesheets
-- to customize markup and styling that cannot be done in Form Designer.
-- =========================================================================

BEGIN;

ALTER TABLE builder.pages ADD COLUMN IF NOT EXISTS custom_html TEXT DEFAULT '';
ALTER TABLE builder.pages ADD COLUMN IF NOT EXISTS custom_css TEXT DEFAULT '';

-- Update get_runtime_app to return custom_html and custom_css
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
                    'group_name', p.group_name,
                    'parent_slug', p.parent_slug,
                    'min_role', p.min_role,
                    'order_num', p.order_num,
                    'is_home', p.is_home,
                    'script_front', COALESCE(p.script_front, ''),
                    'script_back', COALESCE(p.script_back, ''),
                    'custom_html', COALESCE(p.custom_html, ''),
                    'custom_css', COALESCE(p.custom_css, ''),
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
    ) INTO v_result
    FROM builder.apps a
    WHERE a.slug = p_slug;

    RETURN v_result;
END;
$$;

COMMIT;
