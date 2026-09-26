<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>{{ $title ?? 'Laporan Analisis Kesiapan Proteksi Kebakaran FT Maos' }}</title>
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
            border: 1px solid #059669;
            padding: 4px 8px;
            background-color: #ecfdf5;
            border-radius: 4px;
            text-align: right;
        }
        .kop-badge-title {
            font-size: 7.5pt;
            font-weight: bold;
            color: #047857;
            text-transform: uppercase;
        }
        .kop-badge-code {
            font-size: 6.5pt;
            color: #64748b;
            font-family: monospace;
        }

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

        /* Hero Readiness Score Box */
        .score-box {
            width: 100%;
            border-collapse: collapse;
            background-color: #041562;
            color: #ffffff;
            border-radius: 6px;
            margin-bottom: 12px;
        }
        .score-box td {
            padding: 10px 14px;
            vertical-align: middle;
        }
        .score-value {
            font-size: 24pt;
            font-weight: bold;
            color: #38bdf8;
            line-height: 1;
        }
        .score-title {
            font-size: 11pt;
            font-weight: bold;
            color: #ffffff;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .score-desc {
            font-size: 7.5pt;
            color: #cbd5e1;
            margin-top: 2px;
        }
        .score-tag {
            display: inline-block;
            background-color: #059669;
            color: #ffffff;
            font-size: 8pt;
            font-weight: bold;
            padding: 4px 8px;
            border-radius: 4px;
            text-align: center;
        }

        .meta-table {
            width: 100%;
            border-collapse: collapse;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-left: 4px solid #059669;
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
        .kpi-green { border-top: 3px solid #059669; background-color: #f0fdf4; }
        .kpi-navy { border-top: 3px solid #041562; background-color: #f8fafc; }
        .kpi-amber { border-top: 3px solid #d97706; background-color: #fffbeb; }
        .kpi-red { border-top: 3px solid #da1212; background-color: #fef2f2; }

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

        .section-heading {
            font-size: 9.5pt;
            font-weight: bold;
            color: #041562;
            border-bottom: 1.5px solid #041562;
            padding-bottom: 3px;
            margin: 14px 0 8px 0;
            text-transform: uppercase;
        }

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
        .font-mono { font-family: monospace; font-size: 7.5pt; font-weight: bold; }

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
    <table class="kop-table">
        <tr>
            <td style="width: 70%;">
                <div class="kop-title">PT PERTAMINA PATRA NIAGA</div>
                <div class="kop-subtitle">FUEL TERMINAL MAOS — INTEGRATED TERMINAL CILACAP</div>
                <div class="kop-desc">Sistem Monitoring dan Kesiapan APAR Modern (CAKAP FT MAOS)</div>
            </td>
            <td style="width: 30%;" class="kop-badge">
                <div class="kop-badge-inner">
                    <div class="kop-badge-title">Analisis Proteksi Kebakaran</div>
                    <div class="kop-badge-code">DOC: FT-MAOS/RPT/KESIAPAN</div>
                </div>
            </td>
        </tr>
    </table>

    <div class="divider-navy"></div>
    <div class="divider-red"></div>

    <div class="report-header">
        <div class="report-title">{{ $title }}</div>
        <div class="report-subtitle">Analisis Kesiapan Proteksi Kebakaran Objek Vital Nasional FT Maos</div>
    </div>

    <!-- Hero Score Box -->
    <table class="score-box">
        <tr>
            <td style="width: 25%; text-align: center; border-right: 1px solid #1e3a8a;">
                <div class="score-value">{{ $readiness_index }}%</div>
                <div style="font-size: 7.5pt; color: #93c5fd; text-transform: uppercase;">Indeks Kesiapan</div>
            </td>
            <td style="width: 50%;">
                <div class="score-title">Status Siaga Proteksi Kebakaran Obvitnas</div>
                <div class="score-desc">
                    Tingkat kesiapan proteksi kebakaran di Fuel Terminal Maos berada dalam kategori prima. Seluruh peralatan siap memitigasi risiko keselamatan operasional.
                </div>
            </td>
            <td style="width: 25%; text-align: center;">
                <div class="score-tag">
                    {{ $readiness_index >= 95 ? 'SIAGA TINGGI (PRIMA)' : ($readiness_index >= 85 ? 'SIAGA SEDANG' : 'PERHATIAN KHUSUS') }}
                </div>
            </td>
        </tr>
    </table>

    <table class="meta-table">
        <tr>
            <td class="meta-label">Periode Evaluasi:</td>
            <td class="meta-val"><strong>{{ $period }}</strong></td>
            <td class="meta-label">Standar Rujukan:</td>
            <td class="meta-val">NFPA 10 & HSSE Pertamina Corporate</td>
        </tr>
        <tr>
            <td class="meta-label">Tanggal Cetak:</td>
            <td class="meta-val">{{ $generated_at }}</td>
            <td class="meta-label">Verifikasi Data:</td>
            <td class="meta-val">Digital Telemetri CAKAP FT Maos</td>
        </tr>
    </table>

    <table class="kpi-table">
        <tr>
            <td style="width: 25%;">
                <div class="kpi-card kpi-navy">
                    <div class="kpi-label">Populasi Total APAR</div>
                    <div class="kpi-value">{{ $stats['total_apar'] }}</div>
                    <div class="kpi-desc">Unit terdata resmi</div>
                </div>
            </td>
            <td style="width: 25%;">
                <div class="kpi-card kpi-green">
                    <div class="kpi-label">APAR Siap Siaga (Ready)</div>
                    <div class="kpi-value">{{ $stats['ready_apar'] }}</div>
                    <div class="kpi-desc">Tabung kondisi prima</div>
                </div>
            </td>
            <td style="width: 25%;">
                <div class="kpi-card kpi-amber">
                    <div class="kpi-label">Armada Mobil Tangki</div>
                    <div class="kpi-value">{{ $stats['tank_trucks_ready'] }} / {{ $stats['total_tank_trucks'] }}</div>
                    <div class="kpi-desc">Unit mobil tangki siaga</div>
                </div>
            </td>
            <td style="width: 25%;">
                <div class="kpi-card kpi-red">
                    <div class="kpi-label">Jadwal Overdue</div>
                    <div class="kpi-value">{{ $stats['overdue_schedules_count'] }}</div>
                    <div class="kpi-desc">Jadwal perlu mitigasi</div>
                </div>
            </td>
        </tr>
    </table>

    <!-- Tabel Analisis Kesiapan Per Zona Strategis -->
    <div class="section-heading">Analisis Kesiapan Proteksi Per Zona Strategis Objek Vital</div>
    <table class="data-table">
        <thead>
            <tr>
                <th class="text-center" style="width: 5%;">No</th>
                <th style="width: 32%;">Zona / Area Fasilitas FT Maos</th>
                <th class="text-center" style="width: 15%;">Total Tabung</th>
                <th class="text-center" style="width: 15%;">Tabung Siap</th>
                <th class="text-center" style="width: 15%;">Persentase</th>
                <th class="text-center" style="width: 18%;">Status Kesiapan</th>
            </tr>
        </thead>
        <tbody>
            @php $zCount = 1; @endphp
            @forelse($zone_distribution as $zone)
                @php
                    $zPct = $zone['total'] > 0 ? round(($zone['ready'] / $zone['total']) * 100, 1) : 0;
                    $badgeCls = $zPct >= 95 ? 'badge-success' : ($zPct >= 80 ? 'badge-warning' : 'badge-danger');
                    $badgeTxt = $zPct >= 95 ? 'SIAGA TINGGI' : ($zPct >= 80 ? 'SIAGA SEDANG' : 'PERHATIAN');
                @endphp
                <tr>
                    <td class="text-center">{{ $zCount++ }}</td>
                    <td><strong>{{ $zone['name'] }}</strong></td>
                    <td class="text-center font-mono">{{ $zone['total'] }} Unit</td>
                    <td class="text-center font-mono">{{ $zone['ready'] }} Unit</td>
                    <td class="text-center font-mono">{{ $zPct }}%</td>
                    <td class="text-center"><span class="badge {{ $badgeCls }}">{{ $badgeTxt }}</span></td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" class="text-center" style="padding: 10px; color: #64748b;">
                        Data distribusi zona tidak tersedia.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <!-- Tabel Pengawasan Jadwal Inspeksi Terlambat (Overdue) -->
    <div class="section-heading">Pengawasan Jadwal Inspeksi Terlambat (Overdue) Yang Memerlukan Tindakan</div>
    <table class="data-table">
        <thead>
            <tr>
                <th class="text-center" style="width: 5%;">No</th>
                <th style="width: 16%;">No. Seri APAR</th>
                <th style="width: 25%;">Lokasi Penempatan</th>
                <th style="width: 15%;">Tipe Media</th>
                <th class="text-center" style="width: 15%;">Batas Waktu</th>
                <th class="text-center" style="width: 12%;">Keterlambatan</th>
                <th style="width: 12%;">Teknisi</th>
            </tr>
        </thead>
        <tbody>
            @php $oCount = 1; @endphp
            @forelse($overdue_schedules->take(10) as $sch)
                @php
                    $apar = $sch->apar;
                    $startAt = $sch->start_at ? \Carbon\Carbon::parse($sch->start_at) : null;
                    $days = $startAt ? (int) $startAt->diffInDays(now()) : 0;
                @endphp
                <tr>
                    <td class="text-center">{{ $oCount++ }}</td>
                    <td class="font-mono">{{ $apar ? $apar->serial_number : '-' }}</td>
                    <td>{{ $apar ? $apar->location_name : '-' }}</td>
                    <td>{{ strtoupper((string) ($apar?->aparType?->name ?? $apar?->type ?? '-')) }}</td>
                    <td class="text-center">{{ $startAt ? $startAt->format('d/m/Y') : '-' }}</td>
                    <td class="text-center"><span class="badge badge-danger">{{ $days }} Hari</span></td>
                    <td>{{ $sch->assignedUser ? $sch->assignedUser->name : 'Belum Ditugaskan' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="7" class="text-center" style="padding: 10px; color: #047857;">
                        Seluruh jadwal inspeksi terlaksana tepat waktu. Tidak ada jadwal inspeksi yang terlambat (Overdue).
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <table class="sign-table">
        <tr>
            <td>
                <div class="sign-box">
                    <div>Maos, {{ now()->format('d F Y') }}</div>
                    <div>Dianalisis oleh:</div>
                    <div style="font-weight: bold; color: #041562;">Sistem Otomatisasi HSSE CAKAP</div>
                    <div class="sign-space"></div>
                    <div class="sign-name">TIM DATA HSSE FT MAOS</div>
                    <div class="sign-title">Monitoring Kesiapan Proteksi Obvitnas</div>
                </div>
            </td>
            <td>
                <div class="sign-box">
                    <div>Mengetahui & Menyetujui,</div>
                    <div>Fuel Terminal Maos</div>
                    <div style="font-weight: bold; color: #041562;">Jr. Officer II HSSE / FT Manager</div>
                    <div class="sign-space"></div>
                    <div class="sign-name">SUPERVISOR HSSE FT MAOS</div>
                    <div class="sign-title">Penanggung Jawab Kesiapan Fasilitas</div>
                </div>
            </td>
        </tr>
    </table>

    <div class="footer">
        Dokumen ini dihasilkan secara otomatis oleh Sistem CAKAP FT MAOS (PT Pertamina Patra Niaga). Berlaku sebagai arsip kendali mutu proteksi kebakaran Objek Vital Nasional.
    </div>
</body>
</html>
