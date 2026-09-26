<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subject ?? 'Notifikasi CAKAP FT MAOS' }}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f1f5f9;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        .wrapper {
            width: 100%;
            table-layout: fixed;
            background-color: #f1f5f9;
            padding: 24px 0;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
        }
        .header {
            background-color: #041562;
            padding: 20px 24px;
            text-align: left;
            border-bottom: 3px solid #DA1212;
        }
        .header-title {
            color: #ffffff;
            font-size: 18px;
            font-weight: 700;
            margin: 0;
            letter-spacing: 0.5px;
        }
        .header-subtitle {
            color: #94a3b8;
            font-size: 11px;
            margin: 4px 0 0 0;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }
        .content {
            padding: 24px;
            line-height: 1.6;
            font-size: 14px;
        }
        .badge {
            display: inline-block;
            padding: 4px 10px;
            font-size: 11px;
            font-weight: 700;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 16px;
        }
        .badge-danger {
            background-color: #fee2e2;
            color: #dc2626;
            border: 1px solid #fca5a5;
        }
        .badge-warning {
            background-color: #fef3c7;
            color: #d97706;
            border: 1px solid #fcd34d;
        }
        .badge-info {
            background-color: #eff6ff;
            color: #1d4ed8;
            border: 1px solid #bfdbfe;
        }
        .badge-success {
            background-color: #ecfdf5;
            color: #059669;
            border: 1px solid #a7f3d0;
        }
        .data-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 16px;
            margin: 16px 0;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }
        .data-table td {
            padding: 6px 0;
            vertical-align: top;
        }
        .data-label {
            color: #64748b;
            width: 38%;
            font-weight: 600;
        }
        .data-value {
            color: #0f172a;
            font-weight: 600;
        }
        .monospace {
            font-family: SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
            background-color: #f1f5f9;
            padding: 2px 6px;
            border-radius: 4px;
            border: 1px solid #cbd5e1;
            letter-spacing: 0.5px;
        }
        .btn-cta {
            display: block;
            width: auto;
            min-height: 44px;
            line-height: 44px;
            text-align: center;
            background-color: #041562;
            color: #ffffff !important;
            font-weight: 700;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-decoration: none;
            border-radius: 6px;
            margin: 24px 0 16px 0;
            padding: 0 20px;
        }
        .btn-cta:hover {
            background-color: #11468F;
        }
        .footer {
            background-color: #f8fafc;
            padding: 18px 24px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            font-size: 11px;
            color: #64748b;
            line-height: 1.5;
        }
        .footer p {
            margin: 3px 0;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="email-container">
            <!-- Header -->
            <div class="header">
                <div class="header-title">{{ setting('site_name', config('app.name', 'CAKAP FT MAOS')) }}</div>
                <div class="header-subtitle">PT PERTAMINA PATRA NIAGA &bull; FUEL TERMINAL MAOS &bull; OBVITNAS</div>
            </div>

            <!-- Main Content -->
            <div class="content">
                @yield('content')
            </div>

            <!-- Footer -->
            <div class="footer">
                <p><strong>Sistem Pemantauan dan Kesiapsiagaan APAR (CAKAP FT MAOS)</strong></p>
                <p>Email ini diterbitkan otomatis oleh sistem. Mohon tidak membalas langsung ke alamat ini.</p>
                <p>&copy; {{ date('Y') }} PT Pertamina Patra Niaga — Fuel Terminal Maos. Hak Cipta Dilindungi.</p>
            </div>
        </div>
    </div>
</body>
</html>
