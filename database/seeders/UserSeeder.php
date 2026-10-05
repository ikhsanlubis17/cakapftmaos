<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Admin HSSE FT Maos
        User::updateOrCreate(
            ['email' => 'admin@cakap-pertamina.com'],
            [
                'name' => 'Administrator (HSSE Officer)',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'phone' => '081328456701',
                'is_active' => 1,
                'email_verified_at' => now(),
            ]
        );

        // 2. Supervisor HSSE FT Maos
        User::updateOrCreate(
            ['email' => 'supervisor@cakap-pertamina.com'],
            [
                'name' => 'Dedi Kurniawan',
                'password' => Hash::make('password123'),
                'role' => 'supervisor',
                'phone' => '081328456702',
                'is_active' => 1,
                'email_verified_at' => now(),
            ]
        );

        // 3. Teknisi Utama (Akbar Noeh)
        User::updateOrCreate(
            ['email' => 'teknisi1@cakap-pertamina.com'],
            [
                'name' => 'Akbar Noeh',
                'password' => Hash::make('password123'),
                'role' => 'teknisi',
                'phone' => '081328456703',
                'is_active' => 1,
                'email_verified_at' => now(),
            ]
        );

        // 4. Teknisi HSSE Tambahan (Berdasarkan data inspeksi lapangan SUMBER REKAP APAR)
        $additionalTechnicians = [
            [
                'name' => 'Ade Tri Nazril Ilham',
                'email' => 'ade.tri@cakap-pertamina.com',
                'phone' => '081328456704',
            ],
            [
                'name' => 'Arga Nurul Hidayah Putra',
                'email' => 'arga.putra@cakap-pertamina.com',
                'phone' => '081328456705',
            ],
            [
                'name' => 'Hendi Pranata',
                'email' => 'hendi.pranata@cakap-pertamina.com',
                'phone' => '081328456706',
            ],
            [
                'name' => 'Sahrul Dwi Julianto',
                'email' => 'sahrul.dwi@cakap-pertamina.com',
                'phone' => '081328456707',
            ],
            [
                'name' => 'Teguh',
                'email' => 'teguh@cakap-pertamina.com',
                'phone' => '081328456708',
            ],
        ];

        foreach ($additionalTechnicians as $tech) {
            User::updateOrCreate(
                ['email' => $tech['email']],
                [
                    'name' => $tech['name'],
                    'password' => Hash::make('password123'),
                    'role' => 'teknisi',
                    'phone' => $tech['phone'],
                    'is_active' => 1,
                    'email_verified_at' => now(),
                ]
            );
        }
    }
}