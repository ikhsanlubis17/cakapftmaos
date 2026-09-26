@extends('emails.layouts.pertamina')

@section('content')
    <span class="badge badge-info">SURAT TUGAS PERBAIKAN</span>

    <h2 style="margin: 0 0 12px 0; color: #041562; font-size: 16px;">
        Penugasan Perbaikan Tabung APAR Baru
    </h2>

    <p style="margin: 0 0 16px 0; color: #334155;">
        Halo <strong>{{ $technician->name }}</strong>,<br>
        Anda telah ditugaskan oleh Supervisor untuk melakukan tindakan perbaikan pada unit APAR berikut di lingkungan Fuel Terminal Maos.
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
                <td class="data-label">Jenis Media &amp; Kapasitas</td>
                <td class="data-value">{{ $apar->aparType?->name ?? 'APAR' }} &bull; {{ $apar->capacity ?? '-' }} kg</td>
            </tr>
            <tr>
                <td class="data-label">Supervisor Penugasan</td>
                <td class="data-value">{{ $approver->name ?? 'Supervisor HSSE' }}</td>
            </tr>
            <tr>
                <td class="data-label">Waktu Penugasan</td>
                <td class="data-value">{{ $repairApproval->decision_made_at?->timezone('Asia/Jakarta')->format('d/m/Y H:i') ?? now()->format('d/m/Y H:i') }} WIB</td>
            </tr>
            @if($repairApproval->supervisor_notes)
                <tr>
                    <td class="data-label">Instruksi Supervisor</td>
                    <td class="data-value" style="color: #11468F; font-weight: bold;">"{{ $repairApproval->supervisor_notes }}"</td>
                </tr>
            @endif
        </table>
    </div>

    <a href="{{ $actionUrl }}" class="btn-cta">
        Buka Rincian Tugas &amp; Laporkan Hasil Perbaikan &rarr;
    </a>

    <div style="background-color: #f8fafc; border-left: 3px solid #11468F; padding: 10px 14px; font-size: 12px; color: #475569; margin-top: 16px;">
        <strong>Petunjuk Teknisi:</strong><br>
        1. Pastikan membawa suku cadang pengganti (segel, pin, selang, atau isi media baru) sesuai temuan.<br>
        2. Setelah perbaikan selesai, wajib mengunggah foto fisik hasil perbaikan melalui form sistem CAKAP.
    </div>
@endsection
