# CAKAP FT MAOS

> **Sistem Monitoring dan Inspeksi APAR Modern**  
> Solusi digital internal berbasis web untuk inspeksi, pemantauan berkala, dan pelaporan Alat Pemadam Api Ringan (APAR) secara *real-time*, akurat, dan anti-manipulasi di lingkungan operasional **Fuel Terminal Maos (PT Pertamina Patra Niaga)**.

---

## Overview

**CAKAP FT MAOS** dirancang untuk mendigitalkan seluruh siklus pemeliharaan APAR—baik APAR statis yang terpasang di gedung/area tangki maupun APAR dinamis yang terpasang pada armada Mobil Tangki (MT). 

Sistem ini mengeliminasi pencatatan manual berbasis kertas dengan menghadirkan:
- **Verifikasi Fisik Anti-Manipulasi**: Validasi titik koordinat GPS secara otomatis dan pengambilan foto kondisi APAR serta selfie teknisi langsung melalui kamera (mencegah kecurangan inspeksi dari luar area kerja).
- **Identifikasi Cepat Berbasis QR Code**: Setiap tabung APAR memiliki QR code unik yang dapat dipindai langsung dari browser ponsel teknisi tanpa aplikasi pihak ketiga.
- **Hierarki Verifikasi Berlapis**: Hasil temuan kerusakan pada inspeksi teknisi otomatis masuk ke antrean *review* dan persetujuan tindakan perbaikan oleh Supervisor sebelum status APAR diperbarui.
- **Konfigurasi Konten Dinamis**: Seluruh pengaturan sistem, batasan radius GPS, toleransi waktu inspeksi, hingga identitas situs dapat disesuaikan langsung oleh Admin tanpa mengubah source code.

---

## Fitur Utama

### 1. Role-Based Access Control (RBAC)
Sistem memiliki 3 role pengguna dengan hak akses terisolasi:
- **Admin**:
  - CRUD master data APAR (statis & mobil tangki).
  - CRUD armada Mobil Tangki dan penetapan (assign/remove) tabung APAR.
  - CRUD Tipe APAR (Powder, CO2, Foam, Clean Agent).
  - CRUD Kategori Kerusakan (tabung, selang, pin/segel, pressure gauge, dll.).
  - CRUD Pengguna (Admin, Supervisor, Teknisi), unblock akun, dan resend link aktivasi email.
  - Penjadwalan inspeksi rutin per teknisi (harian, mingguan, bulanan, semesteran).
  - Download lembar label QR Code APAR siap cetak (format PDF).
  - Akses audit logs dan anomali aktivitas pengguna.
  - Pengelolaan Pengaturan Sistem terpusat secara dinamis.
- **Supervisor**:
  - Monitoring Dashboard statistik kesiapan APAR, status aktif, rusak, dan overdue.
  - Review dan Approval/Rejection pengajuan inspeksi teknisi.
  - Review permohonan perbaikan (Repair Approval) dan laporan hasil perbaikan (Repair Report).
  - Memberikan instruksi rework (perbaikan ulang) jika hasil perbaikan belum memenuhi standar.
  - Generate dan export laporan inspeksi berkala ke format Excel dan PDF.
- **Teknisi**:
  - Dashboard ringkasan tugas dan status inspeksi personal.
  - Pemindai kamera QR Code interaktif (*built-in web scanner*).
  - Form inspeksi terintegrasi GPS, kamera langsung untuk foto APAR & selfie, serta pencatatan multi-kategori kerusakan.
  - Halaman submit Laporan Pengerjaan Perbaikan (Repair Report) pasca approval.
  - Trigger reinspeksi otomatis setelah perbaikan selesai untuk memulihkan status APAR.

### 2. Monitoring & Inspeksi Lapangan
- **Deteksi Jenis Lokasi Otomatis**: Menyesuaikan form inspeksi apakah tabung berada di gedung (lokasi statis dengan validasi GPS) atau di Mobil Tangki (menampilkan detail plat nomor kendaraan).
- **Validasi Waktu & Radius**: Menolak submit inspeksi jika teknisi berada di luar jadwal aktif atau di luar radius koordinat geografis yang diizinkan (kecuali override role oleh Admin/Supervisor).
- **Pemberitahuan Otomatis & Reminder**: Pengingat jadwal inspeksi dan notifikasi overdue otomatis via WebSocket dan cron scheduler harian.

