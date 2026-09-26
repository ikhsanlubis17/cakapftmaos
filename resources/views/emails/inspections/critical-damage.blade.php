@extends('emails.layouts.pertamina')

@section('content')
    <span class="badge badge-danger">PERINGATAN KERUSAKAN HSSE</span>

    <h2 style="margin: 0 0 12px 0; color: #041562; font-size: 16px;">
        Pemberitahuan Temuan APAR Rusak di Lapangan
    </h2>

    <p style="margin: 0 0 16px 0; color: #334155;">
        Yth. <strong>Bapak/Ibu Supervisor HSSE</strong>,<br>
        Sistem mendeteksi laporan inspeksi dengan kondisi <strong>RUSAK / DAMAGED</strong> di fasilitas Fuel Terminal Maos. Mohon segera melakukan verifikasi dan penugasan perbaikan darurat untuk memastikan kesiapsiagaan proteksi kebakaran.
    </p>

    <div class="data-card">
        <table class="data-table">
            <tr>
                <td class="data-label">Nomor Seri APAR</td>
                <td class="data-value"><span class="monospace">{{ $apar->serial_number }}</span></td>
            </tr>
            <tr>
                <td class="data-label">Lokasi Penempatan</td>
                <td class="data-value"><strong>{{ $apar->location_name }}</strong> ({{ strtoupper($apar->location_type) }})</td>
            </tr>
            <tr>
                <td class="data-label">Jenis Media &amp; Kapasitas</td>
                <td class="data-value">{{ $apar->aparType?->name ?? 'APAR' }} &bull; {{ $apar->capacity ?? '-' }} kg</td>
            </tr>
            <tr>
                <td class="data-label">Petugas Inspeksi</td>
                <td class="data-value">{{ $inspector->name }} ({{ $inspector->email }})</td>
            </tr>
            <tr>
                <td class="data-label">Waktu Temuan</td>
                <td class="data-value">{{ $inspection->created_at?->timezone('Asia/Jakarta')->format('d/m/Y H:i') }} WIB</td>
            </tr>
            @if($damages && count($damages) > 0)
                <tr>
                    <td class="data-label">Rincian Kerusakan</td>
                    <td class="data-value">
                        <ul style="margin: 0; padding-left: 16px; color: #dc2626;">
                            @foreach($damages as $damage)
                                <li>
                                    <strong>{{ $damage->damageCategory?->name ?? 'Kerusakan Fisik' }}</strong>: 
                                    Tingkat {{ ucfirst($damage->severity ?? 'sedang') }}
                                    @if($damage->notes) - <em>"{{ $damage->notes }}"</em>@endif
                                </li>
                            @endforeach
                        </ul>
                    </td>
                </tr>
            @endif
            @if($inspection->notes)
                <tr>
                    <td class="data-label">Catatan Lapangan</td>
                    <td class="data-value" style="font-style: italic;">"{{ $inspection->notes }}"</td>
                </tr>
            @endif
        </table>
    </div>

    <a href="{{ $actionUrl }}" class="btn-cta">
        Tinjau Temuan &amp; Berikan Keputusan Perbaikan &rarr;
    </a>

    <p style="font-size: 12px; color: #64748b; margin-top: 16px;">
        * Sesuai SOP HSSE Objek Vital Nasional, tindak lanjut disposisi perbaikan diharapkan dapat ditetapkan dalam waktu &lt; 24 jam.
    </p>
@endsection
