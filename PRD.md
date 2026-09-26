# Product Requirements Document (PRD)
# CAKAP FT MAOS (Sistem Monitoring dan Inspeksi APAR Modern)

> **Dokumen North Star Proyek**  
> **Organisasi**: PT Pertamina Patra Niaga — Fuel Terminal Maos  
> **Status**: Aktif / Produksi & Pengembangan Lanjutan  
> **Target Rilis MVP**: Q1 2026  
> **Versi Dokumen**: 1.0.0  

---

## 1. Executive Summary & North Star

**CAKAP FT MAOS** (*Catatan & Kontrol APAR Pertamina FT Maos*) adalah platform digital operasional berbasis web terpadu yang dirancang untuk mengotomatisasi, memantau, dan mendokumentasikan seluruh siklus hidup inspeksi dan pemeliharaan Alat Pemadam Api Ringan (APAR) di lingkungan kerja **PT Pertamina Patra Niaga - Fuel Terminal Maos**.

### North Star Metric
> *"100% tabung APAR di seluruh fasilitas operasional dan armada Mobil Tangki terverifikasi kesiapan fisiknya secara berkala tanpa celah manipulasi lokasi dan waktu, dengan visibilitas audit real-time."*

---

## 2. Problem Statement & Latar Belakang

Fuel Terminal Maos merupakan objek vital nasional berisiko tinggi (*high-risk hazardous environment*) dengan puluhan titik fasilitas penyimpanan bahan bakar minyak (BBM) dan ratusan armada Mobil Tangki (MT). Kesiapan APAR adalah garda pertahanan pertama dalam kepatuhan HSSE (*Health, Safety, Security, and Environment*).

Sebelum adanya sistem ini, pengelolaan APAR menghadapi tantangan kritis:
1. **Kartu Gantung Kertas Rentan Rusak & Hilang**: Kartu cek fisik di tabung mudah pudar oleh cuaca ekstrem, minyak, atau robek sehingga riwayat inspeksi terputus.
2. **Potensi Manipulasi Data (Fraud Inspeksi)**: Inspeksi konvensional membuka celah "tembak data" (teknisi menandatangani kartu tanpa benar-benar mendatangi lokasi tabung atau tanpa memeriksa tekanan gas).
3. **Keterlambatan Penanganan Tabung Rusak / Expired**: Tabung bertekanan rendah (*low pressure*), segel putus, atau serbuk menggumpal sering kali terlambat diketahui oleh Supervisor karena rekapitulasi data lambat.
4. **Armada Bergerak (Mobil Tangki) Sulit Dilacak**: Tabung APAR pada armada tangki berpindah-pindah rute antar SPBU, menyulitkan teknisi mengetahui kapan dan di mana tabung harus diinspeksi.
5. **Ketiadaan Jejak Audit Digital Terpusat**: Saat audit kepatuhan HSSE internal maupun eksternal, pengumpulan berkas bukti membutuhkan waktu berhari-hari.

---

## 3. Target Pengguna (User Personas & Hak Akses)

Sistem melayani 3 tingkatan pengguna internal dengan batas wewenang tegas (*Strict Role-Based Access Control*):

```
┌─────────────────────────────────────────────────────────────┐
│                      PENGGUNA SISTEM                        │
├─────────────────┬─────────────────────────┬─────────────────┤
│   ADMIN HSSE    │     SUPERVISOR HSSE     │ TEKNISI LAPANGAN│
├─────────────────┼─────────────────────────┼─────────────────┤
│ • Master APAR   │ • Monitoring Dashboard  │ • Scan QR Code  │
│ • Mobil Tangki  │ • Review Inspeksi       │ • Form GPS/Foto │
│ • Penjadwalan   │ • Approval Perbaikan    │ • Report Repair │
│ • User & Config │ • Export Excel/PDF      │ • Task Reminder │
└─────────────────┴─────────────────────────┴─────────────────┘
```

### 3.1. Admin (HSE Management & System Administrator)
- **Tanggung Jawab**: Pengendali data master, konfigurasi operasional, dan integritas sistem.
- **Kebutuhan Utama**:
  - Pendaftaran & update tabung APAR (lokasi gedung statis & mobil tangki dinamis).
  - Pendaftaran armada Mobil Tangki dan penetapan tabung APAR yang terpasang di armada.
  - Pengelolaan master Tipe APAR (Powder, CO2, Foam, Clean Agent) dan Kategori Kerusakan.
  - Manajemen akun pengguna (Admin, Supervisor, Teknisi), unblock akun, dan reset sandi.
  - Penjadwalan siklus inspeksi per teknisi (harian, mingguan, bulanan, semesteran).
  - Cetak lembar stiker QR Code siap pakai (format PDF standar ukuran stiker industri).
  - Konfigurasi parameter dinamis (toleransi radius GPS, batas waktu pengerjaan, metadata FT Maos).

