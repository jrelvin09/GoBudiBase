package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Active port server registry for running built applications
var (
	buildServersLock    sync.Mutex
	activeBuildServers  = make(map[int]*http.Server)
	activeBuildMetadata = make(map[int]BuildStatus)
)

type BuildStatus struct {
	Port      int       `json:"port"`
	AppSlug   string    `json:"app_slug"`
	AppName   string    `json:"app_name"`
	OutputDir string    `json:"output_dir"`
	URL       string    `json:"url"`
	BuiltAt   time.Time `json:"built_at"`
	IsActive  bool      `json:"is_active"`
}

type BuildAppRequest struct {
	AppSlug   string `json:"app_slug"`
	OutputDir string `json:"output_dir"`
	Port      int    `json:"port"`
	Serve     *bool  `json:"serve"`
}

type BuildAppResponse struct {
	Success    bool        `json:"success"`
	Message    string      `json:"message"`
	AppSlug    string      `json:"app_slug"`
	AppName    string      `json:"app_name"`
	OutputDir  string      `json:"output_dir"`
	Port       int         `json:"port"`
	URL        string      `json:"url"`
	FileCount  int         `json:"file_count"`
	PagesBuilt int         `json:"pages_built"`
	Files      []string    `json:"files"`
	BuiltAt    string      `json:"built_at"`
	Status     BuildStatus `json:"status"`
}

type RuntimeAppPayload struct {
	App struct {
		ID          int    `json:"id"`
		Slug        string `json:"slug"`
		Name        string `json:"name"`
		Description string `json:"description"`
		Theme       string `json:"theme"`
		Version     string `json:"version"`
	} `json:"app"`
	Pages []struct {
		ID          int             `json:"id"`
		Slug        string          `json:"slug"`
		Title       string          `json:"title"`
		Icon        string          `json:"icon"`
		Layout      string          `json:"layout"`
		GroupName   string          `json:"group_name"`
		ParentSlug  *string         `json:"parent_slug"`
		IsHome      bool            `json:"is_home"`
		OrderNum    int             `json:"order_num"`
		CustomHTML  string          `json:"custom_html"`
		CustomCSS   string          `json:"custom_css"`
		ScriptFront string          `json:"script_front"`
		ScriptBack  string          `json:"script_back"`
		Components  json.RawMessage `json:"components"`
	} `json:"pages"`
}

