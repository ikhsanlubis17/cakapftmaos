<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
@php
    $publicSettings = \App\Models\Setting::getPublicSettings();
    $siteName = $publicSettings['site_name'] ?? config('app.name', 'CAKAP FT MAOS');
    $siteTagline = $publicSettings['site_tagline'] ?? 'Sistem Monitoring APAR';
    $siteLogo = $publicSettings['site_logo'] ?? '/images/logo2.svg';
@endphp
    <title>{{ $siteName }} - {{ $siteTagline }}</title>

    <link rel="icon" href="{{ $siteLogo }}" type="image/svg+xml">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <script>
        window.APP_CONFIG = @json($publicSettings);
    </script>

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/css/vendor-fixes.css', 'resources/css/exception-fixes.css', 'resources/js/app.tsx'])

    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            letter-spacing: 0.14px;
        }

        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }

        ::-webkit-scrollbar-track {
            background: #EEEEEE;
        }

        ::-webkit-scrollbar-thumb {
            background: #11468F;
            border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: #041562;
        }

        .loading-spinner {
            border: 3px solid #EEEEEE;
            border-top: 3px solid #11468F;
            border-radius: 50%;
            width: 36px;
            height: 36px;
            animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body class="bg-[#f8fafc] text-slate-900 antialiased selection:bg-[#11468F] selection:text-white">
    <div id="app"></div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="https://js.pusher.com/8.2.0/pusher.min.js"></script>

    <script>
        document.addEventListener('DOMContentLoaded', function () {
            if (typeof axios !== 'undefined') {
                window.axios = axios;
                window.axios.defaults.headers.common['X-CSRF-TOKEN'] = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
                window.axios.defaults.headers.common['Accept'] = 'application/json';
            }
        });
    </script>
</body>
</html>
