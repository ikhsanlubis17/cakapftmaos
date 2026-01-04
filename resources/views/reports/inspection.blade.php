<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan Inspeksi APAR</title>
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
        
        .condition-good {
            color: #059669;
            font-weight: bold;
        }
        
        .condition-bad {
            color: #dc2626;
            font-weight: bold;
        }
        
        .status-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .status-active {
            background-color: #d1fae5;
            color: #065f46;
        }
        
        .status-inactive {
            background-color: #fee2e2;
            color: #991b1b;
        }
        
        .status-needs-repair {
            background-color: #fef3c7;
            color: #92400e;
        }
        
        .status-under-repair {
            background-color: #dbeafe;
            color: #1e40af;
        }
        
        .status-not-fixable {
            background-color: #f3f4f6;
            color: #374151;
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
        
        .photo-placeholder {
            display: inline-block;
            width: 40px;
            height: 40px;
            background-color: #e5e7eb;
            border-radius: 4px;
            line-height: 40px;
            text-align: center;
            color: #6b7280;
            font-size: 8px;
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
        <div class="subtitle">Laporan Inspeksi APAR Sistem</div>
        <div class="meta">
            <div class="meta-row">
                <span class="meta-label">Periode:</span>
                <span>{{ $period }}</span>
            </div>
            <div class="meta-row">
                <span class="meta-label">Total Inspeksi:</span>
                <span>{{ $total_inspections }} inspeksi</span>
            </div>
            <div class="meta-row">
                <span class="meta-label">Dibuat pada:</span>
                <span>{{ $generated_at }}</span>
            </div>
        </div>
    </div>

    @if($inspections->count() > 0)
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th style="width: 5%;">No</th>
                        <th style="width: 12%;">Tanggal</th>
                        <th style="width: 12%;">Waktu</th>
                        <th style="width: 15%;">Serial Number</th>
                        <th style="width: 15%;">Lokasi</th>
                        <th style="width: 10%;">Tipe</th>
                        <th style="width: 8%;">Status</th>
                        <th style="width: 12%;">Teknisi</th>
                        <th style="width: 11%;">Kondisi</th>
                    </tr>
                </thead>
                <tbody>
                    @php $counter = 1; @endphp
                    @foreach($inspections as $inspection)
                        <tr>
                            <td>{{ $counter++ }}</td>
                            <td>{{ $inspection->created_at ? \Carbon\Carbon::parse($inspection->created_at)->format('d/m/Y') : '-' }}</td>
                            <td>{{ $inspection->created_at ? \Carbon\Carbon::parse($inspection->created_at)->format('H:i') : '-' }}</td>
                            <td>{{ $inspection->apar ? $inspection->apar->serial_number : '-' }}</td>
                            <td>{{ $inspection->apar ? $inspection->apar->location_name : '-' }}</td>
                            <td>{{ $inspection->apar ? strtoupper($inspection->apar->type) : '-' }}</td>
                            <td>
                                @if($inspection->apar)
                                    <span class="status-badge {{ getAparStatusClass($inspection->apar->status) }}">
                                        {{ getAparStatusLabel($inspection->apar->status) }}
                                    </span>
                                @else
                                    -
                                @endif
                            </td>
                            <td>{{ $inspection->user ? $inspection->user->name : '-' }}</td>
                            <td class="{{ $inspection->condition === 'good' ? 'condition-good' : 'condition-bad' }}">
                                {{ $inspection->condition ?? '-' }}
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <div style="margin-top: 20px; font-size: 10px; color: #6b7280;">
            <p><strong>Catatan:</strong> Laporan ini berisi daftar semua inspeksi APAR yang dilakukan dalam periode yang ditentukan.</p>
        </div>
    @else
        <div class="no-data">
            <p>Tidak ada data inspeksi untuk periode ini.</p>
            <p style="font-size: 10px; margin-top: 10px;">Silakan ubah filter periode atau tunggu data inspeksi masuk.</p>
        </div>
    @endif

    <div class="footer">
        <p>Dokumen ini dibuat secara otomatis oleh sistem CAKAP FT MAOS</p>
        <p>Untuk informasi lebih lanjut, hubungi administrator sistem</p>
        <p style="margin-top: 5px; font-size: 8px;">Generated at: {{ $generated_at }}</p>
    </div>
</body>
</html>