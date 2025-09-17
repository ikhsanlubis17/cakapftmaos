<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Inspection;
use App\Models\Apar;
use App\Models\User;
use Carbon\Carbon;

class DashboardTestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get APARs and users
        $apars = Apar::take(7)->get();
        $users = User::take(3)->get();

        if ($apars->isEmpty() || $users->isEmpty()) {
            return;
        }

        // Clear existing inspections to avoid duplicates
        // Note: We can't use truncate due to foreign key constraints
        Inspection::query()->delete();

        // Create realistic inspection data for the current week
        $currentWeek = Carbon::now()->startOfWeek();
        
        // Monday - Mostly good inspections
        $this->createDayInspections($currentWeek->copy()->addDays(0), $apars, $users, [
            'good' => 3,
            'needs_repair' => 1
        ]);

        // Tuesday - No inspections
        // $this->createDayInspections($currentWeek->copy()->addDays(1), $apars, $users, []);

        // Wednesday - Good inspections
        $this->createDayInspections($currentWeek->copy()->addDays(2), $apars, $users, [
            'good' => 3,
            'needs_repair' => 0
        ]);

        // Thursday - Some needs repair
        $this->createDayInspections($currentWeek->copy()->addDays(3), $apars, $users, [
            'good' => 2,
            'needs_repair' => 1
        ]);

        // Friday - Mixed conditions
        $this->createDayInspections($currentWeek->copy()->addDays(4), $apars, $users, [
            'good' => 2,
            'needs_repair' => 2
        ]);

        // Saturday - No inspections
        // $this->createDayInspections($currentWeek->copy()->addDays(5), $apars, $users, []);

        // Sunday - One good inspection
        $this->createDayInspections($currentWeek->copy()->addDays(6), $apars, $users, [
            'good' => 1,
            'needs_repair' => 0
        ]);

        // Create some older inspections for historical data
        $this->createHistoricalInspections($apars, $users);

        $this->command->info('Dashboard test data created successfully!');
        $this->command->info('Expected totals:');
        $this->command->info('- Good: 11 inspections');
        $this->command->info('- Needs Repair: 4 inspections');
        $this->command->info('- Total: 15 inspections');
    }

    /**
     * Create inspections for a specific day
     */
    private function createDayInspections(Carbon $date, $apars, $users, array $conditions): void
    {
        foreach ($conditions as $condition => $count) {
            for ($i = 0; $i < $count; $i++) {
                $apar = $apars->random();
                $user = $users->random();
                
                Inspection::create([
                    'apar_id' => $apar->id,
                    'user_id' => $user->id,
                    'photo_url' => '/storage/photos/sample_inspection.jpg',
                    'condition' => $condition,
                    'notes' => $this->getConditionNotes($condition),
                    'created_at' => $date->copy()->addHours(rand(8, 17)),
                    'updated_at' => $date->copy()->addHours(rand(8, 17)),
                ]);
            }
        }
    }

    /**
     * Create historical inspections for the past month
     */
    private function createHistoricalInspections($apars, $users): void
    {
        for ($i = 1; $i <= 10; $i++) {
            $apar = $apars->random();
            $user = $users->random();
            $date = Carbon::now()->subDays(rand(8, 30));
            
            // 80% good, 20% needs_repair for historical data
            $condition = rand(1, 100) <= 80 ? 'good' : 'needs_repair';
            
            Inspection::create([
                'apar_id' => $apar->id,
                'user_id' => $user->id,
                'photo_url' => '/storage/photos/sample_inspection.jpg',
                'condition' => $condition,
                'notes' => $this->getConditionNotes($condition),
                'created_at' => $date,
                'updated_at' => $date,
            ]);
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
