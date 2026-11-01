package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"gobudibase/internal/config"
	"gobudibase/internal/database"
	"gobudibase/internal/handlers"
	"gobudibase/internal/middleware"
)

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
	User    any    `json:"user,omitempty"`
}

func main() {
	slog.Info("Memulai daemon GoPimsBase (Harvest Cloud Oracle APEX Clone)...")
	cfg := config.Load()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	pool, err := database.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		slog.Warn("Inisialisasi database pool peringatan", "err", err)
	} else {
		defer pool.Close()
		slog.Info("Database PostgreSQL 17 pool terhubung (30 max connections)")
	}

	r := chi.NewRouter()
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(chimw.Recoverer)
	r.Use(middleware.CORS())
	r.Use(middleware.Logger)

	// Healthcheck endpoint
	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","engine":"GoPimsBase Native","time":"` + time.Now().UTC().Format(time.RFC3339) + `"}`))
	})

	// REST RPC Routes (/api/v1)
	mainRouter := r
	r.Route("/api/v1", func(r chi.Router) {
		// Authentication endpoint for Harvest Cloud PIMS
		r.Post("/auth/login", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			var req LoginRequest
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				w.WriteHeader(http.StatusBadRequest)
				json.NewEncoder(w).Encode(LoginResponse{Success: false, Message: "Payload tidak valid"})
				return
			}

			userUpper := strings.ToUpper(strings.TrimSpace(req.Username))
			if (userUpper == "IT000002" && req.Password == "Palembang@2026") ||
				(userUpper == "MUKTI" && req.Password == "Palembang@2026") ||
				(userUpper == "ADMIN" && req.Password == "admin") {
				json.NewEncoder(w).Encode(LoginResponse{
					Success: true,
					User: map[string]string{
						"username":       userUpper,
						"fullName":       "Mukti Assary",
						"role":           "Administrator HCM & Plantation",
						"email":          "mukti@company.com",
						"subsidiaryCode": "PLMB",
						"subsidiaryName": "PT Palembang Agro Mandiri",
					},
				})
			} else {
				w.WriteHeader(http.StatusUnauthorized)
				json.NewEncoder(w).Encode(LoginResponse{
					Success: false,
					Message: "Invalid Login Credentials. Please wait 5 seconds to sign in again.",
				})
			}
		})

		r.Post("/registry/list", handlers.HandleListRegistry(pool))
		r.Post("/registry/count", handlers.HandleCountRegistry(pool))
		r.Post("/registry/update", handlers.HandleUpdateCell(pool))
		r.Post("/registry/batch", handlers.HandleBatchUpdate(pool))
		r.Post("/registry/aggregate", handlers.HandleAggregate(pool))

		r.Post("/pivot", handlers.HandleGetPivot(pool))

		r.Post("/actions/execute", handlers.HandleExecuteAction(pool))
		r.Get("/actions/rules", handlers.HandleListActionRules(pool))
		r.Post("/actions/rules", handlers.HandleListActionRules(pool))

		r.Post("/spatial/map", handlers.HandleGetMapLocations(pool))
		r.Post("/spatial/tree", handlers.HandleGetLocationTree(pool))
		r.Post("/facets", handlers.HandleGetFacets(pool))
		r.Post("/calendar/events", handlers.HandleListCalendarEvents(pool))

		r.Post("/reports/save", handlers.HandleSaveReport(pool))
		r.Post("/reports/load", handlers.HandleLoadReports(pool))

		// Low-Code App Builder & Dynamic Runtime Routes
		r.Route("/builder", func(r chi.Router) {
			r.Get("/runtime", handlers.HandleGetRuntimeApp(pool))
			r.Post("/runtime", handlers.HandleGetRuntimeApp(pool))

			r.Get("/apps", handlers.HandleListBuilderApps(pool))
			r.Post("/apps", handlers.HandleListBuilderApps(pool))
			r.Post("/apps/create", handlers.HandleCreateBuilderApp(pool))

			r.Post("/pages/create", handlers.HandleCreateBuilderPage(pool))
			r.Post("/pages/update", handlers.HandleUpdateBuilderPage(pool))
			r.Post("/pages/code", handlers.HandleSavePageCode(pool))
			r.Post("/pages/delete", handlers.HandleDeleteBuilderPage(pool))

			r.Post("/components/create", handlers.HandleCreateBuilderComponent(pool))
			r.Post("/components/update", handlers.HandleUpdateBuilderComponent(pool))
			r.Post("/components/delete", handlers.HandleDeleteBuilderComponent(pool))

			r.Get("/schema/tables", handlers.HandleGetSchemaTables(pool))
			r.Post("/schema/tables", handlers.HandleGetSchemaTables(pool))
			r.Get("/schema/columns", handlers.HandleGetTableColumns(pool))
			r.Post("/schema/columns", handlers.HandleGetTableColumns(pool))
			r.Post("/query/execute", handlers.HandleExecuteBuilderQuery(pool))
			r.Post("/batch", handlers.HandleBatchOperations(pool))

			// Standalone Build & Port Runner Endpoints
			r.Post("/build", handlers.HandleBuildApp(pool, mainRouter))
			r.Get("/build/status", handlers.HandleGetBuildStatus())
		})

		// Generic Resource REST for Interactive Grid & Reports
		r.Post("/r/{res}/_batch", handlers.HandleBatchOperations(pool))
	})

	// Static SPA File Server for Frontend UI
	workDir, _ := os.Getwd()
	buildDir := filepath.Join(workDir, "web-svelte", "build")
	if _, err := os.Stat(buildDir); err == nil {
		slog.Info("Menyajikan Frontend UI dari static build", "dir", buildDir)
		r.Get("/*", func(w http.ResponseWriter, r *http.Request) {
			reqPath := r.URL.Path
			if strings.HasPrefix(reqPath, "/gobudibase") {
				reqPath = strings.TrimPrefix(reqPath, "/gobudibase")
			}
			if reqPath == "" || reqPath == "/" {
				http.ServeFile(w, r, filepath.Join(buildDir, "index.html"))
				return
			}
			targetPath := filepath.Join(buildDir, filepath.Clean(reqPath))
			info, err := os.Stat(targetPath)
			if err != nil || info.IsDir() {
				// Fallback to index.html for SPA routing
				http.ServeFile(w, r, filepath.Join(buildDir, "index.html"))
				return
			}
			http.ServeFile(w, r, targetPath)
		})
	}

	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		slog.Info("Server HTTP GoPimsBase aktif", "port", cfg.Port, "url", "http://localhost:"+cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("Server listener error", "err", err)
		}
	}()

	// Graceful shutdown handling
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	slog.Info("Mematikan server GoPimsBase secara graceful...")
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()
	_ = server.Shutdown(shutdownCtx)
	slog.Info("Server GoPimsBase berhenti.")
}
