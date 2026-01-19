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
        User::firstOrCreate(
            ['email' => 'admin@cakap-pertamina.com'],
            [
                'name' => 'Administrator',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'phone' => '081234567890',
                'is_active' => 1,
                'email_verified_at' => now(),
            ]
        );

        // Create teknisi users
        User::firstOrCreate(
            ['email' => 'teknisi1@cakap-pertamina.com'],
            [
                'name' => 'Teknisi 1',
                'password' => Hash::make('password123'),
                'role' => 'teknisi',
                'phone' => '081234567891',
                'is_active' => 1,
                'email_verified_at' => now(),
            ]
        );

        // Create supervisor user
        User::firstOrCreate(
            ['email' => 'supervisor@cakap-pertamina.com'],
            [
                'name' => 'Supervisor',
                'password' => Hash::make('password123'),
                'role' => 'supervisor',
                'phone' => '081234567893',
                'is_active' => 1,
                'email_verified_at' => now(),
            ]
        );

        // Create checker user
        User::firstOrCreate(
            ['email' => 'checker@cakap-pertamina.com'],
            [
                'name' => 'Checker',
                'password' => Hash::make('password123'),
                'role' => 'checker',
                'phone' => '081234567894',
                'is_active' => 1,
                'email_verified_at' => now(),
            ]
        );
    }
}