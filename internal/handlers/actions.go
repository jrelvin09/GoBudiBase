package handlers

import (
	"encoding/json"
	"net/http"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ExecuteActionReq struct {
	ActionType string          `json:"p_action_type"`
	Payload    json.RawMessage `json:"p_payload"`
}

func HandleExecuteAction(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req ExecuteActionReq
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if req.Payload == nil {
			req.Payload = json.RawMessage("{}")
		}

		var result json.RawMessage
		query := `SELECT api.execute_dynamic_action($1, $2)`
		err := pool.QueryRow(r.Context(), query, req.ActionType, req.Payload).Scan(&result)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(result)
	}
}

func HandleListActionRules(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var result json.RawMessage
		query := `SELECT api.list_dynamic_action_rules()`
		err := pool.QueryRow(r.Context(), query).Scan(&result)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(result)
	}
}
