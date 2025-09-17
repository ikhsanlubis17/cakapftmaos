<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\AparType;

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
                'is_active' => true
            ],
            [
                'name' => 'co2',
                'description' => 'APAR CO2 untuk memadamkan api kelas B dan C',
                'is_active' => true
            ],
            [
                'name' => 'foam',
                'description' => 'APAR Foam untuk memadamkan api kelas A dan B',
                'is_active' => true
            ],
            [
                'name' => 'liquid',
                'description' => 'APAR Liquid untuk memadamkan api kelas A',
                'is_active' => true
            ]
        ];

        foreach ($aparTypes as $aparType) {
            AparType::updateOrCreate(
                ['name' => $aparType['name']],
                $aparType
            );
        }
    }
}
