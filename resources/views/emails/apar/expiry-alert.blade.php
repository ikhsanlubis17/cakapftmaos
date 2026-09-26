@extends('emails.layouts.pertamina')

@section('content')
    <span class="badge badge-warning">PERINGATAN KEDALUWARSA ASET</span>

    <h2 style="margin: 0 0 12px 0; color: #041562; font-size: 16px;">
        Pemberitahuan APAR Mendekati / Melewati Masa Kedaluwarsa
    </h2>

    <p style="margin: 0 0 16px 0; color: #334155;">
        Yth. <strong>Tim Manajemen HSSE &amp; Logistik FT Maos</strong>,<br>
        Sistem mendeteksi <strong>{{ $expiringApars->count() }} unit APAR</strong> yang masa berlakunya telah melewati atau mendekati batas kedaluwarsa (&le; {{ $thresholdDays }} hari). Mohon segera dijadwalkan pengisian ulang media pemadam atau pergantian tabung baru.
    </p>

    <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin: 16px 0;">
        <thead>
            <tr style="background-color: #041562; color: #ffffff;">
                <th style="padding: 8px; text-align: left;">No. Seri</th>
                <th style="padding: 8px; text-align: left;">Lokasi</th>
                <th style="padding: 8px; text-align: center;">Tgl Expired</th>
                <th style="padding: 8px; text-align: center;">Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($expiringApars as $apar)
                @php
                    $isExpired = $apar->expired_at && \Carbon\Carbon::parse($apar->expired_at)->isPast();
                    $daysLeft = $apar->expired_at ? \Carbon\Carbon::now()->diffInDays(\Carbon\Carbon::parse($apar->expired_at), false) : 0;
                @endphp
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 8px; font-weight: bold; font-family: monospace; color: #041562;">
                        {{ $apar->serial_number }}
                    </td>
                    <td style="padding: 8px; color: #334155;">
                        {{ $apar->location_name }}
                    </td>
                    <td style="padding: 8px; text-align: center; color: #64748b;">
                        {{ $apar->expired_at ? \Carbon\Carbon::parse($apar->expired_at)->format('d/m/Y') : '-' }}
                    </td>
                    <td style="padding: 8px; text-align: center;">
                        @if($isExpired)
                            <span style="color: #dc2626; font-weight: bold;">Sudah Expired</span>
                        @else
                            <span style="color: #d97706; font-weight: bold;">Sisa {{ $daysLeft }} hari</span>
                        @endif
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <a href="{{ $actionUrl }}" class="btn-cta">
        Buka Manajemen Data APAR &rarr;
    </a>
@endsection
