# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## Platform: GoBudiBase (Next-Gen Native APEX Enterprise Engine)
### Stack: Go 1.23+ • SvelteKit 2 (Static Adapter) • Tailwind CSS v4 • shadcn-svelte • PostgreSQL 17.11

---

| Parameter | Spesifikasi |
|---|---|
| **Dokumen ID** | `PRD-GOB-2026-001` |
| **Status** | **APPROVED / READY FOR IMPLEMENTATION** |
| **Referensi Blueprint** | `c:\fun\supabase\GoBudiBase\bp1.txt` |
| **Target Host** | `10.10.1.106` (Ubuntu 24.04 noble, 4 vCPU, 7.8 GiB RAM) |
| **Lisensi Software** | **$0 (100% Free Open Source / Self-Hosted)** |
| **Tanggal Efektif** | 31 Oktober 2026 |

---

## 1. Executive Summary & Problem Statement

### 1.1 Latar Belakang Masalah (Eksisting Stack)
SupaBudibase saat ini telah mencapai paritas fungsional 100% terhadap Oracle APEX menggunakan kombinasi Budibase v3.50 (Node.js Koa) + PostgREST + React Grid SPA + PostgreSQL 17.11. Meskipun fungsionalitas dan keamanan (nftables + CDC audit) sudah terbukti lulus uji UAT & k6, tumpukan teknologi eksisting memiliki bottleneck runtime:
1. **Memory Bloat**: Node.js apps & worker daemons + PostgREST mengonsumsi **~580 MB hingga 950 MB RAM** bahkan pada kondisi idle.
2. **Dependensi Pihak Ketiga**: Membutuhkan CouchDB/PouchDB internal dan SeaweedFS daemon tambahan hanya untuk metadata antarmuka.
3. **Cold Start & Reboot Time**: Restart service membutuhkan 5 - 8 detik.
4. **Virtual DOM Overhead**: React runtime pada client menambah overhead memori pada dataset virtual scroll besar.

### 1.2 Visi & Solusi: GoBudiBase
Mentransformasi seluruh runtime Budibase Node.js dan PostgREST menjadi **Single Native Go Daemon Binary** (`gobudibase`) dipadukan dengan **SvelteKit Static SPA** (`@sveltejs/adapter-static`) dan design system **shadcn-svelte**:
* **Backend**: Go binary tunggal (<30 MB RAM, startup <20ms, >18.000 req/s, koneksi pooling `pgx/v5` langsung ke PostgreSQL 17).
* **Frontend**: SvelteKit 2 + Svelte 5 (Runes, Zero Virtual DOM) diekspor sebagai file statis murni yang di-serve langsung oleh Nginx (atau di-embed ke binary Go via `embed.FS`).
* **Database**: PostgreSQL 17.11 eksisting dengan 23 migrasi SQL aktif dipertahankan 100% tanpa perubahan skema maupun data migration.

---

## 2. Goals & Success Metrics (OKRs & KPIs)

### 2.1 Key Performance Indicators (KPIs)
* **RAM Footprint Backend**: $\le$ **35 MB RSS** (Penurunan 95% dari eksisting ~580 MB).
* **Latency SLA (p95)**:
  * Read / List / Aggregation : $\le$ **5.0 ms** (under 10 VU).
  * 2D Pivot Matrix (100k data): $\le$ **25.0 ms** (vs eksisting ~90 ms).
  * Dynamic Actions RPC       : $\le$ **8.0 ms** (vs eksisting ~13 ms).
* **Throughput Capacity**: $\ge$ **15.000 req/s** pada hardware 4 vCPU.
* **Error Rate**: **0.00%** di bawah beban uji stres k6 (50 VU concurrent).
* **Build Artifact**:
  * Binary Backend: Single static ELF binary $\le$ **25 MB**.
  * Frontend Bundle: Static assets $\le$ **3.5 MB** (pre-compressed Gzip & Brotli).
* **Total License Cost**: **$0.00** (Bebas royalti, tanpa vendor lock-in).

---

## 3. User Personas & Key User Journeys

