@extends('emails.layouts.pertamina')

@section('content')
    <span class="badge badge-info">PENGINGAT SHIFT HARIAN &bull; 07:00 WIB</span>

    <h2 style="margin: 0 0 12px 0; color: #041562; font-size: 16px;">
        Jadwal Inspeksi APAR Hari Ini ({{ $dateString }})
    </h2>

    <p style="margin: 0 0 16px 0; color: #334155;">
        Halo <strong>{{ $technician->name }}</strong>,<br>
        Berikut adalah daftar tugas inspeksi APAR terjadwal yang harus Anda laksanakan hari ini di lingkungan Fuel Terminal Maos.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px 16px; margin: 16px 0;">
        <p style="margin: 0; font-size: 13px; color: #0f172a;">
            Total Penugasan Hari Ini: <strong style="color: #11468F; font-size: 15px;">{{ $schedules->count() }} Tabung APAR</strong>
        </p>
    </div>

    <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin: 16px 0;">
        <thead>
            <tr style="background-color: #041562; color: #ffffff;">
                <th style="padding: 8px; text-align: left;">No. Seri</th>
                <th style="padding: 8px; text-align: left;">Lokasi Bangsal/Pos</th>
                <th style="padding: 8px; text-align: center;">Jendela Waktu</th>
            </tr>
        </thead>
        <tbody>
            @foreach($schedules as $schedule)
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 8px; font-weight: bold; font-family: monospace; color: #041562;">
                        {{ $schedule->apar?->serial_number ?? 'APAR' }}
                    </td>
                    <td style="padding: 8px; color: #334155;">
                        {{ $schedule->apar?->location_name ?? '-' }}
                    </td>
                    <td style="padding: 8px; text-align: center; color: #64748b;">
                        {{ optional($schedule->startAtLocal())->format('H:i') ?? '08:00' }} - {{ optional($schedule->endAtLocal())->format('H:i') ?? '16:00' }}
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <a href="{{ $actionUrl }}" class="btn-cta">
        Buka Aplikasi CAKAP &amp; Mulai Inspeksi &rarr;
    </a>

    <div style="font-size: 12px; color: #64748b; line-height: 1.5; margin-top: 16px;">
        <strong>SOP Kepatuhan Lapangan:</strong><br>
        &bull; Pastikan GPS aktif pada smartphone Anda untuk verifikasi radius geografis lokasi.<br>
        &bull; Ambil foto kondisi fisik tabung dan foto selfie secara live (kamera langsung).<br>
        &bull; Jika stiker QR pada tabung kotor/rusak, gunakan tab input Nomor Seri Manual.
    </div>
@endsection
