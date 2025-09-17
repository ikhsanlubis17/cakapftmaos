<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\RepairApproval;
use App\Models\Inspection;
use App\Models\User;
use Carbon\Carbon;

class RepairApprovalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get some inspections with needs_repair condition for creating repair approvals
        $inspections = Inspection::where('condition', 'needs_repair')->take(10)->get();
        $users = User::take(3)->get();

        if ($inspections->isEmpty() || $users->isEmpty()) {
            $this->command->info('No inspections with needs_repair condition found. Creating sample data...');
            
            // If no inspections with needs_repair, create some sample repair approvals directly
            $this->createSampleRepairApprovals($users);
            return;
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

    /**
     * Create sample repair approvals when no inspections exist
     */
    private function createSampleRepairApprovals($users): void
    {
        $statuses = ['pending', 'approved', 'rejected', 'completed'];
        
        for ($i = 0; $i < 20; $i++) {
            $user = $users->random();
            $status = $statuses[array_rand($statuses)];
            $date = Carbon::now()->subDays(rand(1, 30));
            
            RepairApproval::create([
                'inspection_id' => null, // No inspection reference for sample data
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
        
        $this->command->info('Created 20 sample repair approvals with various statuses.');
    }
}
