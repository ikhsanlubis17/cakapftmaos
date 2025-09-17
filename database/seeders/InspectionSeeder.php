<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Inspection;
use App\Models\Apar;
use App\Models\User;
use Carbon\Carbon;

class InspectionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get some APARs and users for creating inspections
        $apars = Apar::take(5)->get();
        $users = User::take(3)->get();

        if ($apars->isEmpty() || $users->isEmpty()) {
            return; // Skip if no APARs or users exist
        }

        // Create inspections for the current week
        $currentWeek = Carbon::now()->startOfWeek();
        
        for ($i = 0; $i < 7; $i++) {
            $date = $currentWeek->copy()->addDays($i);
            $inspectionsCount = rand(1, 5); // Random number of inspections per day
            
            for ($j = 0; $j < $inspectionsCount; $j++) {
                $apar = $apars->random();
                $user = $users->random();
                
                // Ensure we have a good mix of conditions, with some "needs_repair"
                $condition = $this->getWeightedCondition();
                
                Inspection::create([
                    'apar_id' => $apar->id,
                    'user_id' => $user->id,
                    'photo_url' => '/storage/photos/sample_inspection.jpg', // Required field
                    'condition' => $condition,
                    'notes' => $this->getConditionNotes($condition),
                    'created_at' => $date->copy()->addHours(rand(8, 17)), // Random time during work hours
                    'updated_at' => $date->copy()->addHours(rand(8, 17)),
                ]);
            }
        }

        // Create some older inspections for variety
        for ($i = 1; $i <= 10; $i++) {
            $apar = $apars->random();
            $user = $users->random();
            $date = Carbon::now()->subDays(rand(8, 30));
            
            // Ensure we have a good mix of conditions, with some "needs_repair"
            $condition = $this->getWeightedCondition();
            
            Inspection::create([
                'apar_id' => $apar->id,
                'user_id' => $user->id,
                'photo_url' => '/storage/photos/sample_inspection.jpg', // Required field
                'condition' => $condition,
                'notes' => $this->getConditionNotes($condition),
                'created_at' => $date,
                'updated_at' => $date,
            ]);
        }
    }

    /**
     * Get a weighted condition to ensure we have realistic data distribution
     * 70% good, 30% needs_repair (more realistic for real-world scenarios)
     */
    private function getWeightedCondition(): string
    {
        $random = rand(1, 100);
        
        if ($random <= 70) {
            return 'good';
        } else {
            return 'needs_repair';
        }
    }

    /**
     * Get appropriate notes based on the condition
     */
    private function getConditionNotes(string $condition): string
    {
        switch ($condition) {
            case 'good':
                return 'APAR dalam kondisi baik dan siap digunakan';
            case 'needs_repair':
                return 'APAR memerlukan perbaikan atau maintenance';
            default:
                return 'Inspeksi rutin';
        }
    }
} 