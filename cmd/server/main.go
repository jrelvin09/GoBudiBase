package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"gobudibase/internal/config"
	"gobudibase/internal/database"
	"gobudibase/internal/handlers"
	"gobudibase/internal/middleware"
)

func main() {
	slog.Info("Memulai daemon GoBudiBase Enterprise...")
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
		w.Write([]byte(`{"status":"ok","engine":"GoBudiBase Native","time":"` + time.Now().UTC().Format(time.RFC3339) + `"}`))
	})

	// REST RPC Routes (/api/v1)
	r.Route("/api/v1", func(r chi.Router) {
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
			r.Post("/pages/delete", handlers.HandleDeleteBuilderPage(pool))

			r.Post("/components/create", handlers.HandleCreateBuilderComponent(pool))
			r.Post("/components/update", handlers.HandleUpdateBuilderComponent(pool))
			r.Post("/components/delete", handlers.HandleDeleteBuilderComponent(pool))

			r.Get("/schema/tables", handlers.HandleGetSchemaTables(pool))
			r.Post("/schema/tables", handlers.HandleGetSchemaTables(pool))
			r.Get("/schema/columns", handlers.HandleGetTableColumns(pool))
			r.Post("/schema/columns", handlers.HandleGetTableColumns(pool))
			r.Post("/query/execute", handlers.HandleExecuteBuilderQuery(pool))
		})
	})

	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		slog.Info("Server HTTP GoBudiBase aktif", "port", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("Server listener error", "err", err)
		}
	}()

	// Graceful shutdown handling
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	slog.Info("Mematikan server secara graceful...")
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()
	_ = server.Shutdown(shutdownCtx)
	slog.Info("Server GoBudiBase berhenti.")
}
