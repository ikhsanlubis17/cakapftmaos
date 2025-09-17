<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QR Code APAR - CAKAP FT MAOS</title>
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
            border-bottom: 2px solid #dc2626;
            padding-bottom: 15px;
        }
        
        .header h1 {
            color: #dc2626;
            margin: 0 0 8px 0;
            font-size: 16px;
            font-weight: bold;
        }
        
        .header p {
            margin: 2px 0;
            color: #6b7280;
            font-size: 8px;
        }
        
        /* Layout 3 kolom */
        .cards-grid {
            text-align: center;
        }
        
        .apar-card {
            display: inline-block;
            vertical-align: top;
            width: 20%; 
            margin: 10px 5px; 
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 25px 5px 5px 5px; 
            background-color: #ffffff;
            text-align: center;
            height: 150px; 
            box-sizing: border-box;
            page-break-inside: avoid;
            position: relative;
        }

        /* Lubang kecil di atas kartu */
        .hole {
            width: 10px;
            height: 10px;
            border: 1px solid #9ca3af;
            border-radius: 50%;
            background: white;
            position: absolute;
            top: 12px;
            right: 12px;
        }
        
        .qr-code {
            margin-bottom: 8px;
        }
        
        .qr-code img {
            width: 80px;
            height: 80px;
            border: 1px solid #e5e7eb;
            object-fit: contain;
        }
        
        .qr-label {
            font-size: 7px;
            color: #6b7280;
            margin: 5px 0;
            text-align: center;
        }
        
        .apar-id {
            font-size: 9px;
            font-weight: bold;
            color: #111827;
            margin-top: 5px;
        }
        
        .footer {
            margin-top: 25px;
            text-align: center;
            font-size: 7px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            padding-top: 12px;
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
        }
        
        @media print {
            body {
                background-color: white;
            }
            .apar-card {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>QR Code APAR - CAKAP FT MAOS</h1>
        <p>Dokumen ini berisi QR Code untuk {{ $totalApars }} APAR</p>
        <p>Dibuat pada: {{ $generatedAt }}</p>
    </div>

    <div class="cards-grid">
        @foreach($apars as $apar)
            <div class="apar-card">
                <div class="hole"></div> <!-- Lubang gantung -->
                <div class="qr-label">Scan untuk Inspeksi APAR</div>
                <div class="qr-code">
                    <img src="data:image/png;base64,{{ $apar->qr_code_image }}" alt="QR Code {{ $apar->serial_number }}">
                </div>
                <div class="apar-id">{{ $apar->serial_number }}</div>
            </div>
        @endforeach
    </div>

    <div class="footer">
        <p>Dokumen ini dibuat secara otomatis oleh sistem CAKAP FT MAOS</p>
        <p>Total APAR: {{ $totalApars }} | Setiap kartu dapat dipotong, dilubangi, dan dilaminating</p>
    </div>
</body>
</html>
