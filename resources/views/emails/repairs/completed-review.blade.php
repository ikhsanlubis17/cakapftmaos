@extends('emails.layouts.pertamina')

@section('content')
    <span class="badge badge-warning">MENUNGGU VERIFIKASI PERBAIKAN</span>

    <h2 style="margin: 0 0 12px 0; color: #041562; font-size: 16px;">
        Laporan Hasil Perbaikan Telah Dikirimkan
    </h2>

    <p style="margin: 0 0 16px 0; color: #334155;">
        Yth. <strong>Bapak/Ibu Supervisor</strong>,<br>
        Teknisi <strong>{{ $technician->name }}</strong> telah menyelesaikan tindakan fisik dan mengunggah laporan hasil perbaikan untuk tabung APAR berikut. Mohon dilakukan verifikasi untuk persetujuan penutupan tiket.
    </p>

    <div class="data-card">
        <table class="data-table">
            <tr>
                <td class="data-label">Nomor Seri APAR</td>
                <td class="data-value"><span class="monospace">{{ $apar->serial_number }}</span></td>
            </tr>
            <tr>
                <td class="data-label">Lokasi APAR</td>
                <td class="data-value"><strong>{{ $apar->location_name }}</strong></td>
            </tr>
            <tr>
                <td class="data-label">Teknisi Pelaksana</td>
                <td class="data-value">{{ $technician->name }} ({{ $technician->email }})</td>
            </tr>
            <tr>
                <td class="data-label">Waktu Selesai</td>
                <td class="data-value">{{ $repairReport->created_at?->timezone('Asia/Jakarta')->format('d/m/Y H:i') ?? now()->format('d/m/Y H:i') }} WIB</td>
            </tr>
            @if($repairReport->repair_description)
                <tr>
                    <td class="data-label">Uraian Tindakan Perbaikan</td>
                    <td class="data-value" style="color: #11468F; font-weight: bold;">"{{ $repairReport->repair_description }}"</td>
                </tr>
            @endif
        </table>
    </div>

    <a href="{{ $actionUrl }}" class="btn-cta">
        Tinjau Laporan &amp; Berikan Persetujuan &rarr;
    </a>
@endsection