### 3. Pelaporan & Rekapitulasi Data
- Export rekapitulasi data ke format **Excel (.xlsx)** dan cetak dokumen resmi **PDF** untuk:
  - Laporan Riwayat Inspeksi
  - Laporan Ringkasan Kesiapan APAR (Summary)
  - Laporan Keterlambatan Inspeksi (Overdue)
  - Laporan Jejak Audit Sistem (Audit Logs)

---

## Tech Stack

| Komponen | Teknologi | Keterangan |
|---|---|---|
| **Backend Framework** | [Laravel 12.x](https://laravel.com/) | PHP Application Framework (modern single bootstrap architecture) |
| **Bahasa Pemrograman** | PHP 8.4+ | Typed properties, match expressions, modern syntax |
| **Frontend UI** | [React 18.2](https://react.dev/) | Single Page Application (SPA) modular |
| **Routing Frontend** | [@tanstack/react-router](https://tanstack.com/router) | Type-safe declarative client-side routing |
| **State & Server Cache** | [@tanstack/react-query](https://tanstack.com/query) | Asynchronous state management, auto-caching & refetching |
| **Styling & CSS** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern utility-first CSS framework |
| **Build Tool & Bundler** | [Vite 7.2](https://vite.dev/) | HMR super cepat & production bundler |
| **Database** | MySQL 8.0+ / MariaDB / SQLite | Relational Database Engine |
| **Autentikasi** | [tymon/jwt-auth](https://jwt-auth.readthedocs.io/) | Stateless JSON Web Token authentication |
| **QR Code Engine** | `simplesoftwareio/simple-qrcode` | Server-side QR Code SVG & PNG generation |
| **QR Scanner** | `@yudiel/react-qr-scanner` | In-browser client camera scanner |
| **PDF & Excel Engine** | `barryvdh/laravel-dompdf` & `maatwebsite/excel` | Dokumen PDF & spreadsheet export |
| **Image Processing** | `intervention/image` v3 | Resizing, compressing & handling foto inspeksi |
| **Real-time Push** | Pusher PHP Server / Ratchet WebSockets | Notifikasi langsung ke browser |
| **Testing** | PHPUnit 11 & Pest 3 | Unit & Feature testing |

---

## Arsitektur Sistem

Aplikasi menggunakan arsitektur **Single Page Application (SPA)** yang di-host oleh satu Blade wrapper ([resources/views/app.blade.php](resources/views/app.blade.php)), berkomunikasi dengan backend melalui **RESTful API** berbasis JWT.

```text
Browser (React 18 + TanStack Router)
   │
   ├── JWT Auth & Role Middleware (Client-side)
   │
   ▼ HTTP Request (JSON)
Routes (routes/api.php)
   │
   ├── JwtMiddleware & CheckRole (Server-side)
   │
   ▼ Form Request Validation (app/Http/Requests/*)
Controllers (app/Http/Controllers/Api/*)
   │
   ▼ Business Logic & Orchestration
Service Layer (app/Services/*)
   │ ├── InspectionService / ReinspectionService
   │ ├── RepairReportService / ScheduleService
   │ ├── QrCodeService / ImageService
   │ └── NotificationService / AuditLogService
   │
   ▼ Eloquent ORM
Models (app/Models/*)
   │
   ▼
Database (MySQL / MariaDB / SQLite)
```

---

## Struktur Direktori

```text
cakapftmaos/
├── app/
│   ├── Console/Commands/       # Artisan commands (scheduler, reminder, websockets)
│   ├── Enums/                  # PHP 8.4 Enums (AparStatus, InspectionCondition, dll.)
│   ├── Exports/                # Export handlers Maatwebsite Excel
│   ├── Http/
│   │   ├── Controllers/Api/    # 15 API Controller terisolasi
│   │   ├── Middleware/         # JwtMiddleware & CheckRole
│   │   └── Requests/           # Validasi Form Request per domain
│   ├── Mail/                   # Mailable template email aktivasi
│   ├── Models/                 # 13 Eloquent Models
│   ├── Providers/              # AppServiceProvider & SettingServiceProvider
│   ├── Services/               # 11 Service domain (business logic terpisah)
│   └── helpers.php             # Custom global helpers
├── bootstrap/
│   ├── app.php                 # Registrasi rute, middleware alias, exception
│   └── providers.php           # Service Provider bootstrap
├── config/                     # Konfigurasi aplikasi & system_settings_meta.php
├── database/
│   ├── factories/              # Database factories untuk testing
│   ├── migrations/             # 27 Migrasi database berurutan
│   └── seeders/                # DatabaseSeeder & seeders master data
├── public/                     # Web server root (index.php, favicon, manifest, build/)
├── resources/
│   ├── css/                    # Tailwind v4 stylesheet (app.css, fixes)
│   ├── js/
│   │   ├── app.tsx             # Root React Application & Route Definitions
│   │   ├── components/         # Komponen reusable (layout, common, modal, dialog)
│   │   ├── contexts/           # AuthContext, ToastContext, SiteSettingsContext
│   │   ├── features/           # Modular domain UI (auth, apar, dashboard, inspections, etc.)
│   │   ├── hooks/              # Custom React Hooks
│   │   ├── services/           # Axios API client instance
│   │   └── types/              # TypeScript interface & contracts
│   └── views/                  # Blade templates (app host, emails, cetak PDF)
├── routes/
│   ├── api.php                 # Rute RESTful API (105 endpoints)
│   ├── console.php             # Laravel 12 Task Scheduler (cron jobs)
│   └── web.php                 # Single fallback route ke app.blade.php
├── tests/
│   ├── Feature/                # Feature tests (Auth, APAR, Inspeksi, Hak Akses)
│   └── Unit/                   # Unit tests
├── APAR Maos.csv               # Data master tabung APAR (dibaca oleh TankTruckAparSeeder)
├── nixpacks.toml               # Konfigurasi deployment Nixpacks/Railway
├── package.json                # Dependensi frontend & script Vite
├── composer.json               # Dependensi backend PHP
└── vite.config.js              # Konfigurasi bundling Vite & Laravel plugin
```

---

## Requirements

Sebelum menjalankan aplikasi, pastikan environment lokal telah memenuhi spesifikasi berikut:

- **PHP**: Versi `^8.4`
- **Ekstensi PHP Wajib**:
  - `ext-gd` (untuk image resize & QR generation)
  - `ext-zip` (untuk Excel export)
  - `ext-fileinfo`, `ext-dom`, `ext-xml`, `ext-mbstring`, `ext-intl`
  - `ext-imagick` (opsional tapi direkomendasikan)
- **Composer**: Versi `2.x`
- **Node.js**: Versi `18.x` atau `20.x LTS`
- **NPM**: Versi `9.x` atau `10.x`
- **Database Engine**: MySQL `8.0+`, MariaDB `10.4+`, atau SQLite `3`
- **Browser Modern**: Chrome, Edge, Firefox, Safari (dengan izin akses kamera & geolocation)

---

## Panduan Instalasi

Ikuti langkah-langkah berikut untuk menginstal project dari kondisi *fresh clone*:

### 1. Clone Repository
```bash
git clone <repository-url>
cd cakapftmaos
```

### 2. Install Dependensi PHP
```bash
composer install
```

### 3. Install Dependensi JavaScript
```bash
npm install
```

### 4. Setup File Environment
Salin file template `.env.example` menjadi `.env`:
```bash
# Untuk Linux / macOS / Git Bash
cp .env.example .env

# Untuk Windows PowerShell
Copy-Item .env.example .env
```

### 5. Generate Application Key & JWT Secret
```bash
php artisan key:generate
php artisan jwt:secret
```

### 6. Konfigurasi Database
Buka file `.env` dan sesuaikan koneksi database Anda, contoh:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cakap_ft_maos
DB_USERNAME=root
DB_PASSWORD=
```
*(Jika ingin menggunakan SQLite untuk uji coba lokal cepat, set `DB_CONNECTION=sqlite` dan pastikan file `database/database.sqlite` tersedia).*

### 7. Jalankan Migrasi & Database Seeder
Jalankan migrasi beserta seluruh data seeder master (User default, Mobil Tangki, Jenis APAR, Kategori Kerusakan, dan CSV APAR Maos):
```bash
php artisan migrate --seed
```

### 8. Hubungkan Storage Link
Buat symlink direktori storage agar foto inspeksi dapat diakses publik:
```bash
php artisan storage:link
```

---

## Akun Pengguna Bawaan (Default Seeded Accounts)

Setelah database di-seed (`php artisan db:seed`), akun default berikut dapat langsung digunakan:

| Role | Email | Password | Hak Akses Utama |
|---|---|---|---|
| **Admin** | `admin@cakap-pertamina.com` | `password123` | Akses penuh CRUD, Settings, User Management, QR PDF |
| **Supervisor** | `supervisor@cakap-pertamina.com` | `password123` | Review & Approval Inspeksi & Perbaikan, Export Laporan |
| **Teknisi** | `teknisi1@cakap-pertamina.com` | `password123` | Scan QR, Form Inspeksi Lapangan (GPS & Kamera), My Repairs |

---

## Environment Configuration

Variabel lingkungan penting yang digunakan oleh aplikasi pada file `.env`:

```env
APP_NAME="CAKAP FT MAOS"
APP_ENV=local
APP_KEY=base64:...
APP_DEBUG=true
APP_URL=http://localhost:8000
APP_TIMEZONE=Asia/Jakarta

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cakap_ft_maos
DB_USERNAME=root
DB_PASSWORD=

JWT_SECRET=...
JWT_TTL=1440
JWT_REFRESH_TTL=20160

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=public
QUEUE_CONNECTION=database

# Konfigurasi Notifikasi Email (Aktivasi User Baru)
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="no-reply@cakap-pertamina.com"
MAIL_FROM_NAME="CAKAP Pertamina"
```

---

## Struktur Database

Aplikasi memiliki 13 tabel utama yang saling berelasi:

| Nama Tabel | Deskripsi & Fungsi |
|---|---|
| `users` | Akun pengguna sistem (nama, email, phone, role: `admin`/`supervisor`/`teknisi`, status aktif, token aktivasi). |
| `apar_types` | Master jenis media pemadam (Powder, CO2, Foam, Hallon/Clean Agent). |
| `tank_trucks` | Master armada truk tangki BBM (nomor polisi, kapasitas tangki, transportir/vendor). |
| `apars` | Data tabung APAR, kode unik QR, lokasi (`statis`/`mobil_tangki`), tanggal kedaluwarsa, dan status fisik (`active`, `damaged`, `in_repair`, `not_fixable`). |
| `damage_categories` | Master kategori kerusakan komponen APAR (kondisi fisik tabung, segel, pin, nozzle, selang, pressure). |
| `inspection_schedules` | Jadwal inspeksi terjadwal, frekuensi penugasan, dan teknisi yang ditugaskan. |
| `inspections` | Record hasil inspeksi teknisi (waktu, koordinat GPS, foto APAR, selfie teknisi, status approval, catatan supervisor). |
| `inspection_damages` | Pivot detail kerusakan spesifik yang ditemukan pada suatu inspeksi tabung. |
| `inspection_logs` | Jejak kronologis audit otomatis setiap kali terjadi perubahan status atau inspeksi pada tabung APAR. |
| `repair_approvals` | Pengajuan tindakan perbaikan atas temuan tabung rusak yang memerlukan approval Supervisor. |
| `repair_reports` | Laporan penyelesaian perbaikan oleh teknisi (tindakan yang diambil, foto perbaikan, catatan). |
| `notifications` | Log notifikasi in-app untuk penugasan jadwal baru, reminder inspeksi, dan approval perbaikan. |
| `settings` | Penyimpanan pengaturan dinamis sistem dalam bentuk key-value store. |

---

## Content Management (Pengaturan Dinamis)

Sistem mengadopsi arsitektur **Data-Driven Configuration** melalui tabel `settings` dan helper terpusat:

1. **Penyimpanan Terpusat**:
   - Seluruh pengaturan seperti toleransi radius GPS (`gps_tolerance_meters`), toleransi menit inspeksi (`inspection_time_window_hours`), nama terminal, logo situs, dan kontak bantuan dikelola melalui database.
2. **Metadata & Validasi Otomatis**:
   - Skema tipe data dan aturan validasi form settings didefinisikan dalam [config/system_settings_meta.php](config/system_settings_meta.php) dan diverifikasi oleh [app/Services/SystemSettingsMeta.php](app/Services/SystemSettingsMeta.php).
3. **Penyajian ke Frontend**:
   - Pengaturan publik (nama situs, logo, tema) diinjeksikan secara otomatis ke Blade host via `window.APP_CONFIG` dan diakses melalui `SiteSettingsContext` di React.
   - Admin dapat memperbarui pengaturan kapan saja di halaman menu **Pengaturan** (`/settings`) tanpa perlu merestart server backend.

---

## Development Workflow

Untuk menjalankan aplikasi di lingkungan pengembangan lokal:

### Menjalankan Server (Concurrent Mode)
Project menyediakan skrip otomatis untuk menjalankan server Laravel, worker antrean, log viewer (Pail), dan Vite dev server sekaligus:
```bash
composer run dev
```

### Atau Menjalankan Secara Terpisah:
Buka dua terminal berbeda:
- **Terminal 1 (Backend API)**:
  ```bash
  php artisan serve --port=8000
  ```
- **Terminal 2 (Frontend HMR)**:
  ```bash
  npm run dev
  ```

Buka browser dan navigasikan ke `http://localhost:8000` (atau port yang ditentukan).

### Menjalankan Task Scheduler (Cron)
Di server lokal untuk menguji pengingat otomatis dan recurring schedules:
```bash
php artisan schedule:work
```

---

## Testing

Aplikasi dilengkapi dengan rangkaian automated test menyeluruh (Unit Test dan Feature Test):

### Menjalankan Laravel Feature & Unit Tests
```bash
php artisan test
```
*Seluruh 29 unit & feature tests wajib berstatus PASS.*

Rangkaian pengujian mencakup:
- `AparUpdateTest`: Validasi perubahan status tabung APAR.
- `AuthRefreshTest`: Keamanan rotasi token JWT, validitas token expired/malformed.
- `InspectionStoreTest`: Validasi jendela waktu jadwal teknisi vs bypass supervisor/admin.
- `InspectionValidationTest`: Validasi kelengkapan foto, GPS, dan kategori kerusakan.
- `RepairReinspectionTest`: Validasi pemulihan status tabung setelah perbaikan.
- `SupervisorAccessTest`: Proteksi hak akses endpoint terbatas antar role.

### Menjalankan Automated Screenshot (Playwright E2E)
```bash
npx playwright test
```

---

## Build & Production Deployment

Saat mempersiapkan aplikasi untuk deployment production:

### 1. Build Frontend Assets
Kompilasi dan minifikasi seluruh komponen React & Tailwind CSS ke direktori `public/build/`:
```bash
npm run build
```

### 2. Optimasi Framework Laravel
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 3. Setup Scheduler (Crontab Server)
Tambahkan entri cron berikut pada server production (setiap menit):
```cron
* * * * * cd /path-to-cakapftmaos && php artisan schedule:run >> /dev/null 2>&1
```

### 4. Deployment via Nixpacks
File [nixpacks.toml](nixpacks.toml) sudah disediakan dan terkonfigurasi untuk deployment ke platform container/PaaS (seperti Railway, Coolify, atau Docker).

---

## Keamanan (Security Best Practices)

- **JWT Authentication**: Seluruh endpoint API terproteksi mewajibkan bearer token JWT yang ditandatangani dengan secret key unik.
- **Strict Role-Based Middleware**: Pengecekan role dilakukan ganda (pada router TanStack sisi frontend dan `CheckRole` middleware sisi backend).
- **Anti-Tampering Inspection**:
  - Validasi koordinat GPS mendeteksi apakah teknisi benar-benar berada di lokasi tabung statis.
  - Upload gambar dikompresi dan divalidasi MIME type-nya melalui `Intervention/Image`.
- **Credential Protection**:
  - File `.env` dilarang keras di-commit ke repositori Git.
  - Endpoint publik hanya mengekspos metadata non-sensitif melalui `/api/public-settings`.

---

## Troubleshooting

### 1. Token JWT Invalid / Kadaluarsa
Jalankan perintah berikut untuk menggenerasi secret key JWT baru:
```bash
php artisan jwt:secret
```

### 2. Gambar Foto Inspeksi Tidak Muncul (404 Not Found)
Pastikan symlink storage public sudah terhubung dengan benar:
```bash
php artisan storage:link
```

### 3. Perubahan CSS atau Javascript Tidak Muncul di Browser
Lakukan hard-refresh browser (`Ctrl + Shift + R` atau `Cmd + Shift + R`), atau jalankan ulang build Vite:
```bash
npm run build
```

### 4. Konfigurasi Tidak Berubah Setelah Edit `.env`
Bersihkan cache konfigurasi Laravel:
```bash
php artisan config:clear
php artisan cache:clear
```

---

## Roadmap

- [ ] Integrasi Push Notification native Web Push (Service Worker PWA terintegrasi penuh).
- [ ] Export laporan berkala otomatis dikirimkan ke email Supervisor setiap akhir bulan.
- [ ] Grafik analitik tren kerusakan APAR berbasis lokasi secara spasial (peta interaktif FT Maos).

---

## Lisensi

Aplikasi ini dikembangkan untuk penggunaan internal operasional **PT Pertamina Patra Niaga - Fuel Terminal Maos**. Seluruh hak cipta dan kepemilikan kode dilindungi.
