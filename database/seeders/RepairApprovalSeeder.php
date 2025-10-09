<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\RepairApproval;
use App\Models\Inspection;
use App\Models\User;
use App\Models\Apar;
use Carbon\Carbon;

class RepairApprovalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get inspections that represent repair-worthy conditions
        $inspections = Inspection::whereIn('condition', ['damaged', 'expired'])->take(20)->get();
        $users = User::take(3)->get();

        if ($users->isEmpty()) {
            $this->command->info('RepairApprovalSeeder skipped: not enough users to associate approvals.');
            return;
        }

        if ($inspections->isEmpty()) {
            $this->command->info('No inspections with repairable condition found. Generating sample inspections...');

            $apars = Apar::take(5)->get();

            if ($apars->isEmpty()) {
                $this->command->info('RepairApprovalSeeder skipped: no APAR records available to create sample inspections.');
                return;
            }

            $newInspections = collect();
            $repairConditions = ['damaged', 'expired'];

            for ($i = 0; $i < 6; $i++) {
                $apar = $apars->random();
                $user = $users->random();
                $condition = $repairConditions[array_rand($repairConditions)];
                $timestamp = Carbon::now()->subDays(rand(3, 14));

                $inspection = Inspection::create([
                    'apar_id' => $apar->id,
                    'user_id' => $user->id,
                    'photo_url' => '/storage/photos/sample_inspection.jpg',
                    'condition' => $condition,
                    'notes' => 'Generated for repair approval seeding',
                    'status' => 'completed',
                    'requires_repair' => true,
                    'repair_status' => 'pending_approval',
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp,
                ]);

                $newInspections->push($inspection);
            }

            $inspections = $newInspections;
        }

        // Create repair approvals with different statuses
        $statuses = ['pending', 'approved', 'rejected', 'completed'];
        
        for ($i = 0; $i < 20; $i++) {
            $inspection = $inspections->random();
            $user = $users->random();
            $status = $statuses[array_rand($statuses)];
            $date = Carbon::now()->subDays(rand(1, 30));
            
            RepairApproval::create([
                'inspection_id' => $inspection->id,
                'approved_by' => $status === 'pending' ? null : $users->random()->id,
                'status' => $status,
                'admin_notes' => $status === 'rejected' ? 'Biaya terlalu tinggi atau tidak mendesak' : 'Disetujui untuk perbaikan',
                'repair_notes' => $status === 'completed' ? 'Perbaikan telah selesai dilakukan' : null,
                'approved_at' => $status === 'pending' ? null : $date->copy()->addDays(rand(1, 5)),
                'completed_at' => $status === 'completed' ? $date->copy()->addDays(rand(6, 10)) : null,
                'created_at' => $date,
                'updated_at' => $date,
            ]);
        }
    }
}
