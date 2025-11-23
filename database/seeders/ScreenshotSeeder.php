<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Apar;
use App\Models\AparType;
use App\Models\Inspection;
use App\Models\RepairApproval;
use App\Models\InspectionDamage;
use App\Models\DamageCategory;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class ScreenshotSeeder extends Seeder
{
    public function run()
    {
        // 1. Ensure Users Exist
        $admin = User::firstOrCreate(
            ['email' => 'admin@cakap-pertamina.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'nip' => 'ADMIN001',
                'position' => 'Administrator'
            ]
        );

        $supervisor = User::firstOrCreate(
            ['email' => 'supervisor@cakap-pertamina.com'],
            [
                'name' => 'Supervisor User',
                'password' => Hash::make('password123'),
                'role' => 'supervisor',
                'nip' => 'SPV001',
                'position' => 'Supervisor'
            ]
        );

        $teknisi = User::firstOrCreate(
            ['email' => 'teknisi1@cakap-pertamina.com'],
            [
                'name' => 'Teknisi User',
                'password' => Hash::make('password123'),
                'role' => 'teknisi',
                'nip' => 'TEK001',
                'position' => 'Teknisi'
            ]
        );

        // 2. Ensure APAR Type Exists
        $aparType = AparType::firstOrCreate(
            ['name' => 'Powder 3kg'],
            ['description' => 'Standard Powder APAR']
        );

        // 3. Ensure APAR Exists (QR Code: APAR-001)
        $apar = Apar::updateOrCreate(
            ['qr_code' => 'APAR-001'],
            [
                'serial_number' => 'APAR-001',
                'apar_type_id' => $aparType->id,
                'location_type' => 'statis',
                'location_name' => 'Main Lobby',
                'status' => 'active',
                'expired_at' => Carbon::now()->addYear(),
                'manufactured_date' => '2023-01-01',
                'valid_radius' => 50,
                'latitude' => -6.200000,
                'longitude' => 106.816666,
                'capacity' => 3
            ]
        );

        // 4. Create Damage Category
        $damageCategory = DamageCategory::firstOrCreate(
            ['name' => 'Tabung Karat'],
            ['description' => 'Karat pada tabung', 'is_active' => true, 'type' => 'Powder 3kg']
        );

        // 5. Create Pending Repair Approval (For Supervisor Tests)
        // First, create a damaged inspection that requires repair
        $damagedInspection = Inspection::create([
            'apar_id' => $apar->id,
            'user_id' => $teknisi->id,
            'condition' => 'damaged',
            'requires_repair' => true,
            'repair_status' => 'pending_approval',
            'inspection_lat' => -6.200000,
            'inspection_lng' => 106.816666,
            'location_valid' => true,
            'is_valid' => true,
            'notes' => 'Tabung berkarat parah',
            'photo_url' => 'inspections/dummy.jpg',
            'selfie_url' => 'inspections/dummy_selfie.jpg',
        ]);

        // Add damage detail
        InspectionDamage::create([
            'inspection_id' => $damagedInspection->id,
            'damage_category_id' => $damageCategory->id,
            'notes' => 'Karat di bagian bawah',
            'damage_photo_url' => 'damages/dummy.jpg',
            'severity' => 'medium'
        ]);

        // Create the Repair Approval record
        RepairApproval::create([
            'inspection_id' => $damagedInspection->id,
            'status' => 'pending',
            'created_at' => Carbon::now(),
        ]);

        // 6. Create Approved Inspection (For Technician Tests)
        $approvedInspection = Inspection::create([
            'apar_id' => $apar->id,
            'user_id' => $teknisi->id,
            'condition' => 'damaged',
            'requires_repair' => true,
            'repair_status' => 'approved', // Approved by supervisor
            'inspection_lat' => -6.200000,
            'inspection_lng' => 106.816666,
            'location_valid' => true,
            'is_valid' => true,
            'notes' => 'Approved repair request',
            'photo_url' => 'inspections/dummy_approved.jpg',
            'selfie_url' => 'inspections/dummy_selfie.jpg',
        ]);

        RepairApproval::create([
            'inspection_id' => $approvedInspection->id,
            'status' => 'approved',
            'approved_by' => $supervisor->id,
            'supervisor_notes' => 'Silakan diperbaiki',
            'approved_at' => Carbon::now()->subDay(),
            'decision_made_at' => Carbon::now()->subDay(),
        ]);

        // 7. Create Rejected Inspection (For Technician Tests)
        $rejectedInspection = Inspection::create([
            'apar_id' => $apar->id,
            'user_id' => $teknisi->id,
            'condition' => 'damaged',
            'requires_repair' => true,
            'repair_status' => 'rejected', // Rejected by supervisor
            'inspection_lat' => -6.200000,
            'inspection_lng' => 106.816666,
            'location_valid' => true,
            'is_valid' => true,
            'notes' => 'Rejected repair request',
            'photo_url' => 'inspections/dummy_rejected.jpg',
            'selfie_url' => 'inspections/dummy_selfie.jpg',
        ]);

        RepairApproval::create([
            'inspection_id' => $rejectedInspection->id,
            'status' => 'rejected',
            'approved_by' => $supervisor->id,
            'supervisor_notes' => 'Kerusakan minor, tidak perlu ganti',
            'rejection_reason' => 'Minor damage',
            'decision_made_at' => Carbon::now()->subDay(),
        ]);

        $this->command->info('Screenshot data seeded successfully!');
    }
}