### 3.1 Personas
1. **Operator Aset / Data Admin (`dataadmin@company.com`)**:
   - Membutuhkan antarmuka grid ultra-responsif 60fps untuk entry ribuan data aset, edit inline cepat, copy-paste bolak-balik dari spreadsheet Excel, dan lookup modal cepat (Popup LOV).
2. **Pejabat Persetujuan / Approver (`approver@company.com`)**:
   - Memantau timeline SLA dan antrean tiket persetujuan pengadaan melalui kalender & Gantt, melakukan verifikasi fisik, menandatangani digital serah terima (Signature Pad), dan mencetak bukti sah (BAST PDF).
3. **Direktur Keuangan / Auditor (`admin@company.com`)**:
   - Menganalisis sebaran nilai aset melalui matriks pivot dinamis cross-tab 2D, memetakan aset pada peta geografis kampus (GIS Map), dan mengunduh laporan audit eksekutif resmi A4 landscape.
4. **DevOps / Sysadmin (`mukti`)**:
   - Mengoperasikan sistem tanpa kerumitan container Docker, cukup 1 binary systemd Go + 1 folder static Nginx, backup WAL kontinu, dan jaminan rollback instan (<5 detik).

---

## 4. Functional Requirements (FR)

### FR-1: High-Density Interactive Grid (Replikasi APEX IG)
* **FR-1.1**: Virtual scrolling 60fps mampu merender dataset 100.000 baris tanpa lag memori browser.
* **FR-1.2**: Single-cell inline edit (klik ganda atau tekan Enter) dengan visual indicator status perubahan (*dirty cell*).
* **FR-1.3**: Multi-cell batch save: Operator dapat mengedit banyak baris sekaligus dan menyimpan secara atomik dalam 1 transaksi via Go endpoint `/api/v1/registry/batch`.
* **FR-1.4**: 2-Way Excel Clipboard: Operator dapat melakukan `Ctrl+C` dan `Ctrl+V` rentang sel berformat TSV dari/ke Microsoft Excel.
* **FR-1.5**: Dynamic Aggregation Footer: Menampilkan kalkulasi instan SUM, AVG, dan COUNT yang dihitung native di database PostgreSQL.
* **FR-1.6**: Saved Reports: Pengguna dapat menyimpan konfigurasi grid (sorting, filter, susunan kolom) ke tabel `app.grid_reports`.

### FR-2: Dynamic Pivot / Cross-Tab Matrix (Replikasi APEX IR Pivot)
* **FR-2.1**: Pemilih Dimensi Baris dinamis (Kategori, Status Operasional, Gedung Kampus).
* **FR-2.2**: Pemilih Dimensi Kolom dinamis (Status Operasional, Kategori, Gedung Kampus).
* **FR-2.3**: Pemilih Metrik Agregasi: `SUM(Nilai Rp)`, `COUNT(*)`, dan `AVG(Nilai Rp)`.
* **FR-2.4**: Heatmap Intensity Shading: Pewarnaan sel dinamis berbasis rasio nilai terhadap nilai maksimum.
* **FR-2.5**: Total Baris, Total Kolom, dan Grand Total teragregasi otomatis.
* **FR-2.6**: Interactive Drilldown Drawer: Klik pada sel matriks langsung membuka slide-over panel yang menampilkan 50 record detail aset terkait.
* **FR-2.7**: Ekspor Matriks ke Excel (`.xlsx`) dan PDF.

### FR-3: Declarative Dynamic Actions Visual Engine (Replikasi APEX DA)
* **FR-3.1**: Registry Aturan berbasis Database: Membaca aturan dari tabel `app.dynamic_action_rules`.
* **FR-3.2**: Event Triggers: Mendeteksi event `change`, `threshold`, `blur`, dan `click`.
* **FR-3.3**: Client-Side Actions: Auto-highlight (ubah styling/border), lock/disable field, dan trigger peringatan Toast (sonner).
* **FR-3.4**: Server-Side Actions: Pemanggilan RPC Go asinkron:
  * `check_compliance_sla`: Menghitung tier approval (Direksi vs Kadiv) dan batas jam SLA.
  * `auto_depreciate`: Kalkulasi straight-line nilai buku aset dan akumulasi penyusutan.
  * `trigger_maintenance_ticket`: Pembuatan otomatis tiket teknisi ke antrean outbox notifikasi.