### 3.2. Supervisor (HSSE Operations & Reviewer)
- **Tanggung Jawab**: Memastikan seluruh tabung siap pakai dan mengawasi mutu hasil inspeksi/perbaikan.
- **Kebutuhan Utama**:
  - Monitoring Dasbor analitik kesiapan APAR (*Readiness KPI*, status *Active*, *Damaged*, *In Repair*, *Overdue*).
  - Review dan persetujuan/penolakan (*Approve/Reject*) temuan kerusakan hasil inspeksi teknisi.
  - Memberikan instruksi perbaikan lanjutan atau instruksi perbaikan ulang (*Rework*) jika perbaikan belum sesuai standar.
  - Generate dan unduh laporan resmi berkala (Excel XLSX dan PDF formal siap tanda tangan).

### 3.3. Teknisi Lapangan (Field Inspector & Repairer)
- **Tanggung Jawab**: Melakukan inspeksi fisik langsung di lapangan dan mengeksekusi perbaikan tabung.
- **Kebutuhan Utama**:
  - Pemindai QR Code in-browser yang responsif dan cepat melalui kamera smartphone.
  - Form inspeksi terintegrasi validasi koordinat GPS dan live camera (foto kondisi tabung + selfie teknisi anti-joki).
  - Otomatisasi deteksi tipe lokasi (APAR statis vs APAR mobil tangki).
  - Pelaporan detail kerusakan multi-komponen (pressure gauge, pin, segel, nozzle, selang, tabung).
  - Pengajuan dan pelaporan pengerjaan perbaikan (*Repair Report*) dengan bukti foto setelah selesai.

---

## 4. Ruang Lingkup Fitur Inti (MVP Scope)

### 4.1. Autentikasi & Keamanan Akses (RBAC)
- Otentikasi stateless berbasis JSON Web Token (JWT) dengan refresh token rotation.
- Alur aktivasi akun baru teknisi/supervisor melalui tautan email aktivasi aman (token 24 jam).
- Multi-tier role authorization pada rute API backend (`role:admin`, `role:supervisor`, `role:teknisi`) dan guard sisi frontend TanStack Router.

### 4.2. Master Data APAR & Armada Mobil Tangki
- Registrasi APAR dengan atribut: Kode Tabung, Serial Number, Tipe Media, Kapasitas (Kg/L), Lokasi Fisik, Tanggal Kadaluarsa, Status Kesiapan.
- Dukungan dua model lokasi:
  - **Statis**: Dilengkapi koordinat latitude & longitude referensi di area FT Maos.
  - **Dinamis (Mobil Tangki)**: Berelasi dengan master armada Mobil Tangki (Nomor Polisi, Kapasitas Tangki, Nama Transportir/Vendor).
- Generasi kode QR unik otomatis yang terenkripsi dan lembar cetak PDF label stiker APAR.

### 4.3. Anti-Tampering Mobile-First Field Inspection Engine
- **In-Browser QR Scanner**: Membaca kode QR tabung secara instan tanpa perlu instalasi aplikasi store.
- **Validasi Geolocation Anti-Fraud**:
  - Menghitung jarak antara koordinat teknisi saat ini dengan koordinat referensi APAR menggunakan rumus *Haversine*.
  - Menolak submit jika di luar radius toleransi (dapat disesuaikan via Pengaturan Dinamis).
- **Verifikasi Kamera Langsung (Strict Live Capture)**:
  - Mewajibkan 2 foto: **Foto Kondisi APAR** dan **Foto Selfie Teknisi di Lokasi**.
  - Menggunakan API kamera browser langsung; melarang *upload file picker* dari galeri untuk mencegah penggunaan foto lama.
  - Otomatisasi kompresi dan optimasi gambar sisi server via `Intervention/Image`.
- **Pencatatan Multi-Kategori Kerusakan**:
  - Pemilihan komponen yang bermasalah (Tabung Korosi, Pressure Rendah/Tinggi, Selang Retak, Pin Patah, Segel Rusak, Nozzle Tersumbat).

### 4.4. Hierarki Workflow Persetujuan & Perbaikan (Review & Repair Lifecycle)
```
[Inspeksi Teknisi] ──(Kondisi Rusak)──> [Status: Damaged / Pending Review]
                                                        │
                                                        ▼
                                        [Supervisor Review & Approval]
                                           ├─ [Approved] ─> [Status: In Repair]
                                           └─ [Rejected] ─> [Status Dipulihkan/Dibatalkan]
                                                        │
                                                        ▼
                                        [Teknisi Melakukan Perbaikan]
                                                        │
                                                        ▼
                                        [Submit Repair Report + Foto Bukti]
                                                        │
                                                        ▼
                                        [Supervisor Review Laporan Perbaikan]
                                           ├─ [Approve] ──> [Trigger Reinspeksi Otomatis]
                                           │                        │
                                           │                        ▼
                                           │               [Status: Active Kembali]
                                           └─ [Rework] ───> [Kembali ke Teknisi]
```

