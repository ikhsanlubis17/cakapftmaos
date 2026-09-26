<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>{{ $title ?? 'Laporan Bulanan Operasional APAR & Mobil Tangki' }}</title>
    <style>
        @page {
            margin: 28px 30px 32px 30px;
            size: A4 portrait;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            font-size: 8.5pt;
            line-height: 1.35;
            color: #0f172a;
            background-color: #ffffff;
        }
        
        /* Kop Surat Pertamina */
        .kop-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
        }
        .kop-table td {
            vertical-align: middle;
            padding: 0;
        }
        .kop-title {
            font-size: 13pt;
            font-weight: bold;
            color: #041562;
            letter-spacing: 0.5px;
            margin: 0;
            line-height: 1.2;
        }
        .kop-subtitle {
            font-size: 9pt;
            font-weight: bold;
            color: #11468f;
            margin: 2px 0 0 0;
        }
        .kop-desc {
            font-size: 7.5pt;
            color: #64748b;
            margin: 2px 0 0 0;
        }
        .kop-badge {
            text-align: right;
        }
        .kop-badge-inner {
            display: inline-block;
            border: 1px solid #041562;
            padding: 4px 8px;
            background-color: #f8fafc;
            border-radius: 4px;
            text-align: right;
        }
        .kop-badge-title {
            font-size: 7.5pt;
            font-weight: bold;
            color: #041562;
            text-transform: uppercase;
        }
        .kop-badge-code {
            font-size: 6.5pt;
            color: #64748b;
            font-family: monospace;
        }

        /* Garis Pemisah Kop */
        .divider-navy {
            height: 3px;
            background-color: #041562;
            margin-top: 6px;
        }
        .divider-red {
            height: 1.5px;
            background-color: #da1212;
            margin-top: 1.5px;
            margin-bottom: 12px;
        }

        /* Judul Laporan */
        .report-header {
            text-align: center;
            margin-bottom: 12px;
        }
        .report-title {
            font-size: 13pt;
            font-weight: bold;
            color: #041562;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 3px 0;
        }
        .report-subtitle {
            font-size: 8.5pt;
            color: #475569;
            margin: 0;
        }

        /* Metadata Box */
        .meta-table {
            width: 100%;
            border-collapse: collapse;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-left: 4px solid #11468f;
            margin-bottom: 14px;
        }
        .meta-table td {
            padding: 5px 8px;
            font-size: 7.5pt;
        }
        .meta-label {
            font-weight: bold;
            color: #334155;
            width: 15%;
        }
        .meta-val {
            color: #0f172a;
            width: 35%;
        }

        /* KPI Cards Grid using Table */
        .kpi-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 6px 0;
            margin-bottom: 14px;
        }
        .kpi-table td {
            vertical-align: top;
            padding: 0;
        }
        .kpi-card {
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 8px 6px;
            text-align: center;
            background-color: #ffffff;
        }
        .kpi-navy { border-top: 3px solid #041562; background-color: #f8fafc; }
        .kpi-green { border-top: 3px solid #059669; background-color: #f0fdf4; }
        .kpi-red { border-top: 3px solid #da1212; background-color: #fef2f2; }
        .kpi-amber { border-top: 3px solid #d97706; background-color: #fffbeb; }

        .kpi-label {
            font-size: 6.5pt;
            font-weight: bold;
            text-transform: uppercase;
            color: #64748b;
            letter-spacing: 0.3px;
            margin-bottom: 2px;
        }
        .kpi-value {
            font-size: 15pt;
            font-weight: bold;
            color: #0f172a;
            line-height: 1.1;
        }
        .kpi-desc {
            font-size: 6.5pt;
            color: #64748b;
            margin-top: 2px;
        }

        /* Section Title */
        .section-heading {
            font-size: 9.5pt;
            font-weight: bold;
            color: #041562;
            border-bottom: 1.5px solid #041562;
            padding-bottom: 3px;
            margin: 12px 0 8px 0;
            text-transform: uppercase;
        }

        /* Data Tables */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
            font-size: 7.5pt;
        }
        .data-table th {
            background-color: #041562;
            color: #ffffff;
            font-weight: bold;
            text-align: left;
            padding: 5px 6px;
            font-size: 7pt;
            text-transform: uppercase;
            border: 1px solid #041562;
        }
        .data-table td {
            padding: 4.5px 6px;
            border: 1px solid #e2e8f0;
            color: #1e293b;
            vertical-align: middle;
        }
        .data-table tr:nth-child(even) {
            background-color: #f8fafc;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-mono { font-family: monospace; font-size: 7.5pt; font-weight: bold; }

        /* Badges */
        .badge {
            display: inline-block;
            padding: 2px 5px;
            border-radius: 3px;
            font-size: 6.5pt;
            font-weight: bold;
            text-align: center;
        }
        .badge-success { background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
        .badge-danger { background-color: #fff1f2; color: #be123c; border: 1px solid #fecdd3; }
        .badge-warning { background-color: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
        .badge-info { background-color: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }

        /* Signatures Block */
        .sign-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 18px;
            page-break-inside: avoid;
        }
        .sign-table td {
            width: 50%;
            vertical-align: top;
            padding: 0 10px;
        }
        .sign-box {
            text-align: center;
            font-size: 7.5pt;
            color: #334155;
        }
        .sign-space {
            height: 45px;
        }
        .sign-name {
            font-weight: bold;
            text-decoration: underline;
            color: #0f172a;
            font-size: 8pt;
        }
        .sign-title {
            color: #64748b;
            font-size: 7pt;
        }

        /* Footer */
        .footer {
            margin-top: 14px;
            border-top: 1px solid #e2e8f0;
            padding-top: 4px;
            font-size: 6.5pt;
            color: #94a3b8;
            text-align: center;
        }
    </style>
</head>
<body>
    <!-- Kop Surat Pertamina -->
    <table class="kop-table">
        <tr>
            <td style="width: 70%;">
                <div class="kop-title">PT PERTAMINA PATRA NIAGA</div>
                <div class="kop-subtitle">FUEL TERMINAL MAOS — INTEGRATED TERMINAL CILACAP</div>
                <div class="kop-desc">Sistem Monitoring dan Kesiapan APAR Modern (CAKAP FT MAOS)</div>
            </td>
            <td style="width: 30%;" class="kop-badge">
                <div class="kop-badge-inner">
                    <div class="kop-badge-title">HSSE Dokumen Vital</div>
                    <div class="kop-badge-code">DOC: FT-MAOS/RPT/BULANAN</div>
                </div>
            </td>
        </tr>
    </table>

    <div class="divider-navy"></div>
    <div class="divider-red"></div>

    <!-- Judul Laporan -->
    <div class="report-header">
        <div class="report-title">{{ $title }}</div>
        <div class="report-subtitle">Ringkasan Kesiapan Operasional Seluruh APAR dan Mobil Tangki Per Bulan</div>
    </div>

    <!-- Metadata Bar -->
    <table class="meta-table">
        <tr>
            <td class="meta-label">Periode Data:</td>
            <td class="meta-val"><strong>{{ $period }}</strong></td>
            <td class="meta-label">Status Siaga:</td>
            <td class="meta-val"><span class="badge badge-success">SIAGA TINGGI (OBVITNAS)</span></td>
        </tr>
        <tr>
            <td class="meta-label">Tanggal Cetak:</td>
            <td class="meta-val">{{ $generated_at }}</td>
            <td class="meta-label">Sistem Generator:</td>
            <td class="meta-val">CAKAP Platform FT Maos v2.0</td>
        </tr>
    </table>

    <!-- 4 KPI Box Summary -->
    <table class="kpi-table">
        <tr>
            <td style="width: 25%;">
                <div class="kpi-card kpi-navy">
                    <div class="kpi-label">Total Populasi APAR</div>
                    <div class="kpi-value">{{ $stats['total_apar'] }}</div>
                    <div class="kpi-desc">Unit terdaftar di sistem</div>
                </div>
            </td>
            <td style="width: 25%;">
                <div class="kpi-card kpi-green">
                    <div class="kpi-label">APAR Siap Operasi</div>
                    <div class="kpi-value">{{ $stats['active_apar'] }}</div>
                    <div class="kpi-desc">
                        @php
                            $pct = $stats['total_apar'] > 0 ? round(($stats['active_apar'] / $stats['total_apar']) * 100, 1) : 0;
                        @endphp
                        {{ $pct }}% Kesiapan Tabung
                    </div>
                </div>
            </td>
            <td style="width: 25%;">
                <div class="kpi-card kpi-amber">
                    <div class="kpi-label">Armada Mobil Tangki</div>
                    <div class="kpi-value">{{ $stats['total_tank_trucks'] ?? 0 }}</div>
                    <div class="kpi-desc">{{ $stats['active_tank_trucks'] ?? 0 }} Unit Siap Operasi</div>
                </div>
            </td>
            <td style="width: 25%;">
                <div class="kpi-card kpi-red">
                    <div class="kpi-label">Inspeksi Periode Ini</div>
                    <div class="kpi-value">{{ $stats['inspections_this_period'] ?? 0 }}</div>
                    <div class="kpi-desc">{{ $stats['inspections_damaged'] ?? 0 }} Temuan Kerusakan</div>
                </div>
            </td>
        </tr>
    </table>

    <!-- Ringkasan Status Tabung & Distribusi Lokasi -->
    <table style="width: 100%; border-collapse: separate; border-spacing: 8px 0; margin-bottom: 12px;">
        <tr>
            <!-- Kolom 1: Status Tabung -->
            <td style="width: 50%; vertical-align: top; padding: 0;">
                <div class="section-heading">Status Kesiapan APAR</div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Kondisi / Status</th>
                            <th class="text-center" style="width: 25%;">Jumlah</th>
                            <th class="text-center" style="width: 30%;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Siap Digunakan (Aktif)</strong></td>
                            <td class="text-center font-mono">{{ $stats['active_apar'] }} Unit</td>
                            <td class="text-center"><span class="badge badge-success">READY</span></td>
                        </tr>
                        <tr>
                            <td>Perlu Perbaikan (Temuan)</td>
                            <td class="text-center font-mono">{{ $stats['needs_repair'] }} Unit</td>
                            <td class="text-center"><span class="badge badge-danger">NEEDS REPAIR</span></td>
                        </tr>
                        <tr>
                            <td>Sedang Dikerjakan Teknisi</td>
                            <td class="text-center font-mono">{{ $stats['under_repair'] }} Unit</td>
                            <td class="text-center"><span class="badge badge-warning">IN REPAIR</span></td>
                        </tr>
                        <tr>
                            <td>Tidak Dapat Diperbaiki (Afkir)</td>
                            <td class="text-center font-mono">{{ $stats['not_fixable'] }} Unit</td>
                            <td class="text-center"><span class="badge badge-danger">SCRAP</span></td>
                        </tr>
                        <tr>
                            <td>Non-Aktif / Cadangan</td>
                            <td class="text-center font-mono">{{ $stats['inactive'] }} Unit</td>
                            <td class="text-center"><span class="badge badge-info">STANDBY</span></td>
                        </tr>
                    </tbody>
                </table>
            </td>

            <!-- Kolom 2: Distribusi Lokasi & Media -->
            <td style="width: 50%; vertical-align: top; padding: 0;">
                <div class="section-heading">Distribusi Lokasi & Penempatan</div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Kategori Penempatan</th>
                            <th class="text-center" style="width: 25%;">Jumlah</th>
                            <th class="text-center" style="width: 30%;">Keterangan</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>APAR Statis (Gedung & Area)</strong></td>
                            <td class="text-center font-mono">{{ $stats['location_types']['statis'] ?? 0 }} Unit</td>
                            <td class="text-center">Area Fasilitas FT</td>
                        </tr>
                        <tr>
                            <td><strong>APAR Mobile (Mobil Tangki)</strong></td>
                            <td class="text-center font-mono">{{ $stats['location_types']['mobile'] ?? 0 }} Unit</td>
                            <td class="text-center">Armada Distribusi</td>
                        </tr>
                        @if(!empty($stats['apar_types']))
                            @foreach(array_slice($stats['apar_types'], 0, 3, true) as $tName => $tCount)
                                <tr>
                                    <td>Media: {{ ucfirst($tName) }}</td>
                                    <td class="text-center font-mono">{{ $tCount }} Unit</td>
                                    <td class="text-center">Jenis Media</td>
                                </tr>
                            @endforeach
                        @endif
                    </tbody>
                </table>
            </td>
        </tr>
    </table>

    <!-- Tabel Detail Log Inspeksi Periode Terkini -->
    <div class="section-heading">Rincian Inspeksi Lapangan Terbaru Dalam Periode</div>
    <table class="data-table">
        <thead>
            <tr>
                <th class="text-center" style="width: 5%;">No</th>
                <th class="text-center" style="width: 11%;">Tanggal</th>
                <th style="width: 16%;">No. Seri APAR</th>
                <th style="width: 26%;">Lokasi / Unit Penempatan</th>
                <th style="width: 14%;">Teknisi</th>
                <th class="text-center" style="width: 14%;">Hasil Cek</th>
                <th style="width: 14%;">Catatan</th>
            </tr>
        </thead>
        <tbody>
            @php $count = 1; @endphp
            @forelse($inspections->take(15) as $insp)
                <tr>
                    <td class="text-center">{{ $count++ }}</td>
                    <td class="text-center">{{ $insp->created_at ? \Carbon\Carbon::parse($insp->created_at)->format('d/m/Y H:i') : '-' }}</td>
                    <td class="font-mono">{{ $insp->apar ? $insp->apar->serial_number : '-' }}</td>
                    <td>{{ $insp->apar ? $insp->apar->location_name : '-' }}</td>
                    <td>{{ $insp->user ? $insp->user->name : '-' }}</td>
                    <td class="text-center">
                        @if($insp->condition === 'good')
                            <span class="badge badge-success">BAIK (READY)</span>
                        @else
                            <span class="badge badge-danger">RUSAK / TEMUAN</span>
                        @endif
                    </td>
                    <td>{{ $insp->notes ?: '-' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="7" class="text-center" style="padding: 10px; color: #64748b;">
                        Tidak ada riwayat inspeksi pada periode yang dipilih.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>
    @if(count($inspections) > 15)
        <div style="font-size: 6.5pt; color: #64748b; font-style: italic; margin-top: -6px; margin-bottom: 10px;">
            * Menampilkan 15 dari {{ count($inspections) }} total inspeksi. Untuk rekapitulasi data lengkap seluruh inspeksi, unduh berkas versi Excel.
        </div>
    @endif

    <!-- Lembar Pengesahan -->
    <table class="sign-table">
        <tr>
            <td>
                <div class="sign-box">
                    <div>Maos, {{ now()->format('d F Y') }}</div>
                    <div>Dibuat oleh:</div>
                    <div style="font-weight: bold; color: #041562;">Teknisi Pemeliharaan APAR / Sistem</div>
                    <div class="sign-space"></div>
                    <div class="sign-name">TIM TEKNISI HSSE FT MAOS</div>
                    <div class="sign-title">Pelaksana Inspeksi Lapangan</div>
                </div>
            </td>
            <td>
                <div class="sign-box">
                    <div>Mengetahui & Menyetujui,</div>
                    <div>Fuel Terminal Maos</div>
                    <div style="font-weight: bold; color: #041562;">Jr. Officer II HSSE / FT Manager</div>
                    <div class="sign-space"></div>
                    <div class="sign-name">SUPERVISOR HSSE FT MAOS</div>
                    <div class="sign-title">Penanggung Jawab Keselamatan Kerja</div>
                </div>
            </td>
        </tr>
    </table>

    <div class="footer">
        Dokumen ini dihasilkan secara otomatis oleh Sistem CAKAP FT MAOS (PT Pertamina Patra Niaga). Berlaku sebagai arsip kendali mutu proteksi kebakaran Objek Vital Nasional.
    </div>
</body>
</html>
