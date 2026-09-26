# Rencana Arsitektur & Implementasi Sistem (ARCHITECTURE.md)
# CAKAP FT MAOS — PT Pertamina Patra Niaga Fuel Terminal Maos

> Dokumen ini merinci arsitektur teknis menyeluruh, diagram aliran data, spesifikasi tech stack, serta dekomposisi implementasi sistem menjadi modul-modul modular yang terukur dengan **Kriteria Selesai (Definition of Done)** yang tegas.

---

## 1. Spesifikasi Tech Stack

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND CLIENT                           │
│  React 18.2 SPA │ TanStack Router │ TanStack Query │ Tailwind v4 │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ HTTPS / REST API / JWT
┌─────────────────────────────────▼────────────────────────────────┐
│                         API GATEWAY                              │
│   Laravel 12.x Router │ JwtMiddleware │ CheckRole Middleware     │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ Form Request Validation
┌─────────────────────────────────▼────────────────────────────────┐
│                        CONTROLLER LAYER                          │
│             15 API Controllers (app/Http/Controllers/Api)        │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ Business Orchestration
┌─────────────────────────────────▼────────────────────────────────┐
│                         SERVICE LAYER                            │
│ 11 Domain Services (app/Services/*) │ Transactions │ Validation  │
└──────────────────┬───────────────────────────────┬───────────────┘
                   │                               │
┌──────────────────▼─────────────┐   ┌─────────────▼───────────────┐
│        DATA PERSISTENCE        │   │        FILE & MEDIA         │
│  Eloquent ORM (13 Models)      │   │  Storage Symlink            │
│  MySQL 8.0+ / SQLite (Tests)   │   │  Intervention Image v3      │
└────────────────────────────────┘   └─────────────────────────────┘
```

| Komponen | Spesifikasi & Versi | Peran & Justifikasi Arsitektur |
|---|---|---|
| **Backend Framework** | [Laravel 12.x](https://laravel.com/) | Kerangka kerja PHP modern dengan bootstrap tunggal (`bootstrap/app.php`), dependency injection, dan ekosistem enterprise tangguh. |
| **Bahasa Pemrograman** | PHP 8.4+ | Pemanfaatan typed properties, native enums, match expressions, dan strict typing untuk keandalan maksimal. |
| **Frontend Framework** | [React 18.2](https://react.dev/) | Single Page Application (SPA) berbasis komponen modular yang responsif dan cepat. |
| **Client-Side Routing** | [@tanstack/react-router](https://tanstack.com/router) | Routing tipe-aman (*type-safe*) dengan guard autentikasi berbasis context (`beforeLoad`). |
| **State & Server Cache** | [@tanstack/react-query v5](https://tanstack.com/query) | Manajemen asynchronous data fetching, auto-refetching, caching, dan invalidasi mutasi otomatis. |
| **Styling & CSS** | [Tailwind CSS v4](https://tailwindcss.com/) | Utilitas CSS modern terkompilasi cepat dengan token desain industri Pertamina HSSE. |
| **Build Tool** | [Vite 7.2](https://vite.dev/) | Bundler aset modern dengan Hot Module Replacement (HMR) berkecepatan tinggi. |
| **Database Engine** | MySQL 8.0+ / MariaDB / SQLite 3 | Relational database ACID-compliant dengan foreign keys, indexing geografis & kronologis. |
| **Autentikasi** | [tymon/jwt-auth](https://jwt-auth.readthedocs.io/) | Otentikasi token stateless tanpa session server, cocok untuk API mobile/web. |
| **Media & QR Engine** | `Intervention/Image` v3 & `Simple-QrCode` | Pemrosesan, resize, kompresi foto inspeksi & generasi vektor QR Code. |
| **Dokumen & Cetak** | `barryvdh/laravel-dompdf` & `maatwebsite/excel` | Pembuatan laporan resmi format PDF siap tanda tangan dan spreadsheet Excel XLSX. |
| **Infrastruktur & Hosting**| Nixpacks / Railway / Docker / On-Premise VM | Containerized deployment dengan Nginx reverse proxy, PHP-FPM 8.4, dan Crontab scheduler. |

---

## 2. Diagram Aliran Data & Interaksi Sistem

```text
[ Browser / Smartphone Teknisi ]
   │
   ├── (1) Request scan/submit inspeksi + JWT Bearer Token
   │
[ Web Server (Nginx / PHP-FPM) ]
   │
[ Laravel Routing (routes/api.php) ]
   │
   ├── (2) Validasi Token: JwtMiddleware
   ├── (3) Validasi Akses: CheckRole (admin/supervisor/teknisi)
   │
[ Form Request (app/Http/Requests/*) ]
   │
   ├── (4) Validasi skema input (koordinat GPS, file foto live, damage_ids)
   │
[ Controller Layer (app/Http/Controllers/Api/*) ]
   │
   ├── (5) Delegasi eksekusi ke Service Layer
   │
[ Service Layer (app/Services/*) ]
   │
   ├── (6) Validasi Radius Geolocation (Rumus Haversine vs setting toleransi)
   ├── (7) Validasi Waktu Penjadwalan (Time-window schedule)
   ├── (8) Pemrosesan Gambar (Kompresi & simpan ke storage/public)
   ├── (9) Database Transaction (DB::transaction):
   │       ├── Insert record 'inspections'
   │       ├── Attach detail 'inspection_damages'
   │       ├── Update status fisik 'apars'
   │       └── Create record 'inspection_logs' & 'notifications'
   │
[ Database (MySQL) & Storage ]
```

---

## 3. Dekomposisi Modul Implementasi & Kriteria Selesai (Definition of Done)

Sistem dipecah menjadi 8 modul implementasi bertahap:

---

### MODUL 1: Otentikasi, Profil & Manajemen Pengguna (RBAC)
- **Cakupan Pekerjaan**:
  - Implementasi login JWT, logout, refresh token, forgot password, dan reset password.
  - Alur pembuatan akun teknisi/supervisor baru oleh Admin dengan token aktivasi via email.
  - Halaman profil pengguna, ganti kata sandi, dan update kontak.
  - Manajemen user (list, edit, nonaktifkan/blokir, buka blokir, kirim ulang tautan aktivasi).
- **Kriteria Selesai (Definition of Done)**:
  - [x] Endpoint login menghasilkan token JWT valid dengan payload role dan user identity.
  - [x] Akses endpoint dibatasi ketat: rute admin menolak supervisor/teknisi dengan response `403 Forbidden`.
  - [x] Email aktivasi terkirim dengan tautan aman yang kadaluarsa dalam 24 jam.
  - [x] Seluruh unit test autentikasi (`AuthRefreshTest`, `SupervisorAccessTest`) berstatus PASS.

---

### MODUL 2: Master Data APAR & Armada Mobil Tangki
- **Cakupan Pekerjaan**:
  - CRUD Tipe APAR (Powder, CO2, Foam, Clean Agent).
  - CRUD Kategori Kerusakan (kerusakan tabung, selang, pin/segel, pressure, nozzle).
  - CRUD Armada Mobil Tangki (Nomor polisi, kapasitas BBM, nama vendor transportir).
  - CRUD Tabung APAR:
    - APAR Statis: input titik koordinat (latitude, longitude) area gedung/tangki FT Maos.
    - APAR Dinamis: relasi dengan master Mobil Tangki.
  - Generasi kode QR unik otomatis berbasis kode tabung.
  - Pembuatan lembar stiker cetak QR Code PDF siap print.
- **Kriteria Selesai (Definition of Done)**:
  - [x] Tabung APAR dapat didaftarkan dengan tipe lokasi `statis` (wajib koordinat) atau `mobil_tangki` (wajib armada).
  - [x] Download PDF label stiker QR menghasilkan file PDF dengan layout stiker rapi sesuai ukuran standar.
  - [x] Validasi database mencegah duplikasi kode APAR dan serial number.
  - [x] Test `AparUpdateTest` berstatus PASS.

---

### MODUL 3: Penjadwalan & Task Dispatcher
- **Cakupan Pekerjaan**:
  - Pendaftaran jadwal inspeksi rutin (frekuensi harian, mingguan, bulanan, semesteran).
  - Penetapan penugasan teknisi penanggung jawab per jadwal.
  - Fitur `MySchedules` pada portal teknisi untuk melihat daftar tugas yang harus diselesaikan.
  - Validasi *inspection time window* (mencegah teknisi mengisi form inspeksi di luar jam/hari jadwal aktif).
- **Kriteria Selesai (Definition of Done)**:
  - [x] Teknisi hanya dapat melihat jadwal yang ditugaskan ke akunnya.
  - [x] Sistem menolak inspeksi jika diajukan di luar jendela waktu yang diizinkan (kecuali role Admin/Supervisor).
  - [x] Cron scheduler harian otomatis memperbarui status jadwal menjadi *overdue* jika melewati batas tanggal.

---

### MODUL 4: Mobile-First Field Inspection Engine (Anti-Fraud)
- **Cakupan Pekerjaan**:
  - Scanner QR Code in-browser menggunakan kamera peramban smartphone (`@yudiel/react-qr-scanner`).
  - Lookup data APAR otomatis pasca pemindaian QR (`/api/apar/qr/{qrCode}`).
  - Validasi koordinat GPS Geolocation di sisi peramban dan diverifikasi ulang di sisi backend melalui rumus Haversine.
  - Form capture kamera langsung:
    - Foto Kondisi Fisik Tabung APAR.
    - Foto Selfie Teknisi memegang tabung di lokasi.
  - Seleksi multi-kategori kerusakan jika kondisi APAR tidak normal.
- **Kriteria Selesai (Definition of Done)**:
  - [x] Kamera peramban aktif tanpa perlu instalasi aplikasi store native.
  - [x] Inspeksi APAR statis otomatis ditolak dengan error `422` jika koordinat GPS melebihi `gps_tolerance_meters` dari referensi tabung.
  - [x] Foto berhasil dikompresi menjadi ukuran optimal ($\le 500$ KB) dan tersimpan di storage publik.
  - [x] Feature test `InspectionStoreTest` dan `InspectionValidationTest` berstatus PASS.

---

### MODUL 5: Approval, Repair Lifecycle & Reinspection
- **Cakupan Pekerjaan**:
  - Deteksi otomatis: jika inspeksi menemukan kerusakan, status APAR berubah menjadi `damaged` dan otomatis membuat tiket `repair_approvals` berstatus `pending`.
  - Portal Supervisor: review inspeksi, persetujuan perbaikan (*Approve/Reject*).
  - Portal Teknisi (`My Repairs`): menerima tugas perbaikan yang telah disetujui.
  - Form Laporan Pengerjaan Perbaikan (`RepairReportForm`): input tindakan, penggantian komponen, dan upload foto hasil perbaikan.
  - Review Laporan Perbaikan oleh Supervisor:
    - Jika disetujui: trigger otomatis proses reinspeksi untuk memulihkan status APAR menjadi `active`.
    - Jika belum sesuai: instruksi *Rework* (perbaikan ulang) dengan catatan revisi untuk teknisi.
- **Kriteria Selesai (Definition of Done)**:
  - [x] Status tabung APAR terkunci konsisten sesuai state machine: `active` -> `damaged` -> `in_repair` -> `active`.
  - [x] Approval supervisor wajib mencatat user reviewer, timestamp, dan catatan persetujuan.
  - [x] Feature test `RepairReinspectionTest` berstatus PASS.

---

### MODUL 6: Pengaturan Dinamis & Metadata Sistem (Dynamic Settings)
- **Cakupan Pekerjaan**:
  - Penyimpanan konfigurasi key-value terpusat di tabel `settings`.
  - Definisi skema tipe data dan validasi pada `config/system_settings_meta.php`.
  - Injeksi otomatis pengaturan publik ke peramban via `window.APP_CONFIG`.
  - Halaman antarmuka manajemen pengaturan bagi Admin (`/settings`) untuk mengubah toleransi GPS, batas jam, logo, dan identitas terminal tanpa restart server.
- **Kriteria Selesai (Definition of Done)**:
  - [x] Nilai pengaturan tersimpan dan ter-cache efisien di backend.
  - [x] Perubahan toleransi radius GPS di halaman pengaturan langsung berpengaruh pada validasi inspeksi berikutnya.
  - [x] Endpoint publik `/api/public-settings` hanya mengekspos konfigurasi non-sensitif.

---

### MODUL 7: Reporting, Audit Trail & Export Dokumen
- **Cakupan Pekerjaan**:
  - Export laporan riwayat inspeksi ke spreadsheet Excel (.xlsx) dengan styling header Pertamina.
  - Export dokumen formal Berita Acara Inspeksi dan Rekapitulasi Kesiapan ke format PDF via DomPDF.
  - Catatan audit log kronologis merekam setiap mutasi data, login gagal/sukses, dan perubahan status tabung.
  - Halaman filter laporan berdasarkan rentang tanggal, status APAR, tipe media, dan teknisi.
- **Kriteria Selesai (Definition of Done)**:
  - [x] Dokumen PDF ter-generate dengan header formal FT Maos, tabel data rapi, dan kolom tanda tangan pejabat HSSE.
  - [x] Export Excel menghasilkan file spreadsheet valid yang dapat dibuka di Microsoft Excel tanpa peringatan format corrupt.
  - [x] Seluruh aksi penting tercatat di tabel `inspection_logs` dengan user ID dan IP address.

---

### MODUL 8: Real-Time Notifications & Analytical Dashboard
- **Cakupan Pekerjaan**:
  - Dashboard analitik interaktif dengan ringkasan kesiapan APAR (*Readiness Score*, total tabung aktif, rusak, dalam perbaikan, dan jadwal tertunda).
  - Tampilan card indikator KPI berstandar UI/UX Pro Max.
  - Polling berkala / event notifikasi untuk pengingat jadwal, tiket perbaikan baru, dan status approval.
- **Kriteria Selesai (Definition of Done)**:
  - [x] Statistik dashboard merefleksikan data terkini secara akurat.
  - [x] Widget notifikasi menampilkan badge jumlah tugas yang memerlukan tindakan.
  - [x] UI responsif di peramban seluler teknisi maupun monitor supervisor.

---

## 4. Keamanan, Integritas Data & Strategi Backup

1. **Proteksi Token & Session**:
   - Token JWT berumur pendek (TTL 1440 menit / 24 jam) dengan fasilitas rotasi token (`/api/refresh`).
   - Token disimpan aman di client state (memory/localStorage terisolasi) dan dihapus saat logout.
2. **Database Integrity & Transaksi**:
   - Seluruh kunci asing (*Foreign Keys*) menggunakan constraint `onDelete('cascade')` atau `onDelete('restrict')` sesuai aturan bisnis.
   - Tidak ada mutasi status tabung yang terjadi tanpa jejak di tabel log (`inspection_logs`).
3. **Penyimpanan Berkas (Media Storage)**:
   - Direktori `storage/app/public/inspections` diisolasi dan diakses melalui symlink.
   - Ekstensi file divalidasi ketat (hanya format gambar `jpeg, png, jpg, webp` dengan batas ukuran maksimal 5 MB sebelum kompresi).
4. **Strategi Deployment**:
   - Server menjalankan `php artisan optimize` (config cache, route cache, view cache) pada lingkungan produksi.
   - Skrip cron mengeksekusi `php artisan schedule:run` setiap 60 detik.
