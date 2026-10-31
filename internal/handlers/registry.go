package handlers

import (
	"encoding/json"
	"net/http"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ListRegistryReq struct {
	Limit   int             `json:"p_limit"`
	Offset  int             `json:"p_offset"`
	SortCol string          `json:"p_sort_col"`
	SortDir string          `json:"p_sort_dir"`
	Filters json.RawMessage `json:"p_filters"`
}

func HandleListRegistry(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req ListRegistryReq
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if req.Limit <= 0 {
			req.Limit = 50
		}
		if req.SortCol == "" {
			req.SortCol = "id"
		}
		if req.SortDir == "" {
			req.SortDir = "asc"
		}
		if req.Filters == nil {
			req.Filters = json.RawMessage("{}")
		}

		var result json.RawMessage
		query := `SELECT api.list_registry($1, $2, $3, $4, $5)`
		err := pool.QueryRow(r.Context(), query, req.Limit, req.Offset, req.SortCol, req.SortDir, req.Filters).Scan(&result)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(result)
	}
}

type CountRegistryReq struct {
	Filters json.RawMessage `json:"p_filters"`
}

func HandleCountRegistry(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req CountRegistryReq
		_ = json.NewDecoder(r.Body).Decode(&req)
		if req.Filters == nil {
			req.Filters = json.RawMessage("{}")
		}

		var count int64
		query := `SELECT api.count_registry($1)`
		err := pool.QueryRow(r.Context(), query, req.Filters).Scan(&count)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(count)
	}
}

type UpdateCellReq struct {
	ID     int64  `json:"p_id"`
	Column string `json:"p_column"`
	Value  string `json:"p_value"`
	Actor  string `json:"p_actor"`
}

func HandleUpdateCell(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req UpdateCellReq
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if req.Actor == "" {
			req.Actor = "system"
		}

		query := `SELECT api.update_registry_cell($1, $2, $3, $4)`
		_, err := pool.Exec(r.Context(), query, req.ID, req.Column, req.Value, req.Actor)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}

type BatchUpdateReq struct {
	Changes json.RawMessage `json:"p_changes"`
	Actor   string          `json:"p_actor"`
}

func HandleBatchUpdate(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req BatchUpdateReq
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if req.Actor == "" {
			req.Actor = "system"
		}

		var affected int
		query := `SELECT api.batch_update_registry($1, $2)`
		err := pool.QueryRow(r.Context(), query, req.Changes, req.Actor).Scan(&affected)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(affected)
	}
}

type AggReq struct {
	Column   string          `json:"p_column"`
	Function string          `json:"p_function"`
	Filters  json.RawMessage `json:"p_filters"`
}

func HandleAggregate(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req AggReq
		_ = json.NewDecoder(r.Body).Decode(&req)
		if req.Column == "" {
			req.Column = "value"
		}
		if req.Function == "" {
			req.Function = "SUM"
		}
		if req.Filters == nil {
			req.Filters = json.RawMessage("{}")
		}

		var sum float64
		query := `SELECT api.aggregate_registry($1, $2, $3)`
		err := pool.QueryRow(r.Context(), query, req.Column, req.Function, req.Filters).Scan(&sum)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(sum)
	}
}
