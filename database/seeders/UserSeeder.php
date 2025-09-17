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
        // Create admin user
        User::create([
            'name' => 'Administrator',
            'email' => 'admin@cakap-pertamina.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'phone' => '081234567890',
            'is_active' => 1,
        ]);

        // Create teknisi users
        User::create([
            'name' => 'Teknisi 1',
            'email' => 'teknisi1@cakap-pertamina.com',
            'password' => Hash::make('password123'),
            'role' => 'teknisi',
            'phone' => '081234567891',
            'is_active' => 1,
        ]);

        User::create([
            'name' => 'Ikhsanul Arifin',
            'email' => 'lubis163774@gmail.com',
            'password' => Hash::make('password123'),
            'role' => 'teknisi',
            'phone' => '085248507938',
            'is_active' => 1,
        ]);

        // Create supervisor user
        User::create([
            'name' => 'Supervisor',
            'email' => 'supervisor@cakap-pertamina.com',
            'password' => Hash::make('password123'),
            'role' => 'supervisor',
            'phone' => '081234567893',
            'is_active' => 1,
        ]);
    }
}