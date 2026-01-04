<?php

namespace Database\Seeders;

use App\Models\AparType;
use Illuminate\Database\Seeder;

class AparTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $aparTypes = [
            [
                'name' => 'powder',
                'description' => 'APAR Powder untuk memadamkan api kelas A, B, dan C',
                'is_active' => true,
            ],
            [
                'name' => 'co2',
                'description' => 'APAR CO2 untuk memadamkan api kelas B dan C',
                'is_active' => true,
            ],
            [
                'name' => 'foam',
                'description' => 'APAR Foam untuk memadamkan api kelas A dan B',
                'is_active' => true,
            ],
            [
                'name' => 'liquid',
                'description' => 'APAR Liquid untuk memadamkan api kelas A',
                'is_active' => true,
            ],
            [
                'name' => 'dcp_pressure',
                'description' => 'APAR DCP Pressure untuk memadamkan api kelas A, B, dan C',
                'is_active' => true,
            ],
            [
                'name' => 'dcp_cartridge',
                'description' => 'APAR DCP Cartridge untuk memadamkan api kelas A, B, dan C',
                'is_active' => true,
            ],
        ];

        foreach ($aparTypes as $aparType) {
            AparType::updateOrCreate(
                ['name' => $aparType['name']],
                $aparType
            );
        }
    }
}
