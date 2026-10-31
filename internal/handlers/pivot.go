package handlers

import (
	"encoding/json"
	"net/http"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PivotReq struct {
	RowDim  string          `json:"p_row_dim"`
	ColDim  string          `json:"p_col_dim"`
	Metric  string          `json:"p_metric"`
	Filters json.RawMessage `json:"p_filters"`
}

func HandleGetPivot(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req PivotReq
		_ = json.NewDecoder(r.Body).Decode(&req)
		if req.RowDim == "" {
			req.RowDim = "category"
		}
		if req.ColDim == "" {
			req.ColDim = "status"
		}
		if req.Metric == "" {
			req.Metric = "sum_value"
		}
		if req.Filters == nil {
			req.Filters = json.RawMessage("{}")
		}

		var result json.RawMessage
		query := `SELECT api.get_registry_pivot($1, $2, $3, $4)`
		err := pool.QueryRow(r.Context(), query, req.RowDim, req.ColDim, req.Metric, req.Filters).Scan(&result)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(result)
	}
}