// HandleBuildApp compiles designer & code-behind data into physical disk files and starts/updates port runner
func HandleBuildApp(pool *pgxpool.Pool, mainHandler http.Handler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		var req BuildAppRequest
		bodyBytes, err := io.ReadAll(r.Body)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Gagal membaca body request: " + err.Error()})
			return
		}
		bodyBytes = bytes.TrimPrefix(bodyBytes, []byte("\xef\xbb\xbf"))
		if len(bodyBytes) > 0 {
			if err := json.Unmarshal(bodyBytes, &req); err != nil {
				w.WriteHeader(http.StatusBadRequest)
				json.NewEncoder(w).Encode(map[string]string{"error": "Payload build tidak valid: " + err.Error()})
				return
			}
		}

		if req.AppSlug == "" {
			req.AppSlug = "gopimsbase"
		}
		if req.Port <= 0 {
			req.Port = 8086
		}
		shouldServe := true
		if req.Serve != nil {
			shouldServe = *req.Serve
		}

		// 1. Fetch entire runtime app from PostgreSQL
		var rawData json.RawMessage
		query := `SELECT builder.get_runtime_app($1)`
		if err := pool.QueryRow(r.Context(), query, req.AppSlug).Scan(&rawData); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Gagal mengambil data aplikasi: " + err.Error()})
			return
		}

		var payload RuntimeAppPayload
		if err := json.Unmarshal(rawData, &payload); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Gagal parse payload aplikasi: " + err.Error()})
			return
		}

		// 2. Resolve Output Directory
		outputDir := req.OutputDir
		if outputDir == "" {
			outputDir = filepath.Join(".", "build_output", req.AppSlug)
		}
		absOutputDir, err := filepath.Abs(outputDir)
		if err != nil {
			absOutputDir = outputDir
		}

		pagesDir := filepath.Join(absOutputDir, "pages")
		assetsDir := filepath.Join(absOutputDir, "assets")

		if err := os.MkdirAll(pagesDir, 0755); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Gagal membuat direktori pages: " + err.Error()})
			return
		}
		if err := os.MkdirAll(assetsDir, 0755); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Gagal membuat direktori assets: " + err.Error()})
			return
		}

		generatedFiles := make([]string, 0)

		// 3. Generate Individual Page Files (.html, .css, .js, .json)
		for _, page := range payload.Pages {
			slug := page.Slug
			if slug == "" {
				slug = fmt.Sprintf("page_%d", page.ID)
			}

			// HTML file
			htmlPath := filepath.Join(pagesDir, slug+".html")
			htmlContent := page.CustomHTML
			if strings.TrimSpace(htmlContent) == "" {
				htmlContent = generateDefaultPageHTML(page.Title, slug, page.Components)
			}
			if err := os.WriteFile(htmlPath, []byte(htmlContent), 0644); err == nil {
				generatedFiles = append(generatedFiles, filepath.ToSlash(filepath.Join("pages", slug+".html")))
			}

			// CSS file
			cssPath := filepath.Join(pagesDir, slug+".css")
			if err := os.WriteFile(cssPath, []byte(page.CustomCSS), 0644); err == nil {
				generatedFiles = append(generatedFiles, filepath.ToSlash(filepath.Join("pages", slug+".css")))
			}

			// JS Code Behind file
			jsPath := filepath.Join(pagesDir, slug+".js")
			if err := os.WriteFile(jsPath, []byte(page.ScriptFront), 0644); err == nil {
				generatedFiles = append(generatedFiles, filepath.ToSlash(filepath.Join("pages", slug+".js")))
			}

			// JSON Components metadata file
			jsonPath := filepath.Join(pagesDir, slug+".json")
			if len(page.Components) > 0 {
				_ = os.WriteFile(jsonPath, page.Components, 0644)
				generatedFiles = append(generatedFiles, filepath.ToSlash(filepath.Join("pages", slug+".json")))
			}
		}

		// 4. Generate App Manifest
		manifestData, _ := json.MarshalIndent(payload, "", "  ")
		manifestPath := filepath.Join(absOutputDir, "manifest.json")
		_ = os.WriteFile(manifestPath, manifestData, 0644)
		generatedFiles = append(generatedFiles, "manifest.json")

		// 5. Generate Standalone index.html Runner
		indexPath := filepath.Join(absOutputDir, "index.html")
		indexHTML := generateStandaloneIndexHTML(payload, req.Port)
		_ = os.WriteFile(indexPath, []byte(indexHTML), 0644)
		generatedFiles = append(generatedFiles, "index.html")

		// 6. Generate Quick Standalone Run Scripts
		runBatContent := fmt.Sprintf("@echo off\r\necho Menjalankan %s pada port %d...\r\nstart http://localhost:%d\r\npython -m http.server %d\r\npause\r\n", payload.App.Name, req.Port, req.Port, req.Port)
		_ = os.WriteFile(filepath.Join(absOutputDir, "run.bat"), []byte(runBatContent), 0755)
		generatedFiles = append(generatedFiles, "run.bat")

		runShContent := fmt.Sprintf("#!/bin/bash\necho 'Menjalankan %s pada port %d...'\npython3 -m http.server %d\n", payload.App.Name, req.Port, req.Port)
		_ = os.WriteFile(filepath.Join(absOutputDir, "run.sh"), []byte(runShContent), 0755)
		generatedFiles = append(generatedFiles, "run.sh")

		// 7. Manage Dedicated HTTP Port Server if requested
		host := r.Host
		if colonIdx := strings.Index(host, ":"); colonIdx != -1 {
			host = host[:colonIdx]
		}
		liveURL := fmt.Sprintf("http://%s:%d", host, req.Port)

		status := BuildStatus{
			Port:      req.Port,
			AppSlug:   payload.App.Slug,
			AppName:   payload.App.Name,
			OutputDir: absOutputDir,
			URL:       liveURL,
			BuiltAt:   time.Now(),
			IsActive:  false,
		}

		if shouldServe {
			buildServersLock.Lock()
			if existingServer, exists := activeBuildServers[req.Port]; exists {
				slog.Info("[Build Server] Menghentikan runner lama pada port", "port", req.Port)
				_ = existingServer.Shutdown(context.Background())
				delete(activeBuildServers, req.Port)
			}

			// Create dedicated runner router for this port
			runnerRouter := chi.NewRouter()
			runnerRouter.Use(chimw.Recoverer)

			// Forward /api/* requests directly to main GoBudiBase backend router
			if mainHandler != nil {
				runnerRouter.Handle("/api/*", mainHandler)
			}

			// Static files handler with fallback to index.html for SPA
			fileServer := http.FileServer(http.Dir(absOutputDir))
			runnerRouter.HandleFunc("/*", func(w http.ResponseWriter, r *http.Request) {
				w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
				w.Header().Set("Pragma", "no-cache")
				w.Header().Set("Expires", "0")

				reqPath := filepath.Clean(r.URL.Path)
				targetPath := filepath.Join(absOutputDir, reqPath)
				info, err := os.Stat(targetPath)
				if err != nil || info.IsDir() {
					// Fallback to index.html for SPA client-side routes
					http.ServeFile(w, r, filepath.Join(absOutputDir, "index.html"))
					return
				}
				fileServer.ServeHTTP(w, r)
			})

			newServer := &http.Server{
				Addr:         fmt.Sprintf(":%d", req.Port),
				Handler:      runnerRouter,
				ReadTimeout:  15 * time.Second,
				WriteTimeout: 15 * time.Second,
			}

			activeBuildServers[req.Port] = newServer
			status.IsActive = true
			activeBuildMetadata[req.Port] = status
			buildServersLock.Unlock()

			go func(port int, srv *http.Server) {
				slog.Info("[Build Server] Runner aplikasi aktif", "port", port, "outputDir", absOutputDir, "url", liveURL)
				if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
					slog.Error("[Build Server] Error listener runner", "port", port, "err", err)
					buildServersLock.Lock()
					delete(activeBuildServers, port)
					if meta, ok := activeBuildMetadata[port]; ok {
						meta.IsActive = false
						activeBuildMetadata[port] = meta
					}
					buildServersLock.Unlock()
				}
			}(req.Port, newServer)
		}

		json.NewEncoder(w).Encode(BuildAppResponse{
			Success:    true,
			Message:    fmt.Sprintf("Build berhasil! %d halaman di-compile ke %s dan aktif di port %d", len(payload.Pages), absOutputDir, req.Port),
			AppSlug:    payload.App.Slug,
			AppName:    payload.App.Name,
			OutputDir:  absOutputDir,
			Port:       req.Port,
			URL:        liveURL,
			FileCount:  len(generatedFiles),
			PagesBuilt: len(payload.Pages),
			Files:      generatedFiles,
			BuiltAt:    time.Now().Format(time.RFC3339),
			Status:     status,
		})
	}
}

