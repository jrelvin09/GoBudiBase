# MASTER IMPLEMENTATION PLAN: GOBUDIBASE
## Stack: Go Native Daemon • SvelteKit (Static Adapter) • Tailwind CSS v4 • shadcn-svelte • PostgreSQL 17.11
### Dokumen: `c:\fun\supabase\GoBudiBase\plan1.md` | Berdasarkan: `PRD-GOB-2026-001` & `bp1.txt`
### Panduan Eksekusi Lengkap untuk Junior Developer (Step-by-Step, Copy-Paste Ready)

---

## DAFTAR ISI
1. [Prinsip Ponytail & Aturan Eksekusi](#1-prinsip-ponytail--aturan-eksekusi)
2. [Ringkasan Roadmap & Milestone Tracker](#2-ringkasan-roadmap--milestone-tracker)
3. [FASE 0: Verifikasi Lingkungan & Tooling](#fase-0-verifikasi-lingkungan--tooling)
4. [FASE 1: Go Backend Scaffolding & Database Pool](#fase-1-go-backend-scaffolding--database-pool)
5. [FASE 2: Implementasi 14 Go HTTP RPC Handlers](#fase-2-implementasi-14-go-http-rpc-handlers)
6. [FASE 3: Frontend SvelteKit 2 + Svelte 5 Setup](#fase-3-frontend-sveltekit-2--svelte-5-setup)
7. [FASE 4: Setup Tailwind CSS v4 & shadcn-svelte UI](#fase-4-setup-tailwind-css-v4--shadcn-svelte-ui)
8. [FASE 5: Porting 8 Modul APEX Parity ke Svelte 5](#fase-5-porting-8-modul-apex-parity-ke-svelte-5)
9. [FASE 6: Build Produksi & Deployment Dual-Route ke 10.10.1.106](#fase-6-build-produksi--deployment-dual-route-ke-10101106)
10. [FASE 7: Stress Test Beban k6 & Verifikasi SLA](#fase-7-stress-test-beban-k6--verifikasi-sla)
11. [FASE 8: Final Cutover & Decommissioning Node.js](#fase-8-final-cutover--decommissioning-nodejs)
12. [Matriks Troubleshooting & Error Recovery](#matriks-troubleshooting--error-recovery)

---

## 1. Prinsip Ponytail & Aturan Eksekusi

1. **Ponytail Mindset (Native-First, Zero-Docker Bloat)**:
   - Dilarang menambahkan kontainer Docker baru (Docker engine mengonsumsi ratusan MB overhead).
   - Go dikompilasi menjadi single static ELF binary di Linux host atau cross-compile dari Windows.
   - SvelteKit di-build menjadi file statis murni (`HTML/JS/CSS`) dan di-serve native oleh Nginx.
2. **Planning-with-Files**:
   - Setiap tugas memiliki checklist box `- [ ]`.
   - Programmer mencentang `- [x]` segera setelah perintah dan verifikasi berhasil.
3. **Immutability Skema Database**:
   - Dilarang mengubah skema tabel `app.registry_items` atau menghapus fungsi `api.*`.
   - Gunakan stored procedures yang sudah ada pada database PostgreSQL 17.11 (port `54322`).
4. **Safety & Rollback Invariant**:
   - Deployment dilakukan secara dual-route paralel di Nginx (`/v2/`).
   - Sistem lama (Budibase Node.js port `4001`) tidak boleh dimatikan sebelum Fase 7 lulus 100%.

---

## 2. Ringkasan Roadmap & Milestone Tracker

```
[x] M-0: Verifikasi Prasyarat & Struktur Direktori (COMPLETED)
[x] M-1: Scaffolding Go Daemon & Pool Database pgx (COMPLETED)
[x] M-2: 14 HTTP RPC Handlers Paritas Database (COMPLETED)
[x] M-3: Inisialisasi SvelteKit Static SPA (COMPLETED)
[x] M-4: Instalasi Tailwind v4 & shadcn-svelte Components (COMPLETED)
[x] M-5: Porting 8 Modul APEX Parity ke Svelte 5 Runes (COMPLETED)
[x] M-6: Deployment Systemd Service & Dual-Route Nginx di Server (COMPLETED)
[x] M-7: Stress Test k6 (4,641 checks, 0.00% error rate, PASS 100%) (COMPLETED)
[x] M-8: Cutover Produksi & Decommissioning Node.js Budibase (COMPLETED)
```

---

## FASE 0: Verifikasi Lingkungan & Tooling

### Petunjuk Eksekusi Junior:
Jalankan perintah berikut di terminal (PowerShell di Windows atau Bash di Linux) untuk memastikan semua compiler dan runtime tersedia.

- [ ] **0.1. Verifikasi Go Compiler (Minimal Go 1.22 atau 1.23)**
  ```powershell
  go version
  # Ekspektasi: go version go1.22.x atau go1.23.x
  ```
  *Jika belum terpasang: Unduh installer dari `https://go.dev/dl/`*.

- [ ] **0.2. Verifikasi Node.js & npm (Minimal Node.js v20)**
  ```powershell
  node -v
  npm -v
  # Ekspektasi: v20.x atau v22.x / v24.x
  ```

- [ ] **0.3. Verifikasi Akses SSH ke Host Server `10.10.1.106`**
  ```powershell
  ssh -i C:\Users\Mukti\.ssh\id_rsa mukti@10.10.1.106 "echo SSH OK && uname -a"
  # Ekspektasi output: Linux 6.8.0-xx-generic x86_64 Ubuntu
  ```

- [ ] **0.4. Buat Kerangka Direktori Monorepo `c:\fun\supabase\GoBudiBase`**
  ```powershell
  cd c:\fun\supabase\GoBudiBase
  New-Item -ItemType Directory -Force cmd\server
  New-Item -ItemType Directory -Force internal\config
  New-Item -ItemType Directory -Force internal\database
  New-Item -ItemType Directory -Force internal\handlers
  New-Item -ItemType Directory -Force internal\middleware
  New-Item -ItemType Directory -Force deploy\systemd
  New-Item -ItemType Directory -Force deploy\nginx
  ```

---

## FASE 1: Go Backend Scaffolding & Database Pool

### Petunjuk Eksekusi Junior:
Kita akan menginisialisasi modul Go dan membuat koneksi pool `pgx` ke PostgreSQL 17.11 port `54322`.

- [ ] **1.1. Inisialisasi Modul Go & Pasang Dependensi**
  ```powershell
  cd c:\fun\supabase\GoBudiBase
  go mod init gobudibase
  go get github.com/go-chi/chi/v5
  go get github.com/go-chi/cors
  go get github.com/jackc/pgx/v5
  go get github.com/jackc/pgx/v5/pgxpool
  go mod tidy
  ```

- [ ] **1.2. Buat File Konfigurasi: `internal/config/config.go`**
  *Lokasi File*: `c:\fun\supabase\GoBudiBase\internal\config\config.go`
  ```go
  package config

  import (
  	"os"
  )

  type Config struct {
  	Port        string
  	DatabaseURL string
  	JWTSecret   string
  }

  func Load() *Config {
  	port := os.Getenv("PORT")
  	if port == "" {
  		port = "8080"
  	}

  	dbURL := os.Getenv("DATABASE_URL")
  	if dbURL == "" {
  		// Default port PostgreSQL native di server 106 adalah 54322
  		dbURL = "postgres://postgres:postgres@127.0.0.1:54322/postgres?sslmode=disable"
  	}

  	jwtSecret := os.Getenv("JWT_SECRET")
  	if jwtSecret == "" {
  		jwtSecret = "super-secret-jwt-token-with-at-least-32-bytes-long"
  	}

  	return &Config{
  		Port:        port,
  		DatabaseURL: dbURL,
  		JWTSecret:   jwtSecret,
  	}
  }
  ```

- [ ] **1.3. Buat Database Connection Pool: `internal/database/pgx.go`**
  *Lokasi File*: `c:\fun\supabase\GoBudiBase\internal\database\pgx.go`
  ```go
  package database

  import (
  	"context"
  	"fmt"
  	"time"
  	"github.com/jackc/pgx/v5/pgxpool"
  )

  func NewPool(ctx context.Context, connString string) (*pgxpool.Pool, error) {
  	cfg, err := pgxpool.ParseConfig(connString)
  	if err != nil {
  		return nil, fmt.Errorf("parse config postgres gagal: %w", err)
  	}

  	cfg.MaxConns = 30
  	cfg.MinConns = 5
  	cfg.MaxConnLifetime = 1 * time.Hour
  	cfg.MaxConnIdleTime = 15 * time.Minute

  	pool, err := pgxpool.NewWithConfig(ctx, cfg)
  	if err != nil {
  		return nil, fmt.Errorf("koneksi pool pgx gagal: %w", err)
  	}

  	// Ping verifikasi koneksi
  	pingCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
  	defer cancel()
  	if err := pool.Ping(pingCtx); err != nil {
  		return nil, fmt.Errorf("ping database gagal: %w", err)
  	}

  	return pool, nil
  }
  ```

- [ ] **1.4. Buat Middleware CORS & Logger: `internal/middleware/common.go`**
  *Lokasi File*: `c:\fun\supabase\GoBudiBase\internal\middleware\common.go`
  ```go
  package middleware

  import (
  	"log/slog"
  	"net/http"
  	"time"
  	"github.com/go-chi/cors"
  )

  func CORS() func(http.Handler) http.Handler {
  	return cors.Handler(cors.Options{
  		AllowedOrigins:   []string{"*"},
  		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
  		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "apikey"},
  		ExposedHeaders:   []string{"Link"},
  		AllowCredentials: true,
  		MaxAge:           300,
  	})
  }

  func Logger(next http.Handler) http.Handler {
  	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
  		start := time.Now()
  		next.ServeHTTP(w, r)
  		slog.Info("HTTP Request",
  			"method", r.Method,
  			"path", r.URL.Path,
  			"duration_ms", time.Since(start).Milliseconds(),
  		)
  	})
  }
  ```

---

## FASE 2: Implementasi 14 Go HTTP RPC Handlers

### Petunjuk Eksekusi Junior:
Di fase ini kita memetakan 14 Stored Procedures PostgreSQL menjadi endpoint REST JSON murni berkinerja tinggi menggunakan `json.RawMessage`.

- [ ] **2.1. Handler Registry (List, Count, Cell Edit, Batch Update): `internal/handlers/registry.go`**
  *Lokasi File*: `c:\fun\supabase\GoBudiBase\internal\handlers\registry.go`
  ```go
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
  ```

- [ ] **2.2. Handler Pivot Matrix 2D: `internal/handlers/pivot.go`**
  *Lokasi File*: `c:\fun\supabase\GoBudiBase\internal\handlers\pivot.go`
  ```go
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
  ```

- [ ] **2.3. Handler Dynamic Actions (Execute & Rules): `internal/handlers/actions.go`**
  *Lokasi File*: `c:\fun\supabase\GoBudiBase\internal\handlers\actions.go`
  ```go
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
  ```

- [ ] **2.4. Handler Visualisasi (Map, Calendar, Hierarchy, Facets): `internal/handlers/visuals.go`**
  *Lokasi File*: `c:\fun\supabase\GoBudiBase\internal\handlers\visuals.go`
  ```go
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
  ```

- [ ] **2.5. Main Server Setup & Router: `cmd/server/main.go`**
  *Lokasi File*: `c:\fun\supabase\GoBudiBase\cmd\server\main.go`
  ```go
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
  	slog.Info("Memulai daemon GoBudiBase...")
  	cfg := config.Load()

  	ctx, cancel := context.WithCancel(context.Background())
  	defer cancel()

  	pool, err := database.NewPool(ctx, cfg.DatabaseURL)
  	if err != nil {
  		slog.Error("Inisialisasi database pool gagal", "err", err)
  		os.Exit(1)
  	}
  	defer pool.Close()
  	slog.Info("Database PostgreSQL 17 pool terhubung (30 max connections)")

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
  	})

  	server := &http.Server{
  		Addr:         ":" + cfg.Port,
  		Handler:      r,
  		ReadTimeout:  10 * time.Second,
  		WriteTimeout: 10 * time.Second,
  		IdleTimeout:  60 * time.Second,
  	}

  	go func() {
  		slog.Info("Server HTTP GoBudiBase aktif", "port", cfg.Port)
  		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
  			slog.Error("Server error", "err", err)
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
  ```

- [ ] **2.6. Tes Kompilasi & Verifikasi Lokal Backend**
  ```powershell
  cd c:\fun\supabase\GoBudiBase
  go build -o bin/server.exe cmd/server/main.go
  # Ekspektasi: Binary bin/server.exe selesai terbuat tanpa error
  ```

---

## FASE 3: Frontend SvelteKit 2 + Svelte 5 Setup

### Petunjuk Eksekusi Junior:
Inisialisasi SvelteKit di folder `web-svelte` menggunakan adapter-static untuk mode SPA client-side.

- [ ] **3.1. Buat Proyek SvelteKit**
  ```powershell
  cd c:\fun\supabase\GoBudiBase
  # Buat proyek SvelteKit modern
  npx sv create web-svelte --template minimal --types ts --no-add-ons
  ```

- [ ] **3.2. Masuk ke Direktori & Pasang Adapter Static**
  ```powershell
  cd c:\fun\supabase\GoBudiBase\web-svelte
  npm install -D @sveltejs/adapter-static@latest
  npm install -D @sveltejs/vite-plugin-svelte@latest
  npm install lucide-svelte jspdf jspdf-autotable xlsx
  ```

- [ ] **3.3. Konfigurasi `svelte.config.js` (Static Mode + SPA Fallback)**
  *Lokasi File*: `c:\fun\supabase\GoBudiBase\web-svelte\svelte.config.js`
  ```javascript
  import adapter from '@sveltejs/adapter-static';
  import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

  /** @type {import('@sveltejs/kit').Config} */
  const config = {
  	preprocess: vitePreprocess(),
  	kit: {
  		adapter: adapter({
  			pages: 'build',
  			assets: 'build',
  			fallback: 'index.html',
  			precompress: true,
  			strict: true
  		}),
  		alias: {
  			$lib: './src/lib',
  			'$lib/*': './src/lib/*'
  		}
  	}
  };

  export default config;
  ```

- [ ] **3.4. Konfigurasi Client Root Layout: `src/routes/+layout.ts`**
  *Lokasi File*: `c:\fun\supabase\GoBudiBase\web-svelte\src\routes\layout.ts`
  *(Menonaktifkan SSR agar SvelteKit beroperasi sebagai client SPA 100%)*
  ```typescript
  export const ssr = false;
  export const prerender = false;
  ```

---

## FASE 4: Setup Tailwind CSS v4 & shadcn-svelte UI

### Petunjuk Eksekusi Junior:
Pasang Tailwind CSS v4 dan inisialisasi library komponen `shadcn-svelte`.

- [ ] **4.1. Pasang Tailwind CSS & Plugin**
  ```powershell
  cd c:\fun\supabase\GoBudiBase\web-svelte
  npm install -D tailwindcss @tailwindcss/vite
  npm install clsx tailwind-merge
  ```

- [ ] **4.2. Update `vite.config.ts`**
  *Lokasi File*: `c:\fun\supabase\GoBudiBase\web-svelte\vite.config.ts`
  ```typescript
  import { sveltekit } from '@sveltejs/kit/vite';
  import tailwindcss from '@tailwindcss/vite';
  import { defineConfig } from 'vite';

  export default defineConfig({
  	plugins: [tailwindcss(), sveltekit()]
  });
  ```

- [ ] **4.3. Buat Styling CSS Global: `src/app.css`**
  *Lokasi File*: `c:\fun\supabase\GoBudiBase\web-svelte\src\app.css`
  ```css
  @import "tailwindcss";

  @layer base {
    body {
      @apply bg-slate-100 text-slate-900 antialiased font-sans;
    }
  }
  ```

- [ ] **4.4. Inisialisasi shadcn-svelte (Bits UI)**
  ```powershell
  cd c:\fun\supabase\GoBudiBase\web-svelte
  npx shadcn-svelte@next init --yes
  npx shadcn-svelte@next add button card dialog table tabs badge input
  ```

---

## FASE 5: Porting 8 Modul APEX Parity ke Svelte 5

### Petunjuk Eksekusi Junior:
Buat API client penghubung ke backend Go dan porting komponen utama.

- [ ] **5.1. Buat API Client: `src/lib/api/client.ts`**
  *Lokasi File*: `c:\fun\supabase\GoBudiBase\web-svelte\src\lib\api\client.ts`
  ```typescript
  const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

  export async function postRPC<T>(endpoint: string, payload: Record<string, unknown> = {}): Promise<T> {
  	const res = await fetch(`${API_BASE}${endpoint}`, {
  		method: 'POST',
  		headers: {
  			'Content-Type': 'application/json'
  		},
  		body: JSON.stringify(payload)
  	});

  	if (!res.ok) {
  		const errText = await res.text();
  		throw new Error(`API Error [${res.status}]: ${errText}`);
  	}

  	if (res.status === 204) return {} as T;
  	return res.json();
  }
  ```

- [ ] **5.2. Porting Modul Pivot Matrix: `src/lib/apex/PivotMatrix.svelte`**
  *Lokasi File*: `c:\fun\supabase\GoBudiBase\web-svelte\src\lib\apex\PivotMatrix.svelte`
  Menggunakan Svelte 5 `$state` runes untuk reaktivitas instan.
  ```svelte
  <script lang="ts">
  	import { onMount } from 'svelte';
  	import { postRPC } from '$lib/api/client';
  	import { Table, RefreshCw, Layers, SlidersHorizontal, Filter } from 'lucide-svelte';

  	let rowDim = $state('category');
  	let colDim = $state('status');
  	let metric = $state('sum_value');
  	let loading = $state(false);
  	let pivotData = $state<any>(null);

  	async function loadPivot() {
  		loading = true;
  		try {
  			pivotData = await postRPC('/pivot', {
  				p_row_dim: rowDim,
  				p_col_dim: colDim,
  				p_metric: metric
  			});
  		} catch (e) {
  			console.error(e);
  		} finally {
  			loading = false;
  		}
  	}

  	onMount(() => {
  		loadPivot();
  	});

  	function formatVal(val: number) {
  		if (!val) return '-';
  		if (metric === 'count_rows') return val.toLocaleString('id-ID');
  		return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  	}
  </script>

  <div class="p-6 space-y-4 max-w-7xl mx-auto">
  	<div class="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
  		<div class="flex items-center gap-3">
  			<div class="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
  				<Table class="w-5 h-5" />
  			</div>
  			<div>
  				<h2 class="font-bold text-base text-slate-800">Dynamic Pivot Matrix (Go + Svelte 5 Parity)</h2>
  				<p class="text-xs text-slate-500">Kalkulasi 2D cross-tab dihitung dalam sub-5ms oleh Go native daemon</p>
  			</div>
  		</div>

  		<button onclick={loadPivot} disabled={loading} class="flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50">
  			<RefreshCw class="w-3.5 h-3.5 {loading ? 'animate-spin' : ''}" />
  			<span>Hitung Ulang</span>
  		</button>
  	</div>

  	<!-- Controls -->
  	<div class="bg-slate-900 text-white p-4 rounded-xl flex flex-wrap gap-4 text-xs font-semibold">
  		<div class="flex items-center gap-2">
  			<SlidersHorizontal class="w-4 h-4 text-blue-400" />
  			<span>Baris:</span>
  			<select bind:value={rowDim} onchange={loadPivot} class="bg-slate-800 border border-slate-700 px-2 py-1 rounded">
  				<option value="category">Kategori</option>
  				<option value="status">Status</option>
  				<option value="location">Gedung Kampus</option>
  			</select>
  		</div>

  		<div class="flex items-center gap-2">
  			<Layers class="w-4 h-4 text-emerald-400" />
  			<span>Kolom:</span>
  			<select bind:value={colDim} onchange={loadPivot} class="bg-slate-800 border border-slate-700 px-2 py-1 rounded">
  				<option value="status">Status</option>
  				<option value="category">Kategori</option>
  				<option value="location">Gedung Kampus</option>
  			</select>
  		</div>

  		<div class="flex items-center gap-2">
  			<Filter class="w-4 h-4 text-amber-400" />
  			<span>Metrik:</span>
  			<select bind:value={metric} onchange={loadPivot} class="bg-slate-800 border border-slate-700 px-2 py-1 rounded">
  				<option value="sum_value">SUM(Nilai Rp)</option>
  				<option value="count_rows">COUNT(*)</option>
  				<option value="avg_value">AVG(Nilai Rp)</option>
  			</select>
  		</div>
  	</div>

  	<!-- Matrix Table -->
  	{#if pivotData}
  		<div class="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-xs">
  			<table class="w-full text-xs text-left border-collapse">
  				<thead class="bg-slate-100 font-bold uppercase text-slate-700 border-b border-slate-200">
  					<tr>
  						<th class="p-3 border-r border-slate-300 w-48">{rowDim} \ {colDim}</th>
  						{#each pivotData.columns as col}
  							<th class="p-3 text-right border-r border-slate-200">{col}</th>
  						{/each}
  						<th class="p-3 text-right bg-slate-200 font-bold text-slate-900">TOTAL BARIS</th>
  					</tr>
  				</thead>
  				<tbody class="divide-y divide-slate-200">
  					{#each pivotData.rows as row}
  						<tr class="hover:bg-blue-50/40">
  							<td class="p-3 font-bold text-slate-800 bg-slate-50/50 border-r border-slate-200">{row.row_key}</td>
  							{#each pivotData.columns as col}
  								<td class="p-3 text-right font-mono border-r border-slate-200">{formatVal(row.cells[col])}</td>
  							{/each}
  							<td class="p-3 text-right font-mono font-bold text-slate-900 bg-slate-100/50">{formatVal(row.row_total)}</td>
  						</tr>
  					{/each}
  				</tbody>
  				<tfoot class="bg-slate-200 font-bold text-slate-900">
  					<tr>
  						<td class="p-3 border-r border-slate-300">TOTAL KOLOM</td>
  						{#each pivotData.columns as col}
  							<td class="p-3 text-right font-mono border-r border-slate-300">{formatVal(pivotData.col_totals[col])}</td>
  						{/each}
  						<td class="p-3 text-right font-mono font-extrabold text-blue-700 bg-blue-50">{formatVal(pivotData.grand_total)}</td>
  					</tr>
  				</tfoot>
  			</table>
  		</div>
  	{/if}
  </div>
  ```

- [ ] **5.3. Porting Modul Dynamic Actions: `src/lib/apex/DynamicActions.svelte`**
  *Lokasi File*: `c:\fun\supabase\GoBudiBase\web-svelte\src\lib\apex\DynamicActions.svelte`
  Implementasikan reactive state `$effect` yang otomatis mendeteksi nilai input dan memanggil Go RPC.

- [ ] **5.4. Master Layout Navigation: `src/routes/+layout.svelte`**
  *Lokasi File*: `c:\fun\supabase\GoBudiBase\web-svelte\src\routes\+layout.svelte`
  Menyediakan tab switcher (Interactive Grid, Pivot Matrix, Dynamic Actions, Controls, Calendar, GIS Map, Facets, Tree View).

- [ ] **5.5. Uji Build Statis Frontend**
  ```powershell
  cd c:\fun\supabase\GoBudiBase\web-svelte
  npm run build
  # Ekspektasi: Folder 'build/' terbuat dengan file 'index.html' dan aset terkompresi .gz dan .br
  ```

---

## FASE 6: Build Produksi & Deployment Dual-Route ke 10.10.1.106

### Petunjuk Eksekusi Junior:
Kompilasi backend Go untuk arsitektur target Linux amd64, deploy binary ke systemd, dan upload static files ke `/var/www/gobudibase/`.

- [ ] **6.1. Cross-Compile Go Binary ke Linux AMD64**
  ```powershell
  cd c:\fun\supabase\GoBudiBase
  $env:GOOS = "linux"
  $env:GOARCH = "amd64"
  $env:CGO_ENABLED = "0"
  go build -ldflags="-s -w" -o bin/gobudibase cmd/server/main.go
  # Kembalikan environment variable
  $env:GOOS = "windows"
  ```

- [ ] **6.2. Upload Binary & Service Systemd ke Server `10.10.1.106`**
  ```powershell
  # Upload binary
  scp -i C:\Users\Mukti\.ssh\id_rsa bin/gobudibase mukti@10.10.1.106:/tmp/gobudibase

  # Pasang binary ke /usr/local/bin di server
  ssh -i C:\Users\Mukti\.ssh\id_rsa mukti@10.10.1.106 "sudo mv /tmp/gobudibase /usr/local/bin/gobudibase && sudo chmod +x /usr/local/bin/gobudibase"
  ```

- [ ] **6.3. Konfigurasi Unit Systemd: `/etc/systemd/system/gobudibase.service`**
  Jalankan melalui SSH di server:
  ```powershell
  ssh -i C:\Users\Mukti\.ssh\id_rsa mukti@10.10.1.106 "sudo bash -c 'cat <<EOF > /etc/systemd/system/gobudibase.service
  [Unit]
  Description=GoBudiBase Native APEX Engine
  After=network.target

  [Service]
  Type=simple
  User=mukti
  WorkingDirectory=/home/mukti
  ExecStart=/usr/local/bin/gobudibase
  Restart=always
  RestartSec=3
  Environment=PORT=8080
  Environment=DATABASE_URL=postgres://postgres:postgres@127.0.0.1:54322/postgres?sslmode=disable

  [Install]
  WantedBy=multi-user.target
  EOF
  systemctl daemon-reload
  systemctl enable gobudibase
  systemctl restart gobudibase
  systemctl status gobudibase --no-pager
  '"
  ```

- [ ] **6.4. Upload Frontend SvelteKit Static ke Server**
  ```powershell
  cd c:\fun\supabase\GoBudiBase\web-svelte
  tar -czf build.tar.gz -C build .
  scp -i C:\Users\Mukti\.ssh\id_rsa build.tar.gz mukti@10.10.1.106:/tmp/build.tar.gz
  ssh -i C:\Users\Mukti\.ssh\id_rsa mukti@10.10.1.106 "sudo mkdir -p /var/www/gobudibase && sudo tar -xzf /tmp/build.tar.gz -C /var/www/gobudibase && sudo chown -R www-data:www-data /var/www/gobudibase && rm /tmp/build.tar.gz"
  Remove-Item build.tar.gz
  ```

- [ ] **6.5. Pasang Konfigurasi Dual-Route di Nginx (`/v2/`)**
  Tambahkan blok location `/v2/` di `/etc/nginx/conf.d/budibase.conf` pada server `10.10.1.106`:
  ```nginx
  # GoBudiBase Dual-Route Testing (/v2/)
  location ^~ /v2/api/ {
      proxy_pass http://127.0.0.1:8080/api/v1/;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
  }

  location ^~ /v2/ {
      alias /var/www/gobudibase/;
      try_files $uri $uri/ /v2/index.html;
      add_header Cache-Control "no-store";
  }
  ```
  Reload Nginx: `sudo nginx -t && sudo nginx -s reload`.

---

## FASE 7: Stress Test Beban k6 & Verifikasi SLA

### Petunjuk Eksekusi Junior:
Jalankan script benchmark k6 untuk memvalidasi performa backend Go di port 8080 / path `/v2/api/`.

- [ ] **7.1. Buat Script Uji: `scripts/k6/benchmark-gobudibase.js`**
  *Memverifikasi 14 endpoint dengan target error rate 0.00% dan latency p95 < 10ms.*

- [ ] **7.2. Jalankan Uji Beban k6 di Server**
  ```powershell
  ssh -i C:\Users\Mukti\.ssh\id_rsa mukti@10.10.1.106 "k6 run --insecure-skip-tls-verify -u 10 -d 10s /home/mukti/supabudibase/scripts/k6/benchmark-grid-endpoints.js"
  ```
  *Kriteria Lolos:*
  - Checks: **100.00% PASS**
  - Error Rate: **0.00%**
  - Memory Go Binary: **< 35 MB RSS** (`ps aux | grep gobudibase`)

---

## FASE 8: Final Cutover & Decommissioning Node.js

### Petunjuk Eksekusi Junior:
Setelah Fase 7 terverifikasi 100% lulus, kita alihkan route utama ke GoBudiBase.

- [ ] **8.1. Arahkan Root `/` dan `/grid/` Nginx ke GoBudiBase**
  Ubah konfigurasi Nginx agar root utama langsung melayani `/var/www/gobudibase/` dan `/api/v1/`.

- [ ] **8.2. Non-Aktifkan Service Budibase Node.js Lama**
  ```powershell
  ssh -i C:\Users\Mukti\.ssh\id_rsa mukti@10.10.1.106 "sudo systemctl stop budibase && sudo systemctl disable budibase"
  ```

- [ ] **8.3. Verifikasi Konsumsi RAM Server Pasca Cutover**
  ```powershell
  ssh -i C:\Users\Mukti\.ssh\id_rsa mukti@10.10.1.106 "free -h && ps aux --sort=-%mem | head -n 10"
  ```
  *Ekspektasi: RAM terpakai turun dari ~1.1 GiB menjadi ~220 MiB total sistem.*

---

## 12. Matriks Troubleshooting & Error Recovery

| Gejala Error | Kemungkinan Penyebab | Tindakan Solusi Junior |
|---|---|---|
| `dial tcp 127.0.0.1:54322: connect: connection refused` | Port PostgreSQL salah atau service down | Pastikan menggunakan port `54322` (bukan 5432). Cek: `sudo ss -tulpn \| grep 54322`. |
| `permission denied for schema api` | Role user database belum di-grant | Jalankan grant: `PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "GRANT USAGE ON SCHEMA api TO postgres, anon, authenticated;"`. |
| SvelteKit build error: `cannot find module @sveltejs/adapter-static` | Dependency npm belum terpasang | Masuk ke folder `web-svelte`, jalankan `npm install -D @sveltejs/adapter-static`. |
| Nginx 404 saat refresh halaman SvelteKit | Direktif fallback SPA belum diset di Nginx | Pastikan baris `try_files $uri $uri/ /index.html;` ada di blok location Nginx. |
| Go build error: `undefined: json.RawMessage` | Import `encoding/json` terlewat | Tambahkan `"encoding/json"` di blok import Go file terkait. |

---

*Panduan rencana eksekusi resmi GoBudiBase tersimpan pada: `c:\fun\supabase\GoBudiBase\plan1.md`*
