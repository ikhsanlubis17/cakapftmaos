<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan Audit Log APAR</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 11px;
            line-height: 1.4;
            background-color: #ffffff;
            color: #1f2937;
        }
        
        .header {
            text-align: center;
            margin-bottom: 25px;
            border-bottom: 3px solid #dc2626;
            padding-bottom: 15px;
        }
        
        .header h1 {
            color: #dc2626;
            margin: 0 0 10px 0;
            font-size: 20px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .header .subtitle {
            margin: 5px 0;
            color: #6b7280;
            font-size: 11px;
        }
        
        .header .meta {
            margin-top: 10px;
            padding: 10px;
            background-color: #f9fafb;
            border-radius: 5px;
            border-left: 4px solid #dc2626;
            text-align: left;
            font-size: 10px;
        }
        
        .meta-row {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
        }
        
        .meta-label {
            font-weight: bold;
            color: #374151;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin: 20px 0;
        }
        
        .stat-card {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 12px;
            text-align: center;
        }
        
        .stat-card.success {
            background-color: #ecfdf5;
            border-left: 3px solid #059669;
        }
        
        .stat-card.danger {
            background-color: #fef2f2;
            border-left: 3px solid #dc2626;
        }
        
        .stat-card.info {
            background-color: #eff6ff;
            border-left: 3px solid #3b82f6;
        }
        
        .stat-label {
            font-size: 9px;
            color: #6b7280;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .stat-value {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
        }
        
        .actions-breakdown {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
        }
        
        .actions-breakdown h3 {
            margin: 0 0 10px 0;
            font-size: 12px;
            color: #374151;
        }
        
        .action-items {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        
        .action-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            background-color: #dbeafe;
            color: #1e40af;
        }
        
        .table-container {
            margin: 20px 0;
            overflow-x: auto;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
            font-size: 9px;
        }
        
        thead {
            background-color: #374151;
            color: white;
        }
        
        th {
            padding: 8px 6px;
            text-align: left;
            font-weight: bold;
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        td {
            padding: 6px;
            border-bottom: 1px solid #e5e7eb;
            vertical-align: top;
            word-wrap: break-word;
            max-width: 150px;
        }
        
        tbody tr:nth-child(even) {
            background-color: #f9fafb;
        }
        
        tbody tr:hover {
            background-color: #f3f4f6;
        }
        
        .no-data {
            text-align: center;
            padding: 40px;
            color: #6b7280;
            font-size: 12px;
            font-style: italic;
        }
        
        .status-success {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 8px;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            background-color: #d1fae5;
            color: #065f46;
        }
        
        .status-failed {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 8px;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            background-color: #fee2e2;
            color: #991b1b;
        }
        
        .action-scan {
            color: #3b82f6;
            font-weight: bold;
        }
        
        .action-inspection {
            color: #059669;
            font-weight: bold;
        }
        
        .action-validation {
            color: #dc2626;
            font-weight: bold;
        }
        
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 9px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            padding-top: 15px;
        }
        
        .footer p {
            margin: 3px 0;
        }
        
        @media print {
            body {
                background-color: white;
            }
            
            table {
                page-break-inside: auto;
            }
            
            tr {
                page-break-inside: avoid;
                page-break-after: auto;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $title }}</h1>
        <div class="subtitle">Audit Log Aktivitas Inspeksi APAR</div>
        <div class="meta">
            <div class="meta-row">
                <span class="meta-label">Periode:</span>
                <span>{{ $period }}</span>
            </div>
            <div class="meta-row">
                <span class="meta-label">Dibuat pada:</span>
                <span>{{ $generated_at }}</span>
            </div>
        </div>
    </div>

    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-label">Total Logs</div>
            <div class="stat-value">{{ $stats['total_logs'] }}</div>
        </div>
        
        <div class="stat-card success">
            <div class="stat-label">Berhasil</div>
            <div class="stat-value">{{ $stats['successful_logs'] }}</div>
        </div>
        
        <div class="stat-card danger">
            <div class="stat-label">Gagal</div>
            <div class="stat-value">{{ $stats['failed_logs'] }}</div>
        </div>
        
        <div class="stat-card info">
            <div class="stat-label">Success Rate</div>
            <div class="stat-value">
                @if($stats['total_logs'] > 0)
                    {{ round(($stats['successful_logs'] / $stats['total_logs']) * 100, 1) }}%
                @else
                    0%
                @endif
            </div>
        </div>
    </div>

    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 20px 0;">
        <div style="background-color: #eff6ff; border: 1px solid #dbeafe; border-radius: 6px; padding: 12px;">
            <div class="stat-label">Teknisi Aktif</div>
            <div class="stat-value" style="text-align: center; font-size: 24px;">{{ $stats['unique_users'] }}</div>
        </div>
        
        <div style="background-color: #f0fdf4; border: 1px solid #dcfce7; border-radius: 6px; padding: 12px;">
            <div class="stat-label">APAR Terlibat</div>
            <div class="stat-value" style="text-align: center; font-size: 24px;">{{ $stats['unique_apars'] }}</div>
        </div>
    </div>

    <div class="actions-breakdown">
        <h3>Distribusi Aksi</h3>
        <div class="action-items">
            @foreach($stats['actions_breakdown'] as $action => $count)
                <span class="action-badge">
                    {{ getActionLabel($action) }}: {{ $count }}
                </span>
            @endforeach
        </div>
    </div>

    @if($audit_logs->count() > 0)
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th style="width: 4%;">No</th>
                        <th style="width: 12%;">Waktu</th>
                        <th style="width: 12%;">Teknisi</th>
                        <th style="width: 10%;">APAR</th>
                        <th style="width: 15%;">Aksi</th>
                        <th style="width: 10%;">IP Address</th>
                        <th style="width: 10%;">Koordinat</th>
                        <th style="width: 8%;">Status</th>
                        <th style="width: 19%;">Detail</th>
                    </tr>
                </thead>
                <tbody>
                    @php $counter = 1; @endphp
                    @foreach($audit_logs as $log)
                        <tr>
                            <td>{{ $counter++ }}</td>
                            <td>{{ $log->created_at ? \Carbon\Carbon::parse($log->created_at)->format('d/m/Y H:i') : '-' }}</td>
                            <td>{{ $log->user ? $log->user->name : 'N/A' }}</td>
                            <td>{{ $log->apar ? $log->apar->serial_number : 'N/A' }}</td>
                            <td class="action-{{ getActionClass($log->action) }}">
                                {{ getActionLabel($log->action) }}
                            </td>
                            <td>{{ $log->ip_address ?? 'N/A' }}</td>
                            <td>
                                @if($log->lat && $log->lng)
                                    {{ number_format($log->lat, 6) }}, {{ number_format($log->lng, 6) }}
                                @else
                                    N/A
                                @endif
                            </td>
                            <td>
                                @if($log->is_successful)
                                    <span class="status-success">Berhasil</span>
                                @else
                                    <span class="status-failed">Gagal</span>
                                @endif
                            </td>
                            <td style="font-size: 8px; max-width: 150px; word-wrap: break-word;">{{ $log->details ?? '-' }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <div style="margin-top: 20px; font-size: 10px; color: #6b7280;">
            <p><strong>Catatan:</strong> Log audit mencatat semua aktivitas inspeksi termasuk scan QR, submit inspeksi, dan validasi.</p>
        </div>
    @else
        <div class="no-data">
            <p>Tidak ada data audit log untuk periode ini.</p>
            <p style="font-size: 10px; margin-top: 10px;">Silakan ubah filter periode atau tunggu data aktivitas masuk.</p>
        </div>
    @endif

    <div class="footer">
        <p>Dokumen ini dibuat secara otomatis oleh sistem {{ setting('site_name', config('app.name', 'CAKAP FT MAOS')) }}</p>
        <p>Untuk informasi lebih lanjut, hubungi administrator sistem</p>
        <p style="margin-top: 5px; font-size: 8px;">Generated at: {{ $generated_at }}</p>
    </div>
</body>
</html>