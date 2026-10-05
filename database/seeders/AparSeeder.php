<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Apar;
use App\Models\AparType;
use Illuminate\Support\Str;

class AparSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Mendaftarkan APAR Statis Resmi Lingkungan Operasional PT Pertamina Patra Niaga Fuel Terminal Maos.
     */
    public function run(): void
    {
        // Bersihkan data dummy APAR statis lama (yang menggunakan koordinat Monas Jakarta)
        Apar::where('serial_number', 'like', 'APAR-STATIS-%')->forceDelete();

        $aparTypes = AparType::pluck('id', 'name')->toArray();

        // 12 Titik APAR Statis Fasilitas Obvitnas Fuel Terminal Maos (Maos, Cilacap, Jawa Tengah)
        $staticApars = [
            [
                'serial_number' => 'APAR-MAOS-KT-01',
                'location_name' => 'Kantor Utama FT Maos - Lantai 1 (Lobby & Operasional)',
                'latitude' => -7.621532,
                'longitude' => 109.141876,
                'type' => $aparTypes['co2'] ?? $aparTypes['powder'],
                'capacity' => 3,
                'manufactured_date' => '2023-01-15',
                'expired_at' => '2026-11-15',
                'status' => 'active',
                'notes' => 'Terpasang pada dinding lobby utama, dekat panel kendali.',
            ],
            [
                'serial_number' => 'APAR-MAOS-KT-02',
                'location_name' => 'Kantor Utama FT Maos - Lantai 2 (Ruang Admin & Rapat)',
                'latitude' => -7.621545,
                'longitude' => 109.141890,
                'type' => $aparTypes['dcp_pressure'] ?? $aparTypes['powder'],
                'capacity' => 6,
                'manufactured_date' => '2023-02-20',
                'expired_at' => '2026-11-15',
                'status' => 'active',
                'notes' => 'Terpasang di lorong depan Ruang Rapat Wijayakusuma.',
            ],
            [
                'serial_number' => 'APAR-MAOS-FS-01',
                'location_name' => 'Filling Shed BBM - Bay 1 & 2 (Pertalite & Biosolar)',
                'latitude' => -7.622150,
                'longitude' => 109.142210,
                'type' => $aparTypes['foam'] ?? 3,
                'capacity' => 9,
                'manufactured_date' => '2023-03-10',
                'expired_at' => '2026-10-20',
                'status' => 'active',
                'notes' => 'Proteksi area pulau pompa pengisian kompartemen mobil tangki.',
            ],
            [
                'serial_number' => 'APAR-MAOS-FS-02',
                'location_name' => 'Filling Shed BBM - Bay 3 & 4 (Pertamax & Dexlite)',
                'latitude' => -7.622180,
                'longitude' => 109.142250,
                'type' => $aparTypes['foam'] ?? 3,
                'capacity' => 9,
                'manufactured_date' => '2023-03-10',
                'expired_at' => '2026-10-20',
                'status' => 'active',
                'notes' => 'Dilengkapi instruksi penanganan darurat tumpahan produk.',
            ],
            [
                'serial_number' => 'APAR-MAOS-TF-01',
                'location_name' => 'Tangki Timbun (Tank Farm) - Manifold Valve Area',
                'latitude' => -7.622800,
                'longitude' => 109.142800,
                'type' => $aparTypes['foam'] ?? 3,
                'capacity' => 9,
                'manufactured_date' => '2023-04-05',
                'expired_at' => '2026-12-10',
                'status' => 'active',
                'notes' => 'Posisi di luar bundwall dekat jalur pipa manifold timbun.',
            ],
            [
                'serial_number' => 'APAR-MAOS-RP-01',
                'location_name' => 'Rumah Pompa BBM (Product Pump House)',
                'latitude' => -7.622450,
                'longitude' => 109.142500,
                'type' => $aparTypes['co2'] ?? 2,
                'capacity' => 5,
                'manufactured_date' => '2023-05-12',
                'expired_at' => '2026-09-30',
                'status' => 'active',
                'notes' => 'Proteksi instalasi motor pompa listrik dan genset darurat.',
            ],
            [
                'serial_number' => 'APAR-MAOS-SEC-01',
                'location_name' => 'Pos Security Gate 1 (Akses Masuk Terminal)',
                'latitude' => -7.620950,
                'longitude' => 109.141200,
                'type' => $aparTypes['dcp_pressure'] ?? $aparTypes['powder'],
                'capacity' => 6,
                'manufactured_date' => '2023-06-18',
                'expired_at' => '2026-08-25',
                'status' => 'active',
                'notes' => 'Area pemeriksaan awal kelengkapan safety mobil tangki masuk.',
            ],
            [
                'serial_number' => 'APAR-MAOS-SEC-02',
                'location_name' => 'Pos Security Gate 2 (Akses Keluar Terminal)',
                'latitude' => -7.621100,
                'longitude' => 109.141350,
                'type' => $aparTypes['dcp_pressure'] ?? $aparTypes['powder'],
                'capacity' => 6,
                'manufactured_date' => '2023-06-18',
                'expired_at' => '2026-08-25',
                'status' => 'active',
                'notes' => 'Pemeriksaan akhir dokumen segel & pengantar distribusi.',
            ],
            [
                'serial_number' => 'APAR-MAOS-WS-01',
                'location_name' => 'Workshop Sarfas & Bengkel Pemeliharaan MT',
                'latitude' => -7.621800,
                'longitude' => 109.143100,
                'type' => $aparTypes['dcp_cartridge'] ?? $aparTypes['powder'],
                'capacity' => 6,
                'manufactured_date' => '2023-07-01',
                'expired_at' => '2026-10-05',
                'status' => 'active',
                'notes' => 'Area perbaikan dan maintenance fasilitas terminal.',
            ],
            [
                'serial_number' => 'APAR-MAOS-LAB-01',
                'location_name' => 'Laboratorium QC Pengujian Mutu Produk BBM',
                'latitude' => -7.621650,
                'longitude' => 109.142050,
                'type' => $aparTypes['co2'] ?? 2,
                'capacity' => 3,
                'manufactured_date' => '2023-08-10',
                'expired_at' => '2026-11-01',
                'status' => 'active',
                'notes' => 'Ruang steril pengujian density, flash point & parameter mutu.',
            ],
            [
                'serial_number' => 'APAR-MAOS-GD-01',
                'location_name' => 'Gudang Cadangan APAR (DCM Storage Room)',
                'latitude' => -7.621900,
                'longitude' => 109.143250,
                'type' => $aparTypes['dcp_pressure'] ?? $aparTypes['powder'],
                'capacity' => 6,
                'manufactured_date' => '2023-09-15',
                'expired_at' => '2026-09-15',
                'status' => 'active',
                'notes' => 'Buffer stock tabung siap pakai untuk pergantian darurat.',
            ],
            [
                'serial_number' => 'APAR-MAOS-PK-01',
                'location_name' => 'Area Parkir & Staging Mobil Tangki',
                'latitude' => -7.621300,
                'longitude' => 109.141600,
                'type' => $aparTypes['foam'] ?? 3,
                'capacity' => 9,
                'manufactured_date' => '2023-10-10',
                'expired_at' => '2026-12-05',
                'status' => 'active',
                'notes' => 'Titik kumpul armada mobil tangki siap antrean pengisian.',
            ],
        ];

        foreach ($staticApars as $aparData) {
            Apar::updateOrCreate(
                ['serial_number' => $aparData['serial_number']],
                [
                    'qr_code' => 'QR-' . $aparData['serial_number'],
                    'location_type' => 'statis',
                    'location_name' => $aparData['location_name'],
                    'latitude' => $aparData['latitude'],
                    'longitude' => $aparData['longitude'],
                    'valid_radius' => 50,
                    'apar_type_id' => $aparData['type'],
                    'capacity' => $aparData['capacity'],
                    'manufactured_date' => $aparData['manufactured_date'],
                    'expired_at' => $aparData['expired_at'],
                    'status' => $aparData['status'],
                    'notes' => $aparData['notes'],
                ]
            );
        }
    }
}