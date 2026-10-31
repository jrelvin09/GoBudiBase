package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

// ============================================================================
// 1. RUNTIME APP COMPILER
// ============================================================================

type RuntimeAppReq struct {
	Slug string `json:"slug"`
}

func HandleGetRuntimeApp(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		slug := r.URL.Query().Get("slug")
		if slug == "" {
			var req RuntimeAppReq
			_ = json.NewDecoder(r.Body).Decode(&req)
			slug = req.Slug
		}
		if slug == "" {
			slug = "bmn-enterprise"
		}

		var result json.RawMessage
		query := `SELECT builder.get_runtime_app($1)`
		err := pool.QueryRow(r.Context(), query, slug).Scan(&result)
		if err != nil {
			http.Error(w, fmt.Sprintf(`{"error":"%s"}`, err.Error()), http.StatusInternalServerError)
			return
		}
		if len(result) == 0 || string(result) == "null" {
			http.Error(w, `{"error":"Aplikasi tidak ditemukan"}`, http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(result)
	}
}

// ============================================================================
// 2. APPS MANAGEMENT
// ============================================================================

func HandleListBuilderApps(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		query := `
			SELECT jsonb_agg(
				jsonb_build_object(
					'id', a.id,
					'slug', a.slug,
					'name', a.name,
					'description', a.description,
					'icon', a.icon,
					'theme', a.theme,
					'version', a.version,
					'is_published', a.is_published,
					'page_count', (SELECT COUNT(*) FROM builder.pages p WHERE p.app_id = a.id),
					'created_at', a.created_at,
					'updated_at', a.updated_at
				) ORDER BY a.id ASC
			)
			FROM builder.apps a
		`
		var result json.RawMessage
		err := pool.QueryRow(r.Context(), query).Scan(&result)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if len(result) == 0 || string(result) == "null" {
			result = json.RawMessage("[]")
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(result)
	}
}

type CreateAppReq struct {
	Slug        string `json:"slug"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Theme       string `json:"theme"`
}

func HandleCreateBuilderApp(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req CreateAppReq
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if req.Slug == "" || req.Name == "" {
			http.Error(w, `{"error":"slug dan name wajib diisi"}`, http.StatusBadRequest)
			return
		}
		if req.Icon == "" {
			req.Icon = "Layers"
		}
		if req.Theme == "" {
			req.Theme = "dark"
		}

		tx, err := pool.Begin(r.Context())
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer tx.Rollback(r.Context())

		var appId int
		err = tx.QueryRow(r.Context(), `
			INSERT INTO builder.apps (slug, name, description, icon, theme)
			VALUES ($1, $2, $3, $4, $5)
			RETURNING id
		`, req.Slug, req.Name, req.Description, req.Icon, req.Theme).Scan(&appId)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Create default Home page
		_, err = tx.Exec(r.Context(), `
			INSERT INTO builder.pages (app_id, slug, title, icon, is_home, order_num)
			VALUES ($1, 'home', 'Beranda', 'Home', true, 1)
		`, appId)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		_ = tx.Commit(r.Context())

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]interface{}{"status": "ok", "app_id": appId, "slug": req.Slug})
	}
}

// ============================================================================
// 3. PAGES MANAGEMENT
// ============================================================================

type CreatePageReq struct {
	AppID      int     `json:"app_id"`
	Slug       string  `json:"slug"`
	Title      string  `json:"title"`
	Icon       string  `json:"icon"`
	Layout     string  `json:"layout"`
	GroupName  string  `json:"group_name"`
	ParentSlug *string `json:"parent_slug"`
	MinRole    string  `json:"min_role"`
}

func HandleCreateBuilderPage(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req CreatePageReq
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if req.Icon == "" {
			req.Icon = "FileText"
		}
		if req.Layout == "" {
			req.Layout = "single"
		}
		if req.GroupName == "" {
			req.GroupName = "Menu Utama"
		}
		if req.MinRole == "" {
			req.MinRole = "public"
		}

		var pageId int
		query := `
			INSERT INTO builder.pages (app_id, slug, title, icon, layout, group_name, parent_slug, min_role, order_num)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, (SELECT COALESCE(MAX(order_num), 0) + 1 FROM builder.pages WHERE app_id = $1))
			RETURNING id
		`
		err := pool.QueryRow(r.Context(), query, req.AppID, req.Slug, req.Title, req.Icon, req.Layout, req.GroupName, req.ParentSlug, req.MinRole).Scan(&pageId)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"status": "ok", "page_id": pageId})
	}
}

type DeletePageReq struct {
	PageID int `json:"page_id"`
}

func HandleDeleteBuilderPage(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req DeletePageReq
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		_, err := pool.Exec(r.Context(), `DELETE FROM builder.pages WHERE id = $1`, req.PageID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})
	}
}

type UpdatePageReq struct {
	PageID     int     `json:"page_id"`
	Title      string  `json:"title"`
	Slug       string  `json:"slug"`
	Icon       string  `json:"icon"`
	Layout     string  `json:"layout"`
	GroupName  string  `json:"group_name"`
	ParentSlug *string `json:"parent_slug"`
	MinRole    string  `json:"min_role"`
}

func HandleUpdateBuilderPage(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req UpdatePageReq
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if req.Layout == "" {
			req.Layout = "single"
		}
		if req.Icon == "" {
			req.Icon = "FileText"
		}
		if req.GroupName == "" {
			req.GroupName = "Menu Utama"
		}
		if req.MinRole == "" {
			req.MinRole = "public"
		}

		query := `
			UPDATE builder.pages
			SET title = $2, slug = $3, icon = $4, layout = $5, group_name = $6, parent_slug = $7, min_role = $8
			WHERE id = $1
		`
		_, err := pool.Exec(r.Context(), query, req.PageID, req.Title, req.Slug, req.Icon, req.Layout, req.GroupName, req.ParentSlug, req.MinRole)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "updated"})
	}
}

// ============================================================================
// 4. COMPONENTS MANAGEMENT
// ============================================================================

type CreateComponentReq struct {
	PageID           int             `json:"page_id"`
	Name             string          `json:"name"`
	Type             string          `json:"type"`
	Region           string          `json:"region"`
	DatasourceType   string          `json:"datasource_type"`
	DatasourceConfig json.RawMessage `json:"datasource_config"`
	Props            json.RawMessage `json:"props"`
	Actions          json.RawMessage `json:"actions"`
}

func HandleCreateBuilderComponent(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req CreateComponentReq
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if req.Region == "" {
			req.Region = "main"
		}
		if req.DatasourceType == "" {
			req.DatasourceType = "table"
		}
		if req.DatasourceConfig == nil {
			req.DatasourceConfig = json.RawMessage("{}")
		}
		if req.Props == nil {
			req.Props = json.RawMessage("{}")
		}
		if req.Actions == nil {
			req.Actions = json.RawMessage("[]")
		}

		var compId int
		query := `
			INSERT INTO builder.components (page_id, name, type, region, datasource_type, datasource_config, props, actions, order_num)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, (SELECT COALESCE(MAX(order_num), 0) + 1 FROM builder.components WHERE page_id = $1))
			RETURNING id
		`
		err := pool.QueryRow(r.Context(), query, req.PageID, req.Name, req.Type, req.Region, req.DatasourceType, req.DatasourceConfig, req.Props, req.Actions).Scan(&compId)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"status": "ok", "component_id": compId})
	}
}

type UpdateComponentReq struct {
	ComponentID      int             `json:"component_id"`
	Name             string          `json:"name"`
	Region           string          `json:"region"`
	DatasourceType   string          `json:"datasource_type"`
	DatasourceConfig json.RawMessage `json:"datasource_config"`
	Props            json.RawMessage `json:"props"`
	Actions          json.RawMessage `json:"actions"`
}

func HandleUpdateBuilderComponent(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req UpdateComponentReq
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if req.DatasourceConfig == nil {
			req.DatasourceConfig = json.RawMessage("{}")
		}
		if req.Props == nil {
			req.Props = json.RawMessage("{}")
		}
		if req.Actions == nil {
			req.Actions = json.RawMessage("[]")
		}

		query := `
			UPDATE builder.components
			SET name = $2, region = $3, datasource_type = $4, datasource_config = $5, props = $6, actions = $7
			WHERE id = $1
		`
		_, err := pool.Exec(r.Context(), query, req.ComponentID, req.Name, req.Region, req.DatasourceType, req.DatasourceConfig, req.Props, req.Actions)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "updated"})
	}
}

type DeleteComponentReq struct {
	ComponentID int `json:"component_id"`
}

func HandleDeleteBuilderComponent(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req DeleteComponentReq
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		_, err := pool.Exec(r.Context(), `DELETE FROM builder.components WHERE id = $1`, req.ComponentID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})
	}
}

// ============================================================================
// 5. DATABASE INTROSPECTION & SAFE QUERY RUNNER
// ============================================================================

func HandleGetSchemaTables(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var result json.RawMessage
		query := `SELECT builder.get_schema_tables()`
		err := pool.QueryRow(r.Context(), query).Scan(&result)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if len(result) == 0 || string(result) == "null" {
			result = json.RawMessage("[]")
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(result)
	}
}

type TableColumnsReq struct {
	Schema string `json:"schema"`
	Table  string `json:"table"`
}

func HandleGetTableColumns(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		schema := r.URL.Query().Get("schema")
		table := r.URL.Query().Get("table")
		if schema == "" || table == "" {
			var req TableColumnsReq
			_ = json.NewDecoder(r.Body).Decode(&req)
			schema = req.Schema
			table = req.Table
		}

		var result json.RawMessage
		query := `SELECT builder.get_table_columns($1, $2)`
		err := pool.QueryRow(r.Context(), query, schema, table).Scan(&result)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if len(result) == 0 || string(result) == "null" {
			result = json.RawMessage("[]")
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(result)
	}
}

type ExecuteQueryReq struct {
	SQL   string `json:"sql"`
	Limit int    `json:"limit"`
}

func HandleExecuteBuilderQuery(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req ExecuteQueryReq
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		cleanSQL := strings.TrimSpace(req.SQL)
		if !strings.HasPrefix(strings.ToUpper(cleanSQL), "SELECT") {
			http.Error(w, `{"error":"Hanya query SELECT yang diperbolehkan di SQL Studio"}`, http.StatusForbidden)
			return
		}

		if req.Limit <= 0 {
			req.Limit = 100
		}
		if !strings.Contains(strings.ToUpper(cleanSQL), "LIMIT") {
			cleanSQL = fmt.Sprintf("%s LIMIT %d", cleanSQL, req.Limit)
		}

		rows, err := pool.Query(r.Context(), cleanSQL)
		if err != nil {
			http.Error(w, fmt.Sprintf(`{"error":"%s"}`, err.Error()), http.StatusBadRequest)
			return
		}
		defer rows.Close()

		fieldDescs := rows.FieldDescriptions()
		colNames := make([]string, len(fieldDescs))
		for i, fd := range fieldDescs {
			colNames[i] = string(fd.Name)
		}

		var records []map[string]interface{}
		for rows.Next() {
			vals, err := rows.Values()
			if err != nil {
				continue
			}
			rowMap := make(map[string]interface{})
			for i, col := range colNames {
				rowMap[col] = vals[i]
			}
			records = append(records, rowMap)
		}

		if records == nil {
			records = []map[string]interface{}{}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"columns": colNames,
			"rows":    records,
			"total":   len(records),
		})
	}
}

// ============================================================================
// 7. ATOMIC BATCH WRITE ENGINE (Interactive Grid / APEX Batch Operations)
// ============================================================================

type BatchOperation struct {
	Op              string                 `json:"op"`
	TmpID           string                 `json:"tmp_id,omitempty"`
	ID              any                    `json:"id,omitempty"`
	ExpectedVersion int64                  `json:"expected_version,omitempty"`
	Values          map[string]interface{} `json:"values,omitempty"`
}

type BatchRequest struct {
	Table string           `json:"table"`
	Ops   []BatchOperation `json:"ops"`
}

type BatchOpResult struct {
	Index  int                    `json:"index"`
	TmpID  string                 `json:"tmp_id,omitempty"`
	ID     any                    `json:"id,omitempty"`
	Record map[string]interface{} `json:"record,omitempty"`
}

func HandleBatchOperations(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req BatchRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, fmt.Sprintf(`{"error":"Invalid request payload: %s"}`, err.Error()), http.StatusBadRequest)
			return
		}

		table := strings.TrimSpace(req.Table)
		if table == "" {
			table = "app.bmn_items"
		}
		for _, ch := range table {
			if !((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9') || ch == '_' || ch == '.') {
				http.Error(w, `{"error":"Invalid table identifier"}`, http.StatusBadRequest)
				return
			}
		}

		ctx := r.Context()
		tx, err := pool.Begin(ctx)
		if err != nil {
			http.Error(w, fmt.Sprintf(`{"error":"Transaction begin failed: %s"}`, err.Error()), http.StatusInternalServerError)
			return
		}
		defer tx.Rollback(ctx)

		results := make([]BatchOpResult, 0, len(req.Ops))
		for idx, op := range req.Ops {
			switch strings.ToLower(op.Op) {
			case "create":
				cols := make([]string, 0, len(op.Values))
				placeholders := make([]string, 0, len(op.Values))
				args := make([]interface{}, 0, len(op.Values))
				argNum := 1
				for k, v := range op.Values {
					cols = append(cols, k)
					placeholders = append(placeholders, fmt.Sprintf("$%d", argNum))
					args = append(args, v)
					argNum++
				}
				if len(cols) == 0 {
					continue
				}
				insertSQL := fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s) RETURNING id", table, strings.Join(cols, ", "), strings.Join(placeholders, ", "))
				var newID any
				if err := tx.QueryRow(ctx, insertSQL, args...).Scan(&newID); err != nil {
					http.Error(w, fmt.Sprintf(`{"error":"Create failed at index %d: %s"}`, idx, err.Error()), http.StatusUnprocessableEntity)
					return
				}
				results = append(results, BatchOpResult{
					Index:  idx,
					TmpID:  op.TmpID,
					ID:     newID,
					Record: op.Values,
				})

			case "update":
				if op.ID == nil {
					http.Error(w, fmt.Sprintf(`{"error":"Update requires id at index %d"}`, idx), http.StatusUnprocessableEntity)
					return
				}
				setClauses := make([]string, 0, len(op.Values))
				args := make([]interface{}, 0, len(op.Values)+1)
				argNum := 1
				for k, v := range op.Values {
					if k == "id" {
						continue
					}
					setClauses = append(setClauses, fmt.Sprintf("%s = $%d", k, argNum))
					args = append(args, v)
					argNum++
				}
				if len(setClauses) == 0 {
					continue
				}
				args = append(args, op.ID)
				updateSQL := fmt.Sprintf("UPDATE %s SET %s WHERE id = $%d", table, strings.Join(setClauses, ", "), argNum)
				if _, err := tx.Exec(ctx, updateSQL, args...); err != nil {
					http.Error(w, fmt.Sprintf(`{"error":"Update failed at index %d: %s"}`, idx, err.Error()), http.StatusUnprocessableEntity)
					return
				}
				results = append(results, BatchOpResult{
					Index:  idx,
					ID:     op.ID,
					Record: op.Values,
				})

			case "delete":
				if op.ID == nil {
					http.Error(w, fmt.Sprintf(`{"error":"Delete requires id at index %d"}`, idx), http.StatusUnprocessableEntity)
					return
				}
				deleteSQL := fmt.Sprintf("DELETE FROM %s WHERE id = $1", table)
				if _, err := tx.Exec(ctx, deleteSQL, op.ID); err != nil {
					http.Error(w, fmt.Sprintf(`{"error":"Delete failed at index %d: %s"}`, idx, err.Error()), http.StatusUnprocessableEntity)
					return
				}
				results = append(results, BatchOpResult{
					Index: idx,
					ID:    op.ID,
				})
			}
		}

		if err := tx.Commit(ctx); err != nil {
			http.Error(w, fmt.Sprintf(`{"error":"Commit failed: %s"}`, err.Error()), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":  "ok",
			"results": results,
		})
	}
}
