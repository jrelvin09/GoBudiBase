# Rencana Migrasi & Integrasi Komponen Barebone-SQL ke GoBudiBase

Target: Mengadopsi modul Oracle APEX (Interactive Report, Interactive Grid, Form Controls, Visual Designer, Batch Save) dari `C:\fun\barebone-sql\frontend` ke `c:\fun\supabase\GoBudiBase`.
Prinsip: Native-first Ponytail, zero Docker bloat, $0 open-source, performa maksimal.

---

## Ringkasan Fase

| Fase | Deskripsi | Target Direktori | Status |
|---|---|---|---|
| 1 | Fondasi & UI Primitives (Bits-UI / Shadcn) | `web-svelte/src/lib/components/ui/` | [x] Selesai |
| 2 | Enterprise Form Molecules (Popup LOV, Shuttle, Kanban, Calendar) | `web-svelte/src/lib/kit/molecules/` & `lib/apex/` | [x] Selesai |
| 3 | Oracle APEX Interactive Report (IR) Engine | `web-svelte/src/lib/kit/organisms/ir/` | [x] Selesai |
| 4 | Oracle APEX Interactive Grid (IG) & Go Backend Batch API | `web-svelte/src/lib/kit/organisms/ig/` & `internal/handlers/` | [x] Selesai |
| 5 | Palette & Dynamic Runtime Integration | `web-svelte/src/lib/studio/` & `web-svelte/src/lib/runtime/` | [x] Selesai |
| 6 | Verifikasi, Dev Lokal, Deploy 106 & GitHub Sync | Server `10.10.1.106` & GitHub | [x] In Progress |

---

## Detail Langkah Eksekusi (Junior-Friendly)

### Fase 1: Fondasi & UI Primitives
- [x] 1.1 Cek dan pasang dependensi minimal yang dibutuhkan:
  - `bits-ui` (untuk dialog & popover accessible tanpa bloat).
  - `tailwind-variants` dipasang di `web-svelte/package.json`.
- [x] 1.2 Copy komponen primitive `src/lib/components/ui/` dari barebone-sql:
  - `dialog/`, `dropdown-menu/`, `popover/`, `select/`, `switch/`, `sheet/`, `badge/`, `button/`, `card/`.
- [x] 1.3 Verifikasi TypeScript dan path alias (`$lib/...`).

### Fase 2: Enterprise Form Controls & Molecules
- [x] 2.1 Copy molekul kontrol Oracle APEX dari `C:\fun\barebone-sql\frontend\src\lib\kit\molecules/`:
  - `PopupLovItem.svelte`: Modal LOV search picker untuk relasi foreign key.
  - `Shuttle.svelte`: Selector dual-listbox (pindah item kiri-kanan).
  - `DatePickerItem.svelte` & `ColorPickerItem.svelte`.
  - `Rating.svelte`.
- [x] 2.2 Copy organism visualisasi & timeline:
  - `MonthCalendar.svelte`.
  - `KanbanBoard.svelte` (di `src/lib/apex/KanbanBoard.svelte` dengan live server sync).
  - `HistoryTimeline.svelte`.
- [x] 2.3 Copy pure SVG zero-dependency charts:
  - `chart/` (`BarChart`, `LineChart`, `PieChart`, `Sparkline`, `chart-scale.ts`).

### Fase 3: Oracle APEX Interactive Report (IR) Engine
- [x] 3.1 Copy engine kalkulasi in-memory:
  - `src/lib/kit/organisms/ir/model.ts` (18.8 KB logic filter, aggregate, pivot, highlight).
  - `src/lib/kit/organisms/ir/types.ts`.
- [x] 3.2 Copy komponen view & toolbar IR:
  - `ReportTable.svelte`, `SearchBar.svelte`, `SettingsChips.svelte`, `Pagination.svelte`, `ActionsMenu.svelte`.
- [x] 3.3 Copy modal dialog kontrol APEX:
  - `FilterDialog.svelte` (18 operator filter).
  - `AggregateDialog.svelte` (Sum, Avg, Count, Min, Max).
  - `ComputeDialog.svelte` (rumus kolom baru).
  - `HighlightDialog.svelte` (conditional styling).
  - `GroupByDialog.svelte` & `PivotDialog.svelte`.
  - `ChartDialog.svelte` & `ChartView.svelte`.
  - `DownloadDialog.svelte` (ekspor data).
  - `SaveReportDialog.svelte` (simpan report state).
- [x] 3.4 Wire-up region renderer `InteractiveReport.svelte` di GoBudiBase.

### Fase 4: Oracle APEX Interactive Grid (IG) & Backend Batch Save
- [x] 4.1 Copy organism IG:
  - `src/lib/kit/organisms/ig/model.ts` (state tracking dirty rows, diffs, atomic revert).
  - `src/lib/kit/organisms/ig/Grid.svelte` & `GridToolbar.svelte`.
  - `src/lib/kit/organisms/ig/CellEditor.svelte` & `RowActionsMenu.svelte`.
  - `src/lib/kit/organisms/ig/keyboard.ts` (navigasi Excel: panah, Tab, Enter, Esc).
  - `src/lib/kit/organisms/ig/paste.ts` (paste langsung dari clipboard Excel/TSV).
- [x] 4.2 Tambahkan API Handler `POST /api/v1/builder/batch` & `POST /api/v1/r/{res}/_batch` di Go daemon (`internal/handlers/builder.go`):
  - Menerima batch payload `{ "ops": [ { "op": "create|update|delete", "table": "...", ... } ] }`.
  - Menjalankan seluruh operasi dalam 1 transaksi `tx.Begin(ctx)`. Rollback otomatis jika ada 1 error.
- [x] 4.3 Daftarkan route `/api/v1/builder/batch` di `cmd/server/main.go`.

### Fase 5: Visual Page Designer & Dynamic Runtime Integration
- [x] 5.1 Daftarkan jenis komponen baru di metadata PostgreSQL:
  - `kanban_board`, `shuttle_selector`, `popup_lov`.
- [x] 5.2 Hubungkan ke `PageDesigner.svelte`:
  - Tambahkan icon dan item baru di Component Palette (`Kanban Workflow Board`, `Shuttle Dual Listbox`, `Popup LOV`).
- [x] 5.3 Perbarui `DynamicAppRuntime.svelte`:
  - Render komponen asli saat runtime: jika tipe `kanban_board` render `KanbanBoard`, jika `shuttle_selector` render `ShuttleSelector`, jika `popup_lov` render `PopupLovDemo`.

### Fase 6: Verifikasi, Build & Deploy Pipeline
- [x] 6.1 Jalankan `npm run build` di `web-svelte`. Lolos tanpa error (100% clean).
- [ ] 6.2 Jalankan `deploy-and-sync.ps1` untuk:
  - Build frontend SvelteKit SPA.
  - Cross-compile binary Go native (Windows `server.exe` & Linux `gobudibase`).
  - Deploy ke server `10.10.1.106` (`/usr/local/bin/gobudibase` & `/var/www/gobudibase/`).
  - Verifikasi live status via HTTP curl.
  - Push commit ke GitHub `jrelvin09/GoBudiBase`.
