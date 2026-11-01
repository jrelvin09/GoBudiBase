BEGIN;

INSERT INTO builder.pages (app_id, slug, title, icon, layout, group_name, min_role, order_num, is_home)
VALUES (2, 'login', 'Login Harvest Cloud (P-9999)', 'KeyRound', 'single', 'Autentikasi & Akses', 'public', 0, false)
ON CONFLICT (app_id, slug) DO UPDATE
SET title = EXCLUDED.title, group_name = EXCLUDED.group_name, icon = EXCLUDED.icon;

DO $$
DECLARE
    v_page_id INT;
BEGIN
    SELECT id INTO v_page_id FROM builder.pages WHERE app_id = 2 AND slug = 'login';
    DELETE FROM builder.components WHERE page_id = v_page_id;

    INSERT INTO builder.components (page_id, name, type, region, order_num, datasource_type, props)
    VALUES (
        v_page_id,
        'Form Autentikasi Pengguna (Page 9999)',
        'form',
        'main',
        1,
        'none',
        '{"title": "Plantation Integrated Management System (PIMS)", "subtitle": "Oracle APEX Redwood Login", "fields": [{"name": "username", "label": "Username / NIK", "type": "text", "placeholder": "IT000002", "required": true}, {"name": "password", "label": "Password", "type": "password", "placeholder": "••••••••••••", "required": true}, {"name": "remember_me", "label": "Ingat Username di Perangkat Ini", "type": "checkbox", "default": true}]}'::jsonb
    );

    INSERT INTO builder.components (page_id, name, type, region, order_num, datasource_type, props, actions)
    VALUES (
        v_page_id,
        'Tombol Masuk / Sign In',
        'button',
        'main',
        2,
        'none',
        '{"title": "Sign In", "variant": "primary", "color": "#026cb6"}'::jsonb,
        '[{"type": "submit", "target": "/api/v1/auth/login"}]'::jsonb
    );
END $$;

COMMIT;