* **FR-3.5**: Interactive Action Sandbox: Formulir simulasi langsung untuk menguji firing event.
* **FR-3.6**: Real-Time Event Inspector: Terminal logging real-time mencatat waktu eksekusi (latency stopwatch ms) dan respons JSON server.

### FR-4: Enterprise Form Controls
* **FR-4.1**: Popup LOV (List of Values): Modal dialog pencarian relasional multi-kolom dari 100k data dengan pagination dan live text filter.
* **FR-4.2**: Currency Mask Input: Format otomatis Rupiah Indonesia (`Rp 15.000.000`) dengan sinkronisasi nilai numerik mentah ke state form.
* **FR-4.3**: Digital Signature Pad: Kanvas HTML5 touch/mouse untuk menangkap tanda tangan basah digital, menghasilkan format Base64 PNG.

### FR-5: Visualisasi Kalender, Gantt & Spatial GIS
* **FR-5.1**: Calendar View: Kalender bulanan visualisasi jatuh tempo SLA tiket persetujuan.
* **FR-5.2**: Gantt Timeline Mode: Toggle ke tampilan timeline horizontal untuk tracking durasi tahapan tiket pengadaan.
* **FR-5.3**: Interactive GIS Map: Peta 10 fasilitas gedung kampus Jakarta menggunakan Leaflet/OpenStreetMap dengan marker cluster dan popup valuasi aset.
* **FR-5.4**: Hierarchical Tree View: Navigasi visual hierarki 3-tingkat (Kampus $\rightarrow$ Gedung $\rightarrow$ Lantai) dengan rekap jumlah dan nilai aset.
* **FR-5.5**: Faceted Search Sidebar: Filter dinamis multi-kategori dengan live counter baris data real-time.

### FR-6: Native Enterprise PDF Report Exporter
* **FR-6.1**: Multi-Page Landscape Executive Audit Report:
  * Kop Surat Resmi Kementerian BUMN / Republik Indonesia & Nomor Registrasi Dokumen.
  * Kotak Ringkasan KPI Eksekutif (Total Aset, Valuasi IDR, Rasio Operasional).
  * AutoTable berpaginasi otomatis dengan zebra striping, nomor urut, dan format mata uang.
  * Blok Pengesahan 3 Tanda Tangan Resmi (Petugas Aset, Auditor, Direktur).
* **FR-6.2**: Formal 1-Page BAST (Berita Acara Serah Terima):
  * Sertifikat legal serah terima inventaris aset 1 lembar A4 portrait.
  * Integrasi langsung stempel tanda tangan digital hasil kanvas Signature Pad.

---

## 5. Non-Functional Requirements (NFR)

### 5.1 Performa & Skalabilitas (Performance)
* **Koneksi Database**: Menggunakan pool koneksi native `pgxpool` Go (Max 30, Min 5 koneksi), tanpa overhead TCP handshake berulang.
* **Zero Allocation Routing**: Router HTTP menggunakan `go-chi/chi/v5` dengan alokasi memori mendekati nol.
* **Frontend Compilation**: SvelteKit menggunakan Svelte 5 compiler; rendering DOM dilakukan secara bedah (fine-grained surgical updates) tanpa overhead diffing Virtual DOM.

### 5.2 Keamanan Perimeter & Otorisasi (Security)
* **Firewall Linux (`nftables`)**: Host dilindungi kebijakan default DROP; hanya port 22 (SSH), 80 (HTTP redirect), dan 443 (HTTPS) yang terbuka.
* **JWT Authentication**: Setiap request API memvalidasi header `Authorization: Bearer <token>` menggunakan HMAC-SHA256 di layer Go middleware.
* **Anti Actor-Spoofing**: Fungsi PL/pgSQL memvalidasi peran actor pengguna via `app.assert_role` di tingkat database.
* **Tamper-Proof Audit Trail**: Seluruh operasi DML (INSERT, UPDATE, DELETE) tercatat secara append-only di schema `audit.logged_actions` dengan pencegahan mutlak operasi TRUNCATE/DELETE.

