<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>
        @if(($printFormat ?? 'both') === 'qr_only')
            Kartu QR Code APAR
        @elseif(($printFormat ?? 'both') === 'serial_only')
            Label Nomor Seri APAR
        @else
            Kombinasi Kartu QR & Nomor Seri APAR
        @endif
        - {{ setting('site_name', config('app.name', 'CAKAP FT MAOS')) }}
    </title>
    <style>
        @page {
            margin: 8mm 6mm 8mm 6mm;
        }

        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            font-size: 8px;
            line-height: 1.15;
            background-color: #ffffff;
            color: #1e293b;
        }

        .header {
            text-align: center;
            margin-bottom: 8px;
            border-bottom: 2px solid #DA1212;
            padding-bottom: 4px;
        }

        .header h1 {
            color: #041562;
            margin: 0 0 2px 0;
            font-size: 13px;
            font-weight: bold;
            letter-spacing: 0.5px;
        }

        .header p.sub {
            color: #334155;
            margin: 1px 0;
            font-size: 8px;
            font-weight: bold;
        }

        .header p.meta {
            color: #64748b;
            margin: 1px 0 0 0;
            font-size: 7.5px;
        }

        .section-banner {
            background-color: #041562;
            color: #ffffff;
            padding: 3px 6px;
            font-size: 8px;
            font-weight: bold;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            margin-bottom: 6px;
            border-radius: 3px;
            text-align: center;
        }

        /* ── Grid Table Layout (4 Kolom per Baris - Proporsional & Lega) ── */
        .grid-table {
            width: 100%;
            table-layout: fixed;
            border-collapse: separate;
            border-spacing: 5px;
            margin-bottom: 6px;
            page-break-inside: auto;
        }

        .grid-table tr {
            page-break-inside: avoid;
            page-break-after: auto;
        }

        .grid-col {
            width: 25%;
            vertical-align: top;
            padding: 0;
        }

        .grid-col-empty {
            border: none;
            background: transparent;
        }

        /* ── Format 1: KARTU QR CODE APAR (QR Code + Nomor Seri) ── */
        .apar-card {
            border: 1.5px dashed #94a3b8;
            border-radius: 6px;
            padding: 5px 4px 6px 4px;
            text-align: center;
            background-color: #ffffff;
            box-sizing: border-box;
            page-break-inside: avoid;
        }

        .hole {
            width: 7px;
            height: 7px;
            border: 1px solid #94a3b8;
            border-radius: 50%;
            margin: 0 auto 3px auto;
            background-color: #f1f5f9;
        }

        .company-tag {
            font-size: 6px;
            font-weight: bold;
            color: #041562;
            letter-spacing: 0.3px;
            text-transform: uppercase;
            margin-bottom: 2px;
            white-space: nowrap;
            overflow: hidden;
        }

        .qr-code {
            margin: 1px 0 2px 0;
        }

        .qr-img {
            width: 60px;
            height: 60px;
            display: block;
            margin: 0 auto;
        }

        .apar-id {
            font-size: 9px;
            font-weight: bold;
            color: #DA1212;
            font-family: monospace;
            margin-top: 2px;
            word-break: break-all;
            line-height: 1.1;
        }

        .apar-meta {
            font-size: 6.5px;
            color: #475569;
            margin-top: 1px;
            line-height: 1.1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* ── Format 2: LABEL NOMOR SERI APAR (Label Strip) ── */
        .apar-card-serial-only {
            border: 1.5px dashed #041562;
            border-radius: 5px;
            padding: 5px 4px 6px 4px;
            text-align: center;
            background-color: #ffffff;
            box-sizing: border-box;
            page-break-inside: avoid;
        }

        .serial-company-tag {
            font-size: 5.5px;
            font-weight: bold;
            color: #041562;
            letter-spacing: 0.2px;
            text-transform: uppercase;
            margin-bottom: 2px;
            white-space: nowrap;
            overflow: hidden;
        }

        .apar-id-large {
            font-size: 9.5px;
            font-weight: 900;
            color: #041562;
            font-family: monospace;
            letter-spacing: 0.4px;
            word-break: break-all;
            background-color: #f8fafc;
            padding: 4px 2px;
            border: 1px solid #cbd5e1;
            border-radius: 3px;
            margin: 2px 0 3px 0;
            line-height: 1.1;
        }

        .serial-meta {
            font-size: 6px;
            color: #475569;
            line-height: 1.1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .page-break {
            page-break-before: always;
        }

        .footer {
            margin-top: 8px;
            text-align: center;
            font-size: 7px;
            color: #64748b;
            border-top: 1px solid #cbd5e1;
            padding-top: 3px;
        }

        @media print {
            body {
                background-color: #ffffff;
            }

            .apar-card {
                border-color: #64748b;
            }

            .apar-card-serial-only {
                border-color: #041562;
            }
        }
    </style>
</head>
<body>

@if(($printFormat ?? 'both') === 'both')
    {{-- ========================================================================= --}}
    {{-- FORMAT KOMBINASI: BAGIAN 1 (KARTU QR CODE & NOMOR SERI)                   --}}
    {{-- ========================================================================= --}}
    <div class="header">
        <h1>KARTU QR CODE APAR - {{ setting('site_name', config('app.name', 'CAKAP FT MAOS')) }}</h1>
        <p class="sub">PT Pertamina Patra Niaga &bull; Fuel Terminal Maos &bull; Objek Vital Nasional</p>
        <p class="meta">Format Cetak: <strong>KOMBINASI (BAGIAN 1: KARTU QR CODE)</strong> | Total: {{ $totalApars }} Tabung | Tanggal: {{ $generatedAt }}</p>
    </div>

    <div class="section-banner">
        BAGIAN 1: KARTU QR CODE APAR (4 PER BARIS &bull; TOTAL {{ $totalApars }} TABUNG)
    </div>

    <table class="grid-table">
        @foreach($apars->chunk(4) as $row)
            <tr>
                @foreach($row as $apar)
                    <td class="grid-col">
                        <div class="apar-card">
                            <div class="hole"></div>
                            <div class="company-tag">PERTAMINA FT MAOS</div>
                            <div class="qr-code">
                                <img class="qr-img" src="data:image/svg+xml;base64,{{ $apar->qr_code_image }}" alt="QR {{ $apar->serial_number }}">
                            </div>
                            <div class="apar-id">{{ $apar->serial_number }}</div>
                            <div class="apar-meta">
                                {{ $apar->aparType?->name ?? 'APAR' }} &bull; {{ $apar->capacity ?? '-' }} kg
                            </div>
                        </div>
                    </td>
                @endforeach
                @for($i = $row->count(); $i < 4; $i++)
                    <td class="grid-col grid-col-empty"></td>
                @endfor
            </tr>
        @endforeach
    </table>

    {{-- ========================================================================= --}}
    {{-- FORMAT KOMBINASI: BAGIAN 2 (LABEL NOMOR SERI APAR)                        --}}
    {{-- Seluruh QR Code selesai di atas, lalu berganti ke bagian nomor seri      --}}
    {{-- ========================================================================= --}}
    <div class="page-break"></div>

    <div class="header">
        <h1>LABEL NOMOR SERI APAR - {{ setting('site_name', config('app.name', 'CAKAP FT MAOS')) }}</h1>
        <p class="sub">PT Pertamina Patra Niaga &bull; Fuel Terminal Maos &bull; Objek Vital Nasional</p>
        <p class="meta">Format Cetak: <strong>KOMBINASI (BAGIAN 2: LABEL NOMOR SERI)</strong> | Total: {{ $totalApars }} Tabung | Tanggal: {{ $generatedAt }}</p>
    </div>

    <div class="section-banner">
        BAGIAN 2: LABEL NOMOR SERI APAR (4 PER BARIS &bull; TOTAL {{ $totalApars }} TABUNG)
    </div>

    <table class="grid-table">
        @foreach($apars->chunk(4) as $row)
            <tr>
                @foreach($row as $apar)
                    <td class="grid-col">
                        <div class="apar-card-serial-only">
                            <div class="serial-company-tag">PT PERTAMINA PATRA NIAGA &bull; FT MAOS</div>
                            <div class="apar-id-large">{{ $apar->serial_number }}</div>
                            <div class="serial-meta">
                                {{ $apar->aparType?->name ?? 'APAR' }} &bull; {{ $apar->capacity ?? '-' }} kg
                                @if($apar->location_name)
                                    &bull; {{ $apar->location_name }}
                                @endif
                            </div>
                        </div>
                    </td>
                @endforeach
                @for($i = $row->count(); $i < 4; $i++)
                    <td class="grid-col grid-col-empty"></td>
                @endfor
            </tr>
        @endforeach
    </table>

@elseif(($printFormat ?? 'both') === 'qr_only')
    {{-- ========================================================================= --}}
    {{-- FORMAT: KARTU QR CODE APAR SAJA (4 PER BARIS, QR + NOMOR SERI)            --}}
    {{-- ========================================================================= --}}
    <div class="header">
        <h1>KARTU QR CODE APAR - {{ setting('site_name', config('app.name', 'CAKAP FT MAOS')) }}</h1>
        <p class="sub">PT Pertamina Patra Niaga &bull; Fuel Terminal Maos &bull; Objek Vital Nasional</p>
        <p class="meta">Format Cetak: <strong>KARTU QR CODE APAR</strong> | Total: {{ $totalApars }} Tabung | Tanggal: {{ $generatedAt }}</p>
    </div>

    <table class="grid-table">
        @foreach($apars->chunk(4) as $row)
            <tr>
                @foreach($row as $apar)
                    <td class="grid-col">
                        <div class="apar-card">
                            <div class="hole"></div>
                            <div class="company-tag">PERTAMINA FT MAOS</div>
                            <div class="qr-code">
                                <img class="qr-img" src="data:image/svg+xml;base64,{{ $apar->qr_code_image }}" alt="QR {{ $apar->serial_number }}">
                            </div>
                            <div class="apar-id">{{ $apar->serial_number }}</div>
                            <div class="apar-meta">
                                {{ $apar->aparType?->name ?? 'APAR' }} &bull; {{ $apar->capacity ?? '-' }} kg
                            </div>
                        </div>
                    </td>
                @endforeach
                @for($i = $row->count(); $i < 4; $i++)
                    <td class="grid-col grid-col-empty"></td>
                @endfor
            </tr>
        @endforeach
    </table>

@else
    {{-- ========================================================================= --}}
    {{-- FORMAT: LABEL NOMOR SERI APAR SAJA (4 PER BARIS)                          --}}
    {{-- ========================================================================= --}}
    <div class="header">
        <h1>LABEL NOMOR SERI APAR - {{ setting('site_name', config('app.name', 'CAKAP FT MAOS')) }}</h1>
        <p class="sub">PT Pertamina Patra Niaga &bull; Fuel Terminal Maos &bull; Objek Vital Nasional</p>
        <p class="meta">Format Cetak: <strong>LABEL NOMOR SERI APAR</strong> | Total: {{ $totalApars }} Tabung | Tanggal: {{ $generatedAt }}</p>
    </div>

    <table class="grid-table">
        @foreach($apars->chunk(4) as $row)
            <tr>
                @foreach($row as $apar)
                    <td class="grid-col">
                        <div class="apar-card-serial-only">
                            <div class="serial-company-tag">PT PERTAMINA PATRA NIAGA &bull; FT MAOS</div>
                            <div class="apar-id-large">{{ $apar->serial_number }}</div>
                            <div class="serial-meta">
                                {{ $apar->aparType?->name ?? 'APAR' }} &bull; {{ $apar->capacity ?? '-' }} kg
                                @if($apar->location_name)
                                    &bull; {{ $apar->location_name }}
                                @endif
                            </div>
                        </div>
                    </td>
                @endforeach
                @for($i = $row->count(); $i < 4; $i++)
                    <td class="grid-col grid-col-empty"></td>
                @endfor
            </tr>
        @endforeach
    </table>
@endif

    <div class="footer">
        <p>Dokumen resmi ini diterbitkan secara otomatis oleh sistem {{ setting('site_name', config('app.name', 'CAKAP FT MAOS')) }} &bull; Setiap kartu/label dapat dipotong mengikuti garis putus-putus untuk efisiensi pemasangan lapangan.</p>
    </div>
</body>
</html>
