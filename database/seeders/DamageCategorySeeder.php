<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\DamageCategory;

class DamageCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            // CO2 Type
            [
                'name' => 'Berat isi tidak sesuai standar',
                'type' => 'co2',
                'description' => 'Berat isi CO₂ dalam tabung tidak sesuai dengan standar yang ditentukan',
                'is_active' => true,
            ],
            [
                'name' => 'Katup / valve aus atau bocor',
                'type' => 'co2',
                'description' => 'Katup atau valve mengalami keausan atau kebocoran',
                'is_active' => true,
            ],
            [
                'name' => 'Selang discharge retak atau tersumbat',
                'type' => 'co2',
                'description' => 'Selang discharge mengalami keretakan atau tersumbat',
                'is_active' => true,
            ],
            [
                'name' => 'Horn CO₂ patah atau longgar',
                'type' => 'co2',
                'description' => 'Horn CO₂ mengalami kepatahan atau kondisi longgar',
                'is_active' => true,
            ],
            [
                'name' => 'Tekanan pada cylinder tidak stabil',
                'type' => 'co2',
                'description' => 'Tekanan pada cylinder CO₂ tidak stabil atau berfluktuasi',
                'is_active' => true,
            ],
            [
                'name' => 'Body tabung berkarat atau penyok',
                'type' => 'co2',
                'description' => 'Body tabung mengalami karat atau penyok',
                'is_active' => true,
            ],
            [
                'name' => 'Pin pengaman hilang / tidak terkunci',
                'type' => 'co2',
                'description' => 'Pin pengaman hilang atau tidak terkunci dengan baik',
                'is_active' => true,
            ],
            [
                'name' => 'Label identitas hilang atau tidak terbaca',
                'type' => 'co2',
                'description' => 'Label identitas hilang atau sudah tidak dapat terbaca',
                'is_active' => true,
            ],

            // Foam Type
            [
                'name' => 'Media foam terkontaminasi atau membeku',
                'type' => 'foam',
                'description' => 'Media foam mengalami kontaminasi atau membeku',
                'is_active' => true,
            ],
            [
                'name' => 'Valve tidak berfungsi atau bocor',
                'type' => 'foam',
                'description' => 'Valve tidak berfungsi dengan baik atau mengalami kebocoran',
                'is_active' => true,
            ],
            [
                'name' => 'Tekanan tabung di bawah standar',
                'type' => 'foam',
                'description' => 'Tekanan tabung berada di bawah standar yang ditentukan',
                'is_active' => true,
            ],
            [
                'name' => 'Selang retak atau bocor',
                'type' => 'foam',
                'description' => 'Selang mengalami keretakan atau kebocoran',
                'is_active' => true,
            ],
            [
                'name' => 'Nozzle tersumbat',
                'type' => 'foam',
                'description' => 'Nozzle mengalami penyumbatan',
                'is_active' => true,
            ],
            [
                'name' => 'Tabung berkarat, penyok, atau terdapat pitting',
                'type' => 'foam',
                'description' => 'Tabung mengalami karat, penyok, atau terdapat pitting',
                'is_active' => true,
            ],
            [
                'name' => 'Pin pengaman rusak / hilang',
                'type' => 'foam',
                'description' => 'Pin pengaman mengalami kerusakan atau hilang',
                'is_active' => true,
            ],
            [
                'name' => 'Indikator tekanan tidak bergerak',
                'type' => 'foam',
                'description' => 'Indikator tekanan tidak bergerak atau macet',
                'is_active' => true,
            ],

            // Liquid / Wet Chemical Type
            [
                'name' => 'Cairan kimia berkurang atau memadat',
                'type' => 'liquid',
                'description' => 'Cairan kimia berkurang dari volume standar atau mengalami pemadatan',
                'is_active' => true,
            ],
            [
                'name' => 'Valve bocor atau macet',
                'type' => 'liquid',
                'description' => 'Valve mengalami kebocoran atau macet',
                'is_active' => true,
            ],
            [
                'name' => 'Selang lembek, menguning, atau robek',
                'type' => 'liquid',
                'description' => 'Selang mengalami kelembakan, perubahan warna menjadi kuning, atau robek',
                'is_active' => true,
            ],
            [
                'name' => 'Nozzle korosi atau tersumbat',
                'type' => 'liquid',
                'description' => 'Nozzle mengalami korosi atau tersumbat',
                'is_active' => true,
            ],
            [
                'name' => 'Tekanan tidak berada pada area hijau',
                'type' => 'liquid',
                'description' => 'Tekanan tidak berada pada area hijau (zona aman)',
                'is_active' => true,
            ],
            [
                'name' => 'Body tabung terdapat karat atau korosi berat',
                'type' => 'liquid',
                'description' => 'Body tabung mengalami karat atau korosi yang parah',
                'is_active' => true,
            ],
            [
                'name' => 'Label instruksi rusak / tidak terbaca',
                'type' => 'liquid',
                'description' => 'Label instruksi penggunaan rusak atau tidak dapat terbaca',
                'is_active' => true,
            ],
            [
                'name' => 'Seal pengaman rusak',
                'type' => 'liquid',
                'description' => 'Seal pengaman mengalami kerusakan',
                'is_active' => true,
            ],

            // Powder (Dry Chemical) Type
            [
                'name' => 'Bubuk dalam tabung menggumpal (cakey)',
                'type' => 'powder',
                'description' => 'Bubuk dry chemical dalam tabung mengalami penggumpalan',
                'is_active' => true,
            ],
            [
                'name' => 'Tekanan turun di bawah standar',
                'type' => 'powder',
                'description' => 'Tekanan turun di bawah standar yang ditentukan',
                'is_active' => true,
            ],
            [
                'name' => 'Selang pecah atau kaku',
                'type' => 'powder',
                'description' => 'Selang mengalami keretakan atau menjadi kaku',
                'is_active' => true,
            ],
            [
                'name' => 'Nozzle tersumbat bubuk',
                'type' => 'powder',
                'description' => 'Nozzle tersumbat oleh bubuk dry chemical',
                'is_active' => true,
            ],
            [
                'name' => 'Valve bocor',
                'type' => 'powder',
                'description' => 'Valve mengalami kebocoran',
                'is_active' => true,
            ],
            [
                'name' => 'Corrosion / karat pada bagian bawah tabung',
                'type' => 'powder',
                'description' => 'Terdapat korosi atau karat pada bagian bawah tabung',
                'is_active' => true,
            ],
            [
                'name' => 'Pin pengaman tidak ada',
                'type' => 'powder',
                'description' => 'Pin pengaman hilang atau tidak ada',
                'is_active' => true,
            ],
            [
                'name' => 'Gauge rusak atau tidak akurat',
                'type' => 'powder',
                'description' => 'Gauge pressure rusak atau tidak menunjukkan tekanan yang akurat',
                'is_active' => true,
            ],
        ];

        foreach ($categories as $category) {
            DamageCategory::updateOrCreate(
                ['name' => $category['name'], 'type' => $category['type']],
                $category
            );
        }
    }
}
