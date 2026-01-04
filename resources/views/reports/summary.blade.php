<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan Ringkasan APAR</title>
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
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 20px 0;
        }
        
        .stat-card {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .stat-card.primary {
            background-color: #fef2f2;
            border-left: 4px solid #dc2626;
        }
        
        .stat-card.success {
            background-color: #ecfdf5;
            border-left: 4px solid #059669;
        }
        
        .stat-card.warning {
            background-color: #fffbeb;
            border-left: 4px solid #f59e0b;
        }
        
        .stat-card.info {
            background-color: #eff6ff;
            border-left: 4px solid #3b82f6;
        }
        
        .stat-label {
            font-size: 10px;
            color: #6b7280;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 3px;
        }
        
        .stat-description {
            font-size: 9px;
            color: #9ca3af;
        }
        
        .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #374151;
            margin: 25px 0 15px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
        }
        
        .table-container {
            margin: 15px 0;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
            font-size: 10px;
        }
        
        thead {
            background-color: #374151;
            color: white;
        }
        
        th {
            padding: 10px 12px;
            text-align: left;
            font-weight: bold;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        td {
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        tbody tr:nth-child(even) {
            background-color: #f9fafb;
        }
        
        .stat-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .stat-row:last-child {
            border-bottom: none;
        }
        
        .stat-row:nth-child(even) {
            background-color: #f9fafb;
        }
        
        .stat-name {
            color: #374151;
            font-weight: 500;
        }
        
        .stat-number {
            font-weight: bold;
            color: #1f2937;
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
            
            .stat-card {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $title }}</h1>
        <div class="subtitle">Ringkasan Status APAR Sistem</div>
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
        <div class="stat-card primary">
            <div class="stat-label">Total APAR</div>
            <div class="stat-value">{{ $stats['total_apar'] }}</div>
            <div class="stat-description">Semua APAR dalam sistem</div>
        </div>
        
        <div class="stat-card success">
            <div class="stat-label">APAR Aktif</div>
            <div class="stat-value">{{ $stats['active_apar'] }}</div>
            <div class="stat-description">APAR dalam kondisi baik</div>
        </div>
        
        <div class="stat-card warning">
            <div class="stat-label">Inspeksi Bulan Ini</div>
            <div class="stat-value">{{ $stats['inspections_this_period'] }}</div>
            <div class="stat-description">Inspeksi dalam periode ini</div>
        </div>
        
        <div class="stat-card info">
            <div class="stat-label">APAR Non-Aktif</div>
            <div class="stat-value">{{ $stats['inactive'] }}</div>
            <div class="stat-description">APAR tidak aktif</div>
        </div>
    </div>

    <div class="section-title">Status APAR</div>
    
    <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div class="stat-row">
            <span class="stat-name">Perlu Perbaikan</span>
            <span class="stat-number">{{ $stats['needs_repair'] }} unit</span>
        </div>
        <div class="stat-row">
            <span class="stat-name">Sedang Diperbaiki</span>
            <span class="stat-number">{{ $stats['under_repair'] }} unit</span>
        </div>
        <div class="stat-row">
            <span class="stat-name">Tidak Dapat Diperbaiki</span>
            <span class="stat-number">{{ $stats['not_fixable'] }} unit</span>
        </div>
    </div>

    <div class="section-title">Distribusi Lokasi</div>
    
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th style="width: 30%;">Jenis Lokasi</th>
                    <th style="width: 30%;">Jumlah</th>
                    <th style="width: 40%;">Persentase</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Statis (Lokasi Tetap)</td>
                    <td>{{ $stats['location_types']['statis'] }} unit</td>
                    <td>
                        @if($stats['total_apar'] > 0)
                            {{ round(($stats['location_types']['statis'] / $stats['total_apar']) * 100, 1) }}%
                        @else
                            0%
                        @endif
                    </td>
                </tr>
                <tr>
                    <td>Mobil (Kendaraan)</td>
                    <td>{{ $stats['location_types']['mobile'] }} unit</td>
                    <td>
                        @if($stats['total_apar'] > 0)
                            {{ round(($stats['location_types']['mobile'] / $stats['total_apar']) * 100, 1) }}%
                        @else
                            0%
                        @endif
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="section-title">Distribusi Tipe APAR</div>
    
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th style="width: 30%;">Tipe APAR</th>
                    <th style="width: 35%;">Jumlah</th>
                    <th style="width: 35%;">Persentase</th>
                </tr>
            </thead>
            <tbody>
                @if(!empty($stats['apar_types']))
                    @foreach($stats['apar_types'] as $typeName => $count)
                        <tr>
                            <td>{{ ucfirst($typeName) }}</td>
                            <td>{{ $count }} unit</td>
                            <td>
                                @if($stats['total_apar'] > 0)
                                    {{ round(($count / $stats['total_apar']) * 100, 1) }}%
                                @else
                                    0%
                                @endif
                            </td>
                        </tr>
                    @endforeach
                @else
                    <tr>
                        <td colspan="3" style="text-align: center; color: #6b7280; font-style: italic;">Tidak ada data tipe APAR</td>
                    </tr>
                @endif
            </tbody>
        </table>
    </div>

    <div style="margin-top: 20px; font-size: 10px; color: #6b7280;">
        <p><strong>Catatan:</strong> Laporan ini menampilkan ringkasan status dan distribusi APAR dalam sistem.</p>
    </div>

    <div class="footer">
        <p>Dokumen ini dibuat secara otomatis oleh sistem CAKAP FT MAOS</p>
        <p>Untuk informasi lebih lanjut, hubungi administrator sistem</p>
        <p style="margin-top: 5px; font-size: 8px;">Generated at: {{ $generated_at }}</p>
    </div>
</body>
</html>