### 5.3 Keandalan & Disaster Recovery (Reliability & DR)
* **Zero Data Loss (RPO = 0)**: Continuous WAL Archiving aktif mengarsipkan segmen transaksi PostgreSQL secara real-time ke `/var/backups/postgres/wal/`.
* **Rapid Recovery (RTO $\le$ 1 Menit)**: Kemampuan restore database 779k baris terbukti selesai dalam 30,6 detik.
* **Zero-Downtime Rollback**: Kemampuan berpindah kembali ke stack lama via swap konfigurasi Nginx dalam waktu < 5 detik.

---

## 6. Technical Architecture & API Surface

### 6.1 Backend API Specification (Go Native)

Base Path: `/api/v1`

| Method | Endpoint | Fungsi Stored Procedure PostgreSQL | Deskripsi |
|---|---|---|---|
| `POST` | `/registry/list` | `api.list_registry(limit, offset, col, dir, filters)` | Paginasi & sorting master aset 100k data |
| `POST` | `/registry/count` | `api.count_registry(filters)` | Total baris aset terfilter |
| `POST` | `/registry/update` | `api.update_registry_cell(id, col, val, actor)` | Edit 1 sel nilai |
| `POST` | `/registry/batch` | `api.batch_update_registry(changes, actor)` | Simpan massal perubahan multi-baris atomik |
| `POST` | `/registry/aggregate`| `api.aggregate_registry(col, fn, filters)` | Agregasi footer (SUM/AVG/COUNT) |
| `POST` | `/pivot` | `api.get_registry_pivot(row, col, metric, filters)` | Hitung matriks pivot 2D dinamis |
| `POST` | `/actions/rules` | `api.list_dynamic_action_rules()` | Ambil daftar aturan event aktif |
| `POST` | `/actions/execute` | `api.execute_dynamic_action(type, payload)` | Eksekusi aksi server (SLA, depresiasi) |
| `POST` | `/reports/save` | `api.save_grid_report(user, name, config)` | Simpan konfigurasi report user |
| `POST` | `/reports/load` | `api.load_grid_reports(user)` | Muat konfigurasi report user |
| `POST` | `/spatial/map` | `api.get_map_locations()` | Lokasi spasial 10 gedung kampus & aset |
| `POST` | `/spatial/tree` | `api.get_location_tree()` | Struktur pohon rekursif fasilitas |
| `POST` | `/facets` | `api.get_registry_facets(filters)` | Hitung counter dinamis facet |
| `POST` | `/calendar/events`| `api.list_calendar_events()` | Jadwal SLA dan alur persetujuan tiket |

### 6.2 Frontend Technology Matrix

| Kategori | Pilihan Teknologi | Versi | Alasan Pemilihan |
|---|---|---|---|
| **Core Framework** | SvelteKit / Svelte 5 | `^2.16` / `^5.0` | Zero Virtual DOM, Runes reaktif, ukuran bundle terkecil |
| **Adapter** | `@sveltejs/adapter-static` | `^3.0` | Output 100% static files untuk Nginx / Go embed |
| **CSS Framework** | Tailwind CSS | `^4.0` | Utility-first styling modern & performa tinggi |
| **UI Component Kit** | `shadcn-svelte` (Bits UI) | `latest` | Headless accessible components, copy-paste ownership |
| **Icons** | `lucide-svelte` | `^0.468` | Icon set enterprise lengkap |
| **PDF Engine** | `jspdf` + `jspdf-autotable` | `^4.2` / `^5.0` | Render laporan resmi & tanda tangan digital di client ($0) |
| **Excel Parser** | `xlsx` (SheetJS) | `^0.18` | Ekspor & parsing data spreadsheet lokal |

---

## 7. Phased Implementation Roadmap

```
+-----------------------------------------------------------------------------------+
| JADWAL EKSEKUSI MIGRASI (TOTAL ESTIMASI: 5 TAHAP)                                 |
+-----------------------------------------------------------------------------------+
| Tahap 1: Go Scaffolding & Database Connection Pool             [===       ] M-1   |
| Tahap 2: Implementasi 14 Go HTTP RPC Handlers                  [======    ] M-2   |
| Tahap 3: Inisialisasi SvelteKit Static + shadcn-svelte UI Shell [========  ] M-3   |
| Tahap 4: Porting 8 Komponen APEX Parity ke Svelte 5            [==========] M-4   |
| Tahap 5: Dual-Route Deploy, k6 Stress Test, & Production Cutover[==========] M-5   |
+-----------------------------------------------------------------------------------+
```

### Rincian Deliverables per Tahap:
* **Tahap 1 (Scaffolding Backend)**:
  - Setup folder `c:\fun\supabase\GoBudiBase`.
  - Inisialisasi Go module: `go mod init gobudibase`.
  - Konfigurasi `pgxpool` ke PostgreSQL port `54322`.
* **Tahap 2 (API Handlers Parity)**:
  - Bangun 14 HTTP handlers memetakan fungsi PostgreSQL `api.*`.
  - Kompilasi binary ELF Linux: `bin/gobudibase`.
  - Uji via curl: Validasi 100% kesesuaian output JSON terhadap PostgREST eksisting.
* **Tahap 3 (Frontend Shell)**:
  - Inisialisasi SvelteKit static: `npx sv create web-svelte`.
  - Setup Tailwind CSS v4 dan shadcn-svelte (`components.json`).
  - Bangun master layout, top global navigation, dan theme switcher.
* **Tahap 4 (Porting APEX Modules)**:
  - Porting Interactive Grid, Pivot Matrix, Dynamic Actions Engine, Popup LOV, Currency Input, Signature Pad, Calendar Gantt, Spatial Map, Faceted Search, Tree View, dan PDF Exporter.
  - Compile static bundle: `npm run build` -> folder `/build`.
* **Tahap 5 (Verification & Production Cutover)**:
  - Deploy service systemd `gobudibase.service` pada server `10.10.1.106` (:8080).
  - Konfigurasi Nginx sub-path `/v2/` untuk pengujian live berdampingan.
  - Eksekusi stress test k6 membandingkan latency & resource Go vs Node.
  - Cutover Nginx root `/` dan non-aktifkan service Budibase Node.js lama.

---

## 8. Acceptance Criteria & Definition of Done (DoD)

Sistem GoBudiBase dinyatakan lulus uji produksi apabila memenuhi kriteria absolut:
1. **Fungsionalitas**: Seluruh 20 skenario UAT APEX Suite lulus 100% tanpa defect terbuka tingkat P1/P2.
2. **Performa**: Hasil uji k6 menunjukkan error rate **0.00%** dengan latensi agregat p95 **< 10 ms**.
3. **Efisiensi Memori**: Penggunaan RAM daemon Go di server `10.10.1.106` terbukti **< 35 MB**.
4. **Keutuhan Data**: 100.000 data aset, relasi lokasi kampus, dan log audit tidak mengalami perubahan skema maupun kehilangan record.
5. **Kemandirian Lisensi**: Seluruh pustaka berlisensi MIT, Apache 2.0, BSD, atau PostgreSQL License ($0 total software cost).
6. **Kesiapan Rollback**: Prosedur rollback telah teruji mampu mengembalikan sistem ke stack lama dalam waktu < 15 detik.

---

## 9. Risk Matrix & Mitigasi

| Risiko Potensial | Dampak | Probabilitas | Rencana Mitigasi |
|---|---|---|---|
| **Perbedaan format payload JSON antara Go dan PostgREST** | Sedang | Rendah | Menggunakan `json.RawMessage` langsung dari output query PostgreSQL (`jsonb_agg` / `jsonb_build_object`). |
| **Koneksi pool database habis saat lonjakan traffic** | Tinggi | Rendah | Konfigurasi `pgxpool.MaxConns = 30` dengan `MaxConnIdleTime` presisi sesuai kapasitas PostgreSQL. |
| **SvelteKit Static adapter routing 404 pada deep link browser** | Sedang | Rendah | Konfigurasi `fallback: 'index.html'` di `svelte.config.js` dan direktif `try_files $uri $uri/ /index.html` di Nginx. |
| **Kegagalan saat cutover produksi** | Tinggi | Sangat Rendah | Dual-routing paralel via Nginx (`/v2/`) memungkinkan verifikasi 100% tuntas sebelum traffic dialihkan. |

---

*Dokumen ini merupakan spesifikasi resmi pengembangan arsitektur GoBudiBase.*  
*Tersimpan pada: `c:\fun\supabase\GoBudiBase\prd1.md`*
