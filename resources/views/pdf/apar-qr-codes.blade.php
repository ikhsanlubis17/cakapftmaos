<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QR Code APAR - {{ setting('site_name', config('app.name', 'CAKAP FT MAOS')) }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 15px;
            font-size: 9px;
            line-height: 1.2;
            background-color: #f9fafb;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #ef4444;
            padding-bottom: 10px;
        }

        .header h1 {
            color: #1f2937;
            margin: 0 0 5px 0;
            font-size: 18px;
        }

        .header p {
            color: #6b7280;
            margin: 0;
            font-size: 11px;
        }

        .cards-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            justify-content: flex-start;
        }

        .apar-card {
            width: 85px;
            height: 125px;
            border: 2px dashed #d1d5db;
            border-radius: 8px;
            padding: 6px;
            text-align: center;
            background-color: white;
            box-sizing: border-box;
            position: relative;
            page-break-inside: avoid;
            margin-bottom: 8px;
        }

        .hole {
            width: 8px;
            height: 8px;
            border: 1px solid #9ca3af;
            border-radius: 50%;
            margin: 0 auto 4px auto;
            background-color: #f3f4f6;
        }

        .qr-label {
            font-size: 7px;
            font-weight: bold;
            color: #374151;
            margin-bottom: 4px;
            line-height: 1;
        }

        .qr-code {
            margin: 4px 0;
        }

        .qr-code img {
            width: 60px;
            height: 60px;
            display: block;
            margin: 0 auto;
        }

        .apar-id {
            font-size: 8px;
            font-weight: bold;
            color: #ef4444;
            margin-top: 4px;
            word-break: break-all;
            line-height: 1;
        }

        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 10px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
        }

        @media print {
            body {
                background-color: white;
                padding: 10px;
            }

            .apar-card {
                border-color: #9ca3af;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>QR Code APAR - {{ setting('site_name', config('app.name', 'CAKAP FT MAOS')) }}</h1>
        <p>Dokumen ini berisi QR Code untuk {{ $totalApars }} APAR</p>
        <p>Dibuat pada: {{ $generatedAt }}</p>
    </div>

    <div class="cards-grid">
        @foreach($apars as $apar)
            <div class="apar-card">
                <div class="hole"></div>
                <div class="qr-label">Scan untuk Inspeksi APAR</div>
                <div class="qr-code">
                    <img src="data:image/png;base64,{{ $apar->qr_code_image }}" alt="QR Code {{ $apar->serial_number }}">
                </div>
                <div class="apar-id">{{ $apar->serial_number }}</div>
            </div>
        @endforeach
    </div>

    <div class="footer">
        <p>Dokumen ini dibuat secara otomatis oleh sistem {{ setting('site_name', config('app.name', 'CAKAP FT MAOS')) }}</p>
        <p>Total APAR: {{ $totalApars }} | Setiap kartu dapat dipotong, dilubangi, dan dilaminating</p>
    </div>
</body>
</html>
