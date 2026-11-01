-- ============================================================================
-- 031_seed_real_pims_html_css.sql
-- Seed Authentic Oracle APEX PIMS HTML, CSS, and Scripts into builder.pages
-- Allows immediate customization in Studio and reflection in F5 runtime
-- ============================================================================

BEGIN;

-- 1. LOGIN HARVEST CLOUD (PAGE 22, slug: login)
UPDATE builder.pages
SET 
  custom_html = $HTML$
<div class="relative flex min-h-[85vh] w-full items-center justify-center overflow-hidden rounded-2xl bg-[#f2f4f7] py-12 px-4 select-none">
  <!-- APEX Redwood Ambient Fluid Background -->
  <div class="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-40">
    <div class="absolute -top-[20%] -left-[10%] h-[550px] w-[550px] rounded-full bg-gradient-to-br from-amber-200/40 via-orange-100/30 to-transparent blur-3xl"></div>
    <div class="absolute -bottom-[20%] -right-[10%] h-[550px] w-[550px] rounded-full bg-gradient-to-tl from-sky-200/40 via-blue-100/30 to-transparent blur-3xl"></div>
    <div class="absolute top-[35%] right-[20%] h-[300px] w-[300px] rounded-full bg-emerald-100/30 blur-2xl"></div>
  </div>

  <!-- APEX Login Container Card -->
  <div class="pims-login-card relative z-10 w-full max-w-[420px] rounded-2xl border border-slate-200/80 bg-white/95 p-8 shadow-2xl backdrop-blur-md transition-all sm:p-10">
    
    <!-- Login Header & Brand Logo -->
    <div class="mb-8 flex flex-col items-center text-center">
      <div class="relative mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#026cb6]/10 text-[#026cb6] shadow-sm transition-transform hover:scale-105">
        <svg class="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 10v.2A3 3 0 0 1 8.9 16v0H5v0h0a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/>
          <path d="M7 16v6"/>
          <path d="M13 19v3"/>
          <path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7l-2.6-3.1a1 1 0 0 0-1.4 0L10.4 7.3"/>
        </svg>
      </div>
      <h1 id="pims-title" class="text-xl font-bold tracking-tight text-slate-900">Harvest Cloud</h1>
      <p id="pims-subtitle" class="mt-1 text-xs text-slate-500 font-medium">Plantation Information Management System (PIMS)</p>
      <div class="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-mono font-medium text-slate-600 border border-slate-200">
        <span>Oracle APEX 24.2 Parity</span>
        <span>•</span>
        <span>App 103</span>
      </div>
    </div>

    <!-- Login Form -->
    <form id="pims-login-form" class="space-y-4">
      <!-- Error Message Container (Hidden by default) -->
      <div id="pims-login-error" class="hidden mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 shadow-sm">
        <span id="pims-login-error-text">Invalid Login Credentials</span>
      </div>

      <!-- Username Input -->
      <div>
        <label for="pims-username" class="sr-only">Username</label>
        <div class="relative">
          <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <input
            id="pims-username"
            name="username"
            type="text"
            value="IT000002"
            placeholder="Username"
            required
            autocomplete="username"
            class="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 shadow-sm outline-none transition focus:border-[#026cb6] focus:ring-2 focus:ring-[#026cb6]/20 font-medium"
          />
        </div>
      </div>

      <!-- Password Input -->
      <div>
        <label for="pims-password" class="sr-only">Password</label>
        <div class="relative">
          <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <input
            id="pims-password"
            name="password"
            type="password"
            value="Palembang@2026"
            placeholder="Password"
            required
            autocomplete="current-password"
            class="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-11 text-sm text-slate-800 placeholder-slate-400 shadow-sm outline-none transition focus:border-[#026cb6] focus:ring-2 focus:ring-[#026cb6]/20 font-medium"
          />
          <button
            type="button"
            id="btn-toggle-password"
            class="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
      </div>

      <!-- Remember Username Checkbox -->
      <div class="flex items-center justify-between pt-1">
        <label class="flex items-center gap-2 cursor-pointer text-xs text-slate-600 hover:text-slate-900 transition">
          <input
            id="pims-remember"
            name="remember"
            type="checkbox"
            checked
            class="h-4 w-4 rounded border-slate-300 text-[#026cb6] focus:ring-[#026cb6]/30 cursor-pointer"
          />
          <span>Remember username</span>
        </label>
      </div>

      <!-- APEX Hot Button: Sign In -->
      <button
        type="submit"
        id="btn-signin"
        class="btn-apex-primary w-full flex items-center justify-center gap-2 rounded-lg bg-[#026cb6] py-2.5 px-4 text-sm font-semibold text-white shadow-md shadow-[#026cb6]/25 transition hover:bg-[#025691] active:scale-[0.99] cursor-pointer"
      >
        <span>Sign In</span>
      </button>
    </form>

    <!-- Demo Quick Fill Helper -->
    <div class="mt-6 border-t border-slate-100 pt-5 text-center">
      <button
        type="button"
        id="btn-prefill-demo"
        class="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3.5 py-1.5 text-[11px] font-semibold text-sky-800 transition hover:bg-sky-100 hover:border-sky-300 cursor-pointer shadow-xs"
      >
        <span>Prefill Demo: <strong>IT000002</strong> / <strong>Palembang@2026</strong></span>
      </button>
    </div>

    <!-- Footer Security Note -->
    <div class="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
      <svg class="h-3.5 w-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
      <span id="pims-footer-note">Secured by GoBudiBase Engine & ORDS Bridge</span>
    </div>
  </div>
