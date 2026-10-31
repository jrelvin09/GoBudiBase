DO $$
DECLARE
    v_app_id INT;
    v_p_kanban INT;
    v_p_alloc INT;
BEGIN
    SELECT id INTO v_app_id FROM builder.apps WHERE slug = 'bmn-enterprise';
    IF v_app_id IS NOT NULL THEN
        -- Insert Kanban Page if not exists
        IF NOT EXISTS (SELECT 1 FROM builder.pages WHERE app_id = v_app_id AND slug = 'kanban') THEN
            INSERT INTO builder.pages (app_id, slug, title, icon, layout, order_num, is_home)
            VALUES (v_app_id, 'kanban', 'Status Kanban Workflow', 'Layers', 'single', 6, false)
            RETURNING id INTO v_p_kanban;

            INSERT INTO builder.components (page_id, name, type, region, order_num, datasource_type, datasource_config, props)
            VALUES (v_p_kanban, 'Workflow Status Pemeliharaan', 'kanban_board', 'main', 1, 'table', '{"table":"app.bmn_items"}'::jsonb, '{"title":"Kanban Board"}'::jsonb);
        END IF;

        -- Insert Shuttle & LOV Page if not exists
        IF NOT EXISTS (SELECT 1 FROM builder.pages WHERE app_id = v_app_id AND slug = 'allocation') THEN
            INSERT INTO builder.pages (app_id, slug, title, icon, layout, order_num, is_home)
            VALUES (v_app_id, 'allocation', 'Shuttle & Popup LOV', 'ArrowLeftRight', 'split-2', 7, false)
            RETURNING id INTO v_p_alloc;

            INSERT INTO builder.components (page_id, name, type, region, order_num, datasource_type, datasource_config, props)
            VALUES 
            (v_p_alloc, 'Alokasi Shuttle Dual-Listbox', 'shuttle_selector', 'main', 1, 'table', '{"table":"app.bmn_items"}'::jsonb, '{"title":"Shuttle"}'::jsonb),
            (v_p_alloc, 'Pencarian Popup LOV', 'popup_lov', 'secondary', 2, 'table', '{"table":"app.bmn_items"}'::jsonb, '{"title":"Popup LOV"}'::jsonb);
        END IF;
    END IF;
END $$;