// HandleGetBuildStatus returns status of active port servers
func HandleGetBuildStatus() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		buildServersLock.Lock()
		defer buildServersLock.Unlock()

		portStr := r.URL.Query().Get("port")
		if portStr != "" {
			var port int
			fmt.Sscanf(portStr, "%d", &port)
			if status, ok := activeBuildMetadata[port]; ok {
				json.NewEncoder(w).Encode(status)
				return
			}
			json.NewEncoder(w).Encode(map[string]interface{}{"is_active": false, "port": port})
			return
		}

		list := make([]BuildStatus, 0)
		for _, s := range activeBuildMetadata {
			list = append(list, s)
		}
		json.NewEncoder(w).Encode(list)
	}
}

func generateDefaultPageHTML(title string, slug string, componentsRaw json.RawMessage) string {
	return fmt.Sprintf(`<!-- Standalone Build Page: %s (%s) -->
<div class="p-6 max-w-7xl mx-auto">
  <div class="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
    <div>
      <h1 class="text-2xl font-bold text-slate-800">%s</h1>
      <p class="text-xs text-slate-500 font-mono mt-0.5">Route: #/%s</p>
    </div>
    <div class="flex items-center gap-2">
      <button onclick="window.history.back()" class="px-3 py-1.5 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition">
        &larr; Kembali
      </button>
      <button onclick="window.location.reload()" class="px-3 py-1.5 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white transition">
        Refresh
      </button>
    </div>
  </div>

  <div id="page-body" class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
    <p class="text-sm text-slate-600">Form <strong>%s</strong> berhasil di-generate secara mandiri.</p>
  </div>
</div>`, title, slug, title, slug, title)
}

