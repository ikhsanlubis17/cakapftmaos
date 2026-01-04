<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan Jadwal Terlambat</title>
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
            background-color: #fef2f2;
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
        
        .warning-box {
            background-color: #fef2f2;
            border: 2px solid #dc2626;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
        }
        
        .warning-box .total {
            font-size: 32px;
            font-weight: bold;
            color: #dc2626;
            margin: 5px 0;
        }
        
        .warning-box .label {
            font-size: 12px;
            color: #991b1b;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .table-container {
            margin: 20px 0;
            overflow-x: auto;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
            font-size: 10px;
        }
        
        thead {
            background-color: #dc2626;
            color: white;
        }
        
        th {
            padding: 10px 8px;
            text-align: left;
            font-weight: bold;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        td {
            padding: 8px;
            border-bottom: 1px solid #e5e7eb;
            vertical-align: top;
        }
        
        tbody tr:nth-child(even) {
            background-color: #f9fafb;
        }
        
        tbody tr:hover {
            background-color: #fef2f2;
        }
        
        .no-data {
            text-align: center;
            padding: 40px;
            color: #6b7280;
            font-size: 12px;
            font-style: italic;
        }
        
        .overdue-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            background-color: #dc2626;
            color: white;
        }
        
        .frequency-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            background-color: #fef3c7;
            color: #92400e;
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
        
        .action-box {
            background-color: #fffbeb;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
        }
        
        .action-box h3 {
            color: #92400e;
            margin: 0 0 10px 0;
            font-size: 12px;
            text-transform: uppercase;
        }
        
        .action-box ul {
            margin: 5px 0 0 20px;
            padding: 0;
            font-size: 10px;
            color: #78350f;
        }
        
        .action-box li {
            margin: 5px 0;
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
        <div class="subtitle">Laporan Jadwal Inspeksi Terlambat</div>
        <div class="meta">
            <div class="meta-row">
                <span class="meta-label">Total Jadwal Terlambat:</span>
                <span>{{ $total_overdue }} jadwal</span>
            </div>
            <div class="meta-row">
                <span class="meta-label">Dibuat pada:</span>
                <span>{{ $generated_at }}</span>
            </div>
        </div>
    </div>

    @if($total_overdue > 0)
        <div class="warning-box">
            <div class="label">Total Jadwal Terlambat</div>
            <div class="total">{{ $total_overdue }}</div>
            <div style="color: #7f1d1d; font-size: 10px;">Membutuhkan perhatian segera</div>
        </div>

        <div class="action-box">
            <h3>Tindakan yang Diperlukan:</h3>
            <ul>
                <li>Kontak teknisi yang terkait untuk menindaklanjuti jadwal terlambat</li>
                <li>Evaluasi kembali frekuensi inspeksi jika banyak jadwal terlambat</li>
                <li>Perbarui jadwal inspeksi untuk APAR yang sering terlambat</li>
                <li>Dokumentasikan alasan keterlambatan untuk analisis lebih lanjut</li>
            </ul>
        </div>

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th style="width: 5%;">No</th>
                        <th style="width: 12%;">Jadwal</th>
                        <th style="width: 10%;">Waktu</th>
                        <th style="width: 13%;">Serial Number</th>
                        <th style="width: 18%;">Lokasi</th>
                        <th style="width: 10%;">Tipe</th>
                        <th style="width: 12%;">Teknisi</th>
                        <th style="width: 10%;">Frekuensi</th>
                        <th style="width: 10%;">Hari Terlambat</th>
                    </tr>
                </thead>
                <tbody>
                    @php $counter = 1; @endphp
                    @foreach($overdue_schedules as $schedule)
                        @php
                            $scheduledDate = \Carbon\Carbon::parse($schedule->start_at);
                            $daysOverdue = $scheduledDate->diffInDays(\Carbon\Carbon::now());
                        @endphp
                        <tr>
                            <td>{{ $counter++ }}</td>
                            <td>{{ $scheduledDate->format('d/m/Y') }}</td>
                            <td>{{ $scheduledDate->format('H:i') }}</td>
                            <td>{{ $schedule->apar ? $schedule->apar->serial_number : '-' }}</td>
                            <td>{{ $schedule->apar ? $schedule->apar->location_name : '-' }}</td>
                            <td>{{ $schedule->apar ? strtoupper($schedule->apar->type) : '-' }}</td>
                            <td>{{ $schedule->assignedUser ? $schedule->assignedUser->name : '-' }}</td>
                            <td>
                                <span class="frequency-badge">
                                    {{ getFrequencyLabel($schedule->frequency) }}
                                </span>
                            </td>
                            <td>
                                <span class="overdue-badge">{{ $daysOverdue }} hari</span>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <div style="margin-top: 20px; font-size: 10px; color: #6b7280;">
            <p><strong>Catatan:</strong> Jadwal dihitung terlambat jika melewati tanggal yang dijadwalkan tetapi belum dilaksanakan.</p>
        </div>
    @else
        <div class="no-data">
            <p>Tidak ada jadwal terlambat saat ini.</p>
            <p style="font-size: 10px; margin-top: 10px;">Semua jadwal inspeksi berjalan sesuai rencana.</p>
        </div>
    @endif

    <div class="footer">
        <p>Dokumen ini dibuat secara otomatis oleh sistem CAKAP FT MAOS</p>
        <p>Untuk informasi lebih lanjut, hubungi administrator sistem</p>
        <p style="margin-top: 5px; font-size: 8px;">Generated at: {{ $generated_at }}</p>
    </div>
</body>
</html>