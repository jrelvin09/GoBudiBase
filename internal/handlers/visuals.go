package handlers

import (
	"encoding/json"
	"net/http"
	"github.com/jackc/pgx/v5/pgxpool"
)

func HandleGetMapLocations(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var result json.RawMessage
		query := `SELECT api.get_map_locations()`
		err := pool.QueryRow(r.Context(), query).Scan(&result)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(result)
	}
}

func HandleListCalendarEvents(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var result json.RawMessage
		query := `SELECT api.list_calendar_events()`
		err := pool.QueryRow(r.Context(), query).Scan(&result)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(result)
	}
}

func HandleGetLocationTree(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var result json.RawMessage
		query := `SELECT api.get_location_tree()`
		err := pool.QueryRow(r.Context(), query).Scan(&result)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(result)
	}
}

type FacetsReq struct {
	Filters json.RawMessage `json:"p_filters"`
}

func HandleGetFacets(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req FacetsReq
		_ = json.NewDecoder(r.Body).Decode(&req)
		if req.Filters == nil {
			req.Filters = json.RawMessage("{}")
		}

		var result json.RawMessage
		query := `SELECT api.get_registry_facets($1)`
		err := pool.QueryRow(r.Context(), query, req.Filters).Scan(&result)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(result)
	}
}

type SaveReportReq struct {
	User   string          `json:"p_user"`
	Name   string          `json:"p_name"`
	Config json.RawMessage `json:"p_config"`
}

func HandleSaveReport(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req SaveReportReq
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if req.Config == nil {
			req.Config = json.RawMessage("{}")
		}

		var id int64
		query := `SELECT api.save_grid_report($1, $2, $3)`
		err := pool.QueryRow(r.Context(), query, req.User, req.Name, req.Config).Scan(&id)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(id)
	}
}

type LoadReportsReq struct {
	User string `json:"p_user"`
}

func HandleLoadReports(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req LoadReportsReq
		_ = json.NewDecoder(r.Body).Decode(&req)
		if req.User == "" {
			req.User = "default_user"
		}

		var result json.RawMessage
		query := `SELECT api.load_grid_reports($1)`
		err := pool.QueryRow(r.Context(), query, req.User).Scan(&result)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(result)
	}
}
