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
            [
                'name' => 'Cat tabung rusak/pudar',
                'description' => 'Cat pada tabung APAR mengalami kerusakan atau pudar',
                'is_active' => true,
            ],
            [
                'name' => 'Label instruksi pudar/tidak terbaca',
                'description' => 'Label instruksi penggunaan APAR pudar atau tidak dapat dibaca',
                'is_active' => true,
            ],
            [
                'name' => 'Segel pengaman hilang/rusak',
                'description' => 'Segel pengaman APAR hilang atau mengalami kerusakan',
                'is_active' => true,
            ],
            [
                'name' => 'Pin pengaman bengkok/berkarat',
                'description' => 'Pin pengaman APAR bengkok atau berkarat',
                'is_active' => true,
            ],
            [
                'name' => 'Selang retak/kaku/tersumbat',
                'description' => 'Selang APAR retak, kaku, atau tersumbat',
                'is_active' => true,
            ],
            [
                'name' => 'Handle patah/macet',
                'description' => 'Handle atau pegangan APAR patah atau macet',
                'is_active' => true,
            ],
            [
                'name' => 'Tekanan kerja tidak sesuai',
                'description' => 'Tekanan kerja APAR tidak sesuai dengan standar yang ditentukan',
                'is_active' => true,
            ],
            [
                'name' => 'Berat isi tidak sesuai standar',
                'description' => 'Berat isi media APAR tidak sesuai dengan standar yang ditentukan',
                'is_active' => true,
            ],
            [
                'name' => 'Valve bocor/macet',
                'description' => 'Valve APAR bocor atau macet',
                'is_active' => true,
            ],
            [
                'name' => 'Bodi tabung penyok/berkarat/retak',
                'description' => 'Bodi tabung APAR penyok, berkarat, atau retak',
                'is_active' => true,
            ],
            [
                'name' => 'Media menggumpal/bocor',
                'description' => 'Media APAR menggumpal atau bocor',
                'is_active' => true,
            ],
            [
                'name' => 'Tanggal kadaluarsa terlewati',
                'description' => 'Tanggal kadaluarsa APAR sudah terlewati',
                'is_active' => true,
            ],
            [
                'name' => 'Kartu inspeksi tidak terisi',
                'description' => 'Kartu inspeksi APAR tidak terisi dengan lengkap',
                'is_active' => true,
            ],
            [
                'name' => 'Sertifikasi/uji hidrostatik kadaluarsa',
                'description' => 'Sertifikasi atau uji hidrostatik APAR sudah kadaluarsa',
                'is_active' => true,
            ],
            [
                'name' => 'Nomor seri tidak terbaca',
                'description' => 'Nomor seri APAR tidak dapat dibaca dengan jelas',
                'is_active' => true,
            ],
            [
                'name' => 'Lokasi penempatan tidak sesuai',
                'description' => 'Lokasi penempatan APAR tidak sesuai dengan standar',
                'is_active' => true,
            ],
            [
                'name' => 'Kondisi sekitar tidak aman',
                'description' => 'Kondisi sekitar APAR tidak aman atau berbahaya',
                'is_active' => true,
            ],
            [
                'name' => 'Bracket/pengikat tidak kokoh',
                'description' => 'Bracket atau pengikat APAR tidak kokoh atau rusak',
                'is_active' => true,
            ],
        ];

        foreach ($categories as $category) {
            DamageCategory::create($category);
        }
    }
}