func generateStandaloneIndexHTML(payload RuntimeAppPayload, port int) string {
	menusJSON, _ := json.Marshal(payload.Pages)

	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>%s - Standalone App (Port %d)</title>
  <!-- Tailwind CSS & Font -->
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace'],
          }
        }
      }
    }
  </script>
  <style>
    body { font-family: 'Inter', sans-serif; background-color: #f8fafc; }
    /* Dynamic scoped page CSS slot */
  </style>
  <style id="dynamic-page-css"></style>
</head>
<body class="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased">

  <!-- ORACLE APEX REDWOOD TOP NAVIGATION -->
  <header class="h-14 bg-[#1e293b] border-b border-slate-700 flex items-center justify-between px-4 text-white shadow-md z-30 sticky top-0">
    <div class="flex items-center gap-3">
      <button id="btn-toggle-sidebar" class="p-1.5 rounded hover:bg-slate-700 text-slate-300 transition" title="Toggle Menu">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
      </button>
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-xs">
          HC
        </div>
        <div>
          <span class="font-bold text-sm tracking-wide text-slate-100">%s</span>
          <span class="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">Port %d</span>
        </div>
      </div>
    </div>

    <!-- Right Header Actions -->
    <div class="flex items-center gap-3 text-xs">
      <div class="hidden sm:flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 text-slate-300 font-mono text-[11px]">
        <span>Halaman:</span>
        <strong id="header-page-title" class="text-emerald-400 font-semibold">-</strong>
      </div>
      <div class="flex items-center gap-2 border-l border-slate-700 pl-3">
        <div class="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
          M
        </div>
        <div class="hidden md:flex flex-col text-left leading-tight">
          <span class="font-bold text-slate-200">Mukti Assary</span>
          <span class="text-[10px] text-slate-400 font-mono">IT000002</span>
        </div>
      </div>
    </div>
  </header>

  <!-- MAIN APP CONTAINER -->
  <div class="flex-1 flex overflow-hidden">
    <!-- LEFT SIDEBAR: MENU & FORMS -->
    <aside id="sidebar" class="w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 transition-all duration-200 overflow-hidden">
      <div class="p-3 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
        <span class="flex items-center gap-1.5 text-slate-300">
          <svg class="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h7"/></svg>
          Navigasi Menu
        </span>
        <span class="bg-slate-800 px-1.5 py-0.5 rounded font-mono text-emerald-400 text-[10px]">%d Pages</span>
      </div>
      <!-- Quick Filter -->
      <div class="p-2 border-b border-slate-800/80 bg-slate-950/40">
        <div class="relative">
          <input
            id="sidebar-search"
            type="text"
            placeholder="Cari menu & form..."
            class="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded px-2.5 py-1.5 pl-7 text-xs outline-none focus:border-emerald-500 placeholder-slate-500"
          />
          <svg class="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
      </div>
      <nav id="menu-container" class="flex-1 p-2 flex flex-col gap-1 text-xs overflow-y-auto">
        <!-- Rendered dynamically -->
      </nav>
      <div class="p-2.5 border-t border-slate-800 text-[10px] text-slate-500 font-mono text-center flex items-center justify-between">
        <span>GoBudiBase Standalone</span>
        <span class="text-emerald-500 font-bold">Port %d</span>
      </div>
    </aside>

    <!-- CONTENT VIEWPORT -->
    <main class="flex-1 overflow-y-auto bg-slate-50 flex flex-col relative" id="app-viewport">
      <div id="loading-spinner" class="hidden absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-20">
        <div class="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl shadow-lg text-xs font-semibold">
          <svg class="animate-spin h-4 w-4 text-emerald-400" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
          <span>Memuat Halaman...</span>
        </div>
      </div>
      <div id="page-root" class="flex-1 w-full"></div>
    </main>
  </div>

  <!-- CLIENT-SIDE ROUTER & RUNTIME LOADER -->
  <script>
    const PAGES_DATA = %s;
    const DEFAULT_PAGE = PAGES_DATA.find(p => p.is_home) || PAGES_DATA[0] || { slug: 'login', title: 'Login' };

    // Built-in API Client for database operations from the built app
    window.PIMS_API = {
      baseURL: '/api/v1',
      async request(endpoint, options = {}) {
        const url = this.baseURL + endpoint;
        const res = await fetch(url, {
          headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
          ...options
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(err.error || res.statusText);
        }
        return res.json();
      },
      login(username, password) {
        return this.request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
      },
      query(sql, limit = 100) {
        return this.request('/builder/query/execute', { method: 'POST', body: JSON.stringify({ sql, limit }) });
      },
      batch(table, ops) {
        return this.request('/builder/batch', { method: 'POST', body: JSON.stringify({ table, ops }) });
      }
    };

    let collapsedGroups = {};
    window.toggleGroup = function(grp) {
      collapsedGroups[grp] = !collapsedGroups[grp];
      renderSidebar(window.location.hash.replace('#/', '') || DEFAULT_PAGE.slug);
    };

    // Render Sidebar Menu
    function renderSidebar(activeSlug) {
      const container = document.getElementById('menu-container');
      const searchEl = document.getElementById('sidebar-search');
      const searchTerm = (searchEl ? searchEl.value : '').toLowerCase().trim();

      const groups = {};
      PAGES_DATA.forEach(p => {
        if (searchTerm) {
          const matchTitle = (p.title || '').toLowerCase().includes(searchTerm);
          const matchSlug = (p.slug || '').toLowerCase().includes(searchTerm);
          const matchGroup = (p.group_name || '').toLowerCase().includes(searchTerm);
          if (!matchTitle && !matchSlug && !matchGroup) return;
        }
        const grp = p.group_name || 'Menu Utama';
        if (!groups[grp]) groups[grp] = [];
        groups[grp].push(p);
      });

      let html = '';
      for (const [groupName, pages] of Object.entries(groups)) {
        const isCollapsed = !!collapsedGroups[groupName] && !searchTerm;
        html += '<div class="flex flex-col gap-0.5 mb-1.5">';
        html += '<button type="button" onclick="window.toggleGroup(\'' + groupName.replace(/'/g, "\\'") + '\')" class="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition cursor-pointer text-left">';
        html += '<span class="flex items-center gap-1 truncate">';
        html += '<svg class="w-3 h-3 text-slate-500 transition-transform ' + (isCollapsed ? '' : 'rotate-90') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>';
        html += '<span class="truncate">' + groupName + '</span>';
        html += '</span>';
        html += '<span class="bg-slate-800 px-1 py-0.2 rounded font-mono text-[9px] text-slate-400">' + pages.length + '</span>';
        html += '</button>';

        if (!isCollapsed) {
          html += '<div class="flex flex-col gap-0.5 pl-2 border-l border-slate-800/80 ml-2">';
          pages.forEach(p => {
            const isActive = p.slug === activeSlug;
            const isSub = !!p.parent_slug;
            const activeClass = isActive ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800';
            const indentClass = isSub ? 'pl-3 text-[11px]' : 'px-2 text-xs';
            html += '<a href="#/' + p.slug + '" class="flex items-center gap-1.5 py-1.5 rounded transition ' + indentClass + ' ' + activeClass + '" title="' + p.title + '">';
            if (isSub) {
              html += '<span class="text-teal-400 font-bold text-[10px] shrink-0">↳</span>';
            }
            html += '<span class="truncate">' + p.title + '</span>';
            html += '</a>';
          });
          html += '</div>';
        }
        html += '</div>';
      }
      container.innerHTML = html;
    }

    // Bind sidebar search event
    setTimeout(() => {
      const searchEl = document.getElementById('sidebar-search');
      if (searchEl) {
        searchEl.addEventListener('input', () => {
          renderSidebar(window.location.hash.replace('#/', '') || DEFAULT_PAGE.slug);
        });
      }
    }, 100);

    // Load Page into Viewport
    async function loadPage(slug) {
      const page = PAGES_DATA.find(p => p.slug === slug) || DEFAULT_PAGE;
      document.getElementById('header-page-title').textContent = page.title;
      renderSidebar(page.slug);

      const spinner = document.getElementById('loading-spinner');
      const root = document.getElementById('page-root');
      spinner.classList.remove('hidden');

      try {
        // 1. Fetch Page HTML
        const htmlRes = await fetch('pages/' + page.slug + '.html?_t=' + Date.now());
        const html = htmlRes.ok ? await htmlRes.text() : '<div class="p-8 text-center text-rose-500">Gagal memuat template halaman ' + page.slug + '</div>';

        // 2. Fetch Page CSS
        const cssRes = await fetch('pages/' + page.slug + '.css?_t=' + Date.now());
        const css = cssRes.ok ? await cssRes.text() : '';
        document.getElementById('dynamic-page-css').textContent = css;

        // 3. Inject HTML
        root.innerHTML = html;

        // 4. Fetch & Execute Page Code Behind JavaScript
        const oldScript = document.getElementById('page-script-exec');
        if (oldScript) oldScript.remove();

        const jsRes = await fetch('pages/' + page.slug + '.js?_t=' + Date.now());
        if (jsRes.ok) {
          const js = await jsRes.text();
          if (js.trim()) {
            const scriptEl = document.createElement('script');
            scriptEl.id = 'page-script-exec';
            scriptEl.textContent = '(function(){\n' + js + '\n})();';
            document.body.appendChild(scriptEl);
          }
        }
      } catch (err) {
        console.error('Error loading page:', err);
        root.innerHTML = '<div class="p-8 text-rose-500">Error: ' + err.message + '</div>';
      } finally {
        spinner.classList.add('hidden');
      }
    }

    // Routing Controller
    function handleHashChange() {
      const hash = window.location.hash.replace(/^#\/?/, '');
      const slug = hash || DEFAULT_PAGE.slug;
      loadPage(slug);
    }

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('DOMContentLoaded', () => {
      handleHashChange();

      // Sidebar Toggle
      const toggleBtn = document.getElementById('btn-toggle-sidebar');
      const sidebar = document.getElementById('sidebar');
      if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
          sidebar.classList.toggle('-ml-64');
        });
      }
    });
  </script>
</body>
</html>`, payload.App.Name, port, payload.App.Name, port, len(payload.Pages), string(menusJSON))
}
