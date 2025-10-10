<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Apar;
use App\Models\AparType;
use App\Models\TankTruck;
use Illuminate\Support\Str;

class AparSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get AparType IDs by name
        $aparTypes = AparType::pluck('id', 'name')->toArray();

        // Create tank trucks
        $tankTruck1 = TankTruck::create([
            'plate_number' => 'B 1234 ABC',
            'driver_name' => 'Supir Mobil 1',
            'driver_phone' => '081234567894',
            'description' => 'Mobil tangki untuk distribusi BBM',
            'status' => 'active',
        ]);

        $tankTruck2 = TankTruck::create([
            'plate_number' => 'B 5678 DEF',
            'driver_name' => 'Supir Mobil 2',
            'driver_phone' => '081234567895',
            'description' => 'Mobil tangki untuk distribusi LPG',
            'status' => 'active',
        ]);

        // Create static APARs
        $staticApars = [
            [
                'serial_number' => 'APAR-STATIS-001',
                'location_name' => 'Gedung Utama - Lantai 1',
                'latitude' => -6.2088,
                'longitude' => 106.8456,
                'type' => 'powder',
                'capacity' => 6,
                'manufactured_date' => '2023-01-15',
                'expired_at' => '2026-01-15',
            ],
            [
                'serial_number' => 'APAR-STATIS-002',
                'location_name' => 'Gedung Utama - Lantai 2',
                'latitude' => -6.2088,
                'longitude' => 106.8456,
                'type' => 'co2',
                'capacity' => 3,
                'manufactured_date' => '2023-02-20',
                'expired_at' => '2026-02-20',
            ],
            [
                'serial_number' => 'APAR-STATIS-003',
                'location_name' => 'Depo BBM - Area Pengisian',
                'latitude' => -6.2088,
                'longitude' => 106.8456,
                'type' => 'foam',
                'capacity' => 9,
                'manufactured_date' => '2023-03-10',
                'expired_at' => '2026-03-10',
            ],
            [
                'serial_number' => 'APAR-STATIS-004',
                'location_name' => 'Depo BBM - Gudang',
                'latitude' => -6.2088,
                'longitude' => 106.8456,
                'type' => 'powder',
                'capacity' => 6,
                'manufactured_date' => '2023-04-05',
                'expired_at' => '2026-04-05',
            ],
        ];

        foreach ($staticApars as $aparData) {
            Apar::create([
                'serial_number' => $aparData['serial_number'],
                'qr_code' => 'APAR-' . Str::random(10),
                'location_type' => 'statis',
                'location_name' => $aparData['location_name'],
                'latitude' => $aparData['latitude'],
                'longitude' => $aparData['longitude'],
                'valid_radius' => 30,
                'apar_type_id' => $aparTypes[$aparData['type']], 
                'capacity' => $aparData['capacity'],
                'manufactured_date' => $aparData['manufactured_date'],
                'expired_at' => $aparData['expired_at'],
                'status' => 'active',
            ]);
        }

        // Create mobile APARs
        $mobileApars = [
            [
                'serial_number' => 'APAR-MOBILE-001',
                'location_name' => 'Mobil Tangki B 1234 ABC',
                'type' => 'powder',
                'capacity' => 6,
                'manufactured_date' => '2023-05-12',
                'expired_at' => '2026-05-12',
                'tank_truck_id' => $tankTruck1->id,
            ],
            [
                'serial_number' => 'APAR-MOBILE-002',
                'location_name' => 'Mobil Tangki B 5678 DEF',
                'type' => 'co2',
                'capacity' => 3,
                'manufactured_date' => '2023-06-18',
                'expired_at' => '2026-06-18',
                'tank_truck_id' => $tankTruck2->id,
            ],
        ];

        foreach ($mobileApars as $aparData) {
            Apar::create([
                'serial_number' => $aparData['serial_number'],
                'qr_code' => 'APAR-' . Str::random(10),
                'location_type' => 'mobile',
                'location_name' => $aparData['location_name'],
                'apar_type_id' => $aparTypes[$aparData['type']],
                'capacity' => $aparData['capacity'],
                'manufactured_date' => $aparData['manufactured_date'],
                'expired_at' => $aparData['expired_at'],
                'tank_truck_id' => $aparData['tank_truck_id'],
                'status' => 'active',
            ]);
        }

        // Create some APARs that need attention
        Apar::create([
            'serial_number' => 'APAR-STATIS-005',
            'qr_code' => 'APAR-' . Str::random(10),
            'location_type' => 'statis',
            'location_name' => 'Gedung Utama - Lantai 3',
            'latitude' => -6.2088,
            'longitude' => 106.8456,
            'valid_radius' => 30,
            'apar_type_id' => $aparTypes['powder'],
            'capacity' => 6,
            'manufactured_date' => '2022-12-01',
            'expired_at' => '2025-12-01',
            'status' => 'refill', 
        ]);

        Apar::create([
            'serial_number' => 'APAR-STATIS-006',
            'qr_code' => 'APAR-' . Str::random(10),
            'location_type' => 'statis',
            'location_name' => 'Depo BBM - Area Parkir',
            'latitude' => -6.2088,
            'longitude' => 106.8456,
            'valid_radius' => 30,
            'apar_type_id' => $aparTypes['foam'],
            'capacity' => 9,
            'manufactured_date' => '2021-08-15',
            'expired_at' => '2024-08-15',
            'status' => 'expired', 
        ]);
    }
}