### 4.5. Pengaturan Sistem Dinamis (Centralized Dynamic Settings)
- Konfigurasi nilai operasional tersimpan dalam basis data tanpa mengubah kode sumber:
  - Batas toleransi radius GPS (misal: 50 meter).
  - Jendela toleransi waktu inspeksi sebelum/sesudah jadwal (misal: ±2 jam).
  - Identitas terminal, logo situs, kontak bantuan, dan pengumuman sistem.
- Diinjeksikan ke frontend melalui `window.APP_CONFIG` dan `SiteSettingsContext`.

### 4.6. Pelaporan, Audit Trail & Export Dokumen
- Generate dokumen PDF resmi berstandar Pertamina untuk:
  - Lembar Label Stiker QR Code Tabung APAR.
  - Berita Acara / Laporan Hasil Inspeksi Berkala.
  - Rekapitulasi Ringkasan Kesiapan APAR.
- Export spreadsheet Excel (.xlsx) dengan filtering tanggal, status, lokasi, dan teknisi.
- Catatan audit kronologis (*audit logging*) otomatis merekam perubahan status, login, dan aksi pengguna.

---

## 5. Batasan di Luar Ruang Lingkup (Out of Scope / Non-MVP)

Fitur berikut **TIDAK** termasuk dalam ruang lingkup MVP saat ini dan dialokasikan untuk fase lanjutan:
1. **Integrasi Sensor IoT Pressure Gauge**: Pemasangan transmiter wireless IoT (LoRaWAN/Zigbee) pada manometer tabung untuk pembacaan tekanan real-time tanpa inspeksi manual.
2. **Integrasi ERP Pusat (MySAP Pertamina)**: Sinkronisasi otomatis aset logistik ke modul PM (*Plant Maintenance*) MySAP pusat.
3. **Pengadaan Suku Cadang & Pembayaran Vendor Otomatis**: Transaksi pengadaan tabung baru/isi ulang serbuk ke pihak ketiga via e-procurement.
4. **Offline-First PWA Background Sync**: Menjalankan inspeksi tanpa koneksi internet sama sekali. (Alasan: Verifikasi anti-fraud GPS dan timestamp server memerlukan jaminan validitas waktu riil online demi integritas HSSE).

---

## 6. Metrik Keberhasilan (Success Metrics & KPIs)

| Metrik Kinerja | Target Sasaran | Cara Pengukuran |
|---|---|---|
| **Tingkat Kesiapan APAR (*Readiness Rate*)** | $\ge 98\%$ | Persentase tabung berstatus `active` dibanding total tabung di FT Maos. |
| **Kepatuhan Jadwal Inspeksi (*Schedule Compliance*)** | $\ge 95\%$ | Jumlah inspeksi selesai tepat waktu dibanding total jadwal terbit. |
| **Pencegahan Manipulasi (*Anti-Fraud Integrity*)** | $100\%$ | Seluruh inspeksi memiliki koordinat GPS valid dan 2 foto kamera live. |
| **Rata-rata Waktu Perbaikan (*Mean Time to Repair - MTTR*)** | $< 48$ Jam | Waktu sejak temuan rusak diapprove hingga pengerjaan perbaikan selesai. |
| **Waktu Pembuatan Laporan Audit** | $< 1$ Menit | Export PDF/Excel satu klik menggantikan rekap manual 2-3 hari kerja. |

---

## 7. Kebutuhan Non-Fungsional (Non-Functional Requirements)

1. **Keandalan & Ketersediaan**: Sistem beroperasi 24/7 dengan target ketersediaan 99.5% untuk mendukung shift kerja operasional Fuel Terminal.
2. **Performa & Latensi**:
   - Pemindaian QR Code dan pemuatan form inspeksi $< 1.5$ detik pada jaringan 4G seluler.
   - Respon API backend rata-rata $< 250$ ms.
3. **Kompatibilitas Perangkat**:
   - Tampilan responsif adaptif untuk smartphone teknisi (layar 5–7 inci) dan layar desktop supervisor/admin (13–27 inci).
   - Mendukung peramban modern (Google Chrome Android/iOS, Safari Mobile, Edge).
4. **Keamanan Data**:
   - Enkripsi komunikasi via HTTPS/TLS 1.3.
   - Proteksi injeksi SQL via Eloquent parameter binding & sanitasi request.
   - Pembatasan ukuran dan sanitasi MIME type file gambar unggahan.