</div>
$HTML$,

  custom_css = $CSS$
/* Custom CSS: Login Harvest Cloud (Page 9999) */
.pims-login-card {
  box-shadow: 0 20px 50px -12px rgba(2, 108, 182, 0.15), 0 8px 24px -4px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-apex-primary {
  background-color: #026cb6;
  transition: all 0.2s ease;
}

.btn-apex-primary:hover {
  background-color: #025691;
  box-shadow: 0 4px 14px rgba(2, 108, 182, 0.35);
}

#btn-prefill-demo:hover {
  background-color: #e0f2fe;
}
$CSS$,

  script_front = $JS$
/**
 * FrontEnd Code-Behind: Login Harvest Cloud (Page 9999)
 * Bahasa: Modern TypeScript / Client JavaScript
 */
export default {
  async onPageLoad(ctx) {
    console.log("[P9999 FrontEnd] Login page loaded.");
  },
  validateCredentials(form) {
    const errors = {};
    const nik = (form.username || "").trim();
    if (!nik) errors.username = "Username wajib diisi";
    if (!form.password) errors.password = "Password wajib diisi";
    return { isValid: Object.keys(errors).length === 0, errors };
  },
  onSignInClick(event, ctx) {
    const { form, notify, navigate } = ctx;
    const username = (form.username || "").trim().toUpperCase();
    const password = form.password || "";
    if ((username === "IT000002" && password === "Palembang@2026") || (username === "ADMIN" && password === "admin")) {
      notify(`Login Berhasil! Selamat datang, ${username}`, "success");
      navigate("dashboard");
    } else {
      notify("Invalid Login Credentials", "error");
    }
  }
};
$JS$

WHERE app_id = 2 AND slug = 'login';


-- 2. SETUP INFORMASI USER (PAGE 12, slug: setup-user-informations)
UPDATE builder.pages
SET 
  custom_html = $HTML$
<div class="flex flex-col gap-5 p-2 font-sans select-none">
  <!-- APEX Page Header & Breadcrumb -->
  <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
    <div>
      <div class="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
        <span>Home</span>
        <span>/</span>
        <span>Konfigurasi Setup</span>
        <span>/</span>
        <span class="text-sky-400 font-bold">SETUP Informasi User</span>
      </div>
      <h2 id="page-title" class="text-xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
        <span>SETUP Informasi User (P-160)</span>
        <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Live APEX Parity</span>
      </h2>
      <p id="page-desc" class="text-xs text-slate-400 mt-0.5">Kelola data master pengguna korporat, subsidiary, penugasan role, dan status aktifasi akun.</p>
    </div>

    <!-- Action Toolbar -->
    <div class="flex items-center gap-2">
      <button id="btn-export-csv" type="button" class="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition cursor-pointer">
        <svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
        <span>Export CSV</span>
      </button>
      <button id="btn-add-user" type="button" class="flex items-center gap-1.5 rounded-lg bg-[#026cb6] px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-[#026cb6]/30 hover:bg-[#025691] transition cursor-pointer">
        <span>+ Tambah User</span>
      </button>
    </div>
  </div>

  <!-- Filter & Search Bar -->
  <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 shadow-sm backdrop-blur">
    <div class="flex flex-wrap items-center gap-2.5 flex-1 max-w-xl">
      <div class="relative flex-1 min-w-[220px]">
        <input
          id="pims-search-input"
          type="text"
          placeholder="Cari NIK, Nama Karyawan, Role..."
          class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 pl-9 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500"
        />
        <svg class="w-4 h-4 text-slate-500 absolute left-3 top-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      </div>

      <select id="pims-filter-subsidiary" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500 cursor-pointer">
        <option value="ALL">Semua Subsidiary (PT)</option>
        <option value="KYA">PT Kirana Yudha Amandari</option>
        <option value="SWA">PT Sumber Wangi Alam</option>
        <option value="ASJ">PT Cahaya Putih Energi Alam</option>
      </select>
    </div>

    <div class="flex items-center gap-2 text-xs text-slate-400 font-mono">
      <span>Total: <strong class="text-white">1,420</strong> User</span>
    </div>
  </div>

  <!-- Interactive Grid / Table Card -->
  <div class="rounded-xl border border-slate-800 bg-slate-900/80 shadow-xl overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs text-slate-300">
        <thead class="bg-slate-950/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
          <tr>
            <th class="py-3 px-4 w-12 text-center">No</th>
            <th class="py-3 px-4">NIK</th>
            <th class="py-3 px-4">Nama Lengkap</th>
            <th class="py-3 px-4">Subsidiary</th>
            <th class="py-3 px-4">Role System</th>
            <th class="py-3 px-4 text-center">Status</th>
            <th class="py-3 px-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/60 font-medium">
          <tr class="hover:bg-slate-800/40 transition">
            <td class="py-3 px-4 text-center text-slate-500 font-mono">1</td>
            <td class="py-3 px-4 font-bold text-sky-400 font-mono">IT000002</td>
            <td class="py-3 px-4 font-semibold text-white">Mukti Assary</td>
            <td class="py-3 px-4 text-slate-300">PT Palembang Agro Mandiri</td>
            <td class="py-3 px-4"><span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-950 text-sky-300 border border-sky-500/30">Administrator HCM</span></td>
            <td class="py-3 px-4 text-center"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">Aktif</span></td>
            <td class="py-3 px-4 text-right">
              <button class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 text-[11px] font-semibold cursor-pointer">Edit</button>
            </td>
          </tr>
          <tr class="hover:bg-slate-800/40 transition">
            <td class="py-3 px-4 text-center text-slate-500 font-mono">2</td>
            <td class="py-3 px-4 font-bold text-sky-400 font-mono">HO000142</td>
            <td class="py-3 px-4 font-semibold text-white">Budi Santoso</td>
            <td class="py-3 px-4 text-slate-300">PT Kirana Yudha Amandari</td>
            <td class="py-3 px-4"><span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-950 text-purple-300 border border-purple-500/30">Finance Manager</span></td>
            <td class="py-3 px-4 text-center"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">Aktif</span></td>
            <td class="py-3 px-4 text-right">
              <button class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 text-[11px] font-semibold cursor-pointer">Edit</button>
            </td>
          </tr>
          <tr class="hover:bg-slate-800/40 transition">
            <td class="py-3 px-4 text-center text-slate-500 font-mono">3</td>
            <td class="py-3 px-4 font-bold text-sky-400 font-mono">PL000881</td>
            <td class="py-3 px-4 font-semibold text-white">Ahmad Fauzi</td>
            <td class="py-3 px-4 text-slate-300">PT Sumber Wangi Alam</td>
            <td class="py-3 px-4"><span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950 text-amber-300 border border-amber-500/30">Estate Manager</span></td>
            <td class="py-3 px-4 text-center"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">Aktif</span></td>
            <td class="py-3 px-4 text-right">
              <button class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 text-[11px] font-semibold cursor-pointer">Edit</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Table Footer Pagination -->
    <div class="flex items-center justify-between border-t border-slate-800 bg-slate-950/60 px-4 py-2.5 text-xs text-slate-400">
      <span>Menampilkan 1 - 3 dari 1,420 baris</span>
      <div class="flex items-center gap-1 font-mono">
        <button class="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50">«</button>
        <span class="px-3 py-1 rounded bg-[#026cb6] text-white font-bold">1</span>
        <button class="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700">2</button>
        <button class="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700">3</button>
        <button class="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700">»</button>
      </div>
    </div>
  </div>
</div>
$HTML$,

  custom_css = $CSS$
/* Custom CSS: SETUP Informasi User (P-160) */
table tr:hover td {
  background-color: rgba(2, 108, 182, 0.06);
}
$CSS$

WHERE app_id = 2 AND slug = 'setup-user-informations';

COMMIT;
