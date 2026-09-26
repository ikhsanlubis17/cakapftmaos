<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>{{ $title ?? 'Laporan Audit Log & Jejak Digital Operasional' }}</title>
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

        .meta-table {
            width: 100%;
            border-collapse: collapse;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-left: 4px solid #041562;
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
        .kpi-navy { border-top: 3px solid #041562; background-color: #f8fafc; }
        .kpi-green { border-top: 3px solid #059669; background-color: #f0fdf4; }
        .kpi-red { border-top: 3px solid #da1212; background-color: #fef2f2; }
        .kpi-blue { border-top: 3px solid #11468f; background-color: #eff6ff; }

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
        .badge-info { background-color: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }

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
                    <div class="kop-badge-title">Jejak Digital Audit</div>
                    <div class="kop-badge-code">DOC: FT-MAOS/RPT/AUDIT-LOG</div>
                </div>
            </td>
        </tr>
    </table>

    <div class="divider-navy"></div>
    <div class="divider-red"></div>

    <div class="report-header">
        <div class="report-title">{{ $title }}</div>
        <div class="report-subtitle">Jejak Aktivitas Digital Teknisi Lapangan dan Riwayat Operasional Sistem</div>
    </div>

    <table class="meta-table">
        <tr>
            <td class="meta-label">Periode Audit:</td>
            <td class="meta-val"><strong>{{ $period }}</strong></td>
            <td class="meta-label">Integritas Log:</td>
            <td class="meta-val"><span class="badge badge-success">TERVERIFIKASI SISTEM (TAMPER-PROOF)</span></td>
        </tr>
        <tr>
            <td class="meta-label">Tanggal Cetak:</td>
            <td class="meta-val">{{ $generated_at }}</td>
            <td class="meta-label">Petugas Aktif:</td>
            <td class="meta-val">{{ $stats['unique_users'] ?? 0 }} Pengguna</td>
        </tr>
    </table>

    <table class="kpi-table">
        <tr>
            <td style="width: 25%;">
                <div class="kpi-card kpi-navy">
                    <div class="kpi-label">Total Aktivitas</div>
                    <div class="kpi-value">{{ $stats['total_logs'] ?? 0 }}</div>
                    <div class="kpi-desc">Transaksi tercatat</div>
                </div>
            </td>
            <td style="width: 25%;">
                <div class="kpi-card kpi-green">
                    <div class="kpi-label">Aktivitas Berhasil</div>
                    <div class="kpi-value">{{ $stats['successful_logs'] ?? 0 }}</div>
                    <div class="kpi-desc">Verifikasi valid</div>
                </div>
            </td>
            <td style="width: 25%;">
                <div class="kpi-card kpi-red">
                    <div class="kpi-label">Aktivitas Ditolak/Gagal</div>
                    <div class="kpi-value">{{ $stats['failed_logs'] ?? 0 }}</div>
                    <div class="kpi-desc">Validasi anti-fraud</div>
                </div>
            </td>
            <td style="width: 25%;">
                <div class="kpi-card kpi-blue">
                    <div class="kpi-label">APAR Terlibat</div>
                    <div class="kpi-value">{{ $stats['unique_apars'] ?? 0 }}</div>
                    <div class="kpi-desc">Unit tabung terpindai</div>
                </div>
            </td>
        </tr>
    </table>

    <div class="section-heading">Detail Catatan Jejak Digital Lapangan</div>
    <table class="data-table">
        <thead>
            <tr>
                <th class="text-center" style="width: 5%;">No</th>
                <th class="text-center" style="width: 14%;">Waktu & Tanggal</th>
                <th style="width: 17%;">Petugas / Teknisi</th>
                <th style="width: 15%;">No. Seri APAR</th>
                <th style="width: 18%;">Aktivitas / Aksi</th>
                <th class="text-center" style="width: 12%;">Status</th>
                <th style="width: 19%;">Keterangan & IP</th>
            </tr>
        </thead>
        <tbody>
            @php $count = 1; @endphp
            @forelse($audit_logs->take(18) as $log)
                <tr>
                    <td class="text-center">{{ $count++ }}</td>
                    <td class="text-center font-mono">{{ $log->created_at ? \Carbon\Carbon::parse($log->created_at)->format('d/m/Y H:i') : '-' }}</td>
                    <td>{{ $log->user ? $log->user->name : 'Sistem / Anonim' }}</td>
                    <td class="font-mono">{{ $log->apar ? $log->apar->serial_number : '-' }}</td>
                    <td>
                        @php
                            $actionLabel = match($log->action) {
                                'scan_qr' => 'Scan QR Code',
                                'start_inspection' => 'Mulai Inspeksi',
                                'submit_inspection' => 'Submit Inspeksi',
                                'validation_failed' => 'Validasi Gagal',
                                default => ucfirst(str_replace('_', ' ', (string) $log->action))
                            };
                        @endphp
                        {{ $actionLabel }}
                    </td>
                    <td class="text-center">
                        @if($log->is_successful)
                            <span class="badge badge-success">BERHASIL</span>
                        @else
                            <span class="badge badge-danger">DITOLAK</span>
                        @endif
                    </td>
                    <td>
                        <span style="font-size: 6.5pt; color: #64748b;">IP: {{ $log->ip_address ?? '-' }}</span><br>
                        {{ $log->details ?: '-' }}
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="7" class="text-center" style="padding: 10px; color: #64748b;">
                        Belum ada jejak aktivitas audit log pada rentang periode yang dipilih.
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
                    <div>Diverifikasi oleh:</div>
                    <div style="font-weight: bold; color: #041562;">Administrator Sistem IT CAKAP</div>
                    <div class="sign-space"></div>
                    <div class="sign-name">ADMIN IT & DATA SYSTEM</div>
                    <div class="sign-title">Penjaga Integritas Data Operasional</div>
                </div>
            </td>
            <td>
                <div class="sign-box">
                    <div>Mengetahui & Menyetujui,</div>
                    <div>Fuel Terminal Maos</div>
                    <div style="font-weight: bold; color: #041562;">Jr. Officer II HSSE / FT Manager</div>
                    <div class="sign-space"></div>
                    <div class="sign-name">SUPERVISOR HSSE FT MAOS</div>
                    <div class="sign-title">Penanggung Jawab Kepatuhan & Audit</div>
                </div>
            </td>
        </tr>
    </table>

    <div class="footer">
        Dokumen ini dihasilkan secara otomatis oleh Sistem CAKAP FT MAOS (PT Pertamina Patra Niaga). Berlaku sebagai arsip kendali mutu proteksi kebakaran Objek Vital Nasional.
    </div>
</body>
</html>