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
            'needs_refill' => 1
        ]);

        // Tuesday - No inspections
        // $this->createDayInspections($currentWeek->copy()->addDays(1), $apars, $users, []);

        // Wednesday - Good inspections
        $this->createDayInspections($currentWeek->copy()->addDays(2), $apars, $users, [
            'good' => 2,
            'damaged' => 1
        ]);

        // Thursday - Some needs repair
        $this->createDayInspections($currentWeek->copy()->addDays(3), $apars, $users, [
            'good' => 2,
            'needs_refill' => 1
        ]);

        // Friday - Mixed conditions
        $this->createDayInspections($currentWeek->copy()->addDays(4), $apars, $users, [
            'good' => 1,
            'needs_refill' => 1,
            'damaged' => 1,
            'expired' => 1
        ]);

        // Saturday - No inspections
        // $this->createDayInspections($currentWeek->copy()->addDays(5), $apars, $users, []);

        // Sunday - One good inspection
        $this->createDayInspections($currentWeek->copy()->addDays(6), $apars, $users, [
            'good' => 1
        ]);

        // Create some older inspections for historical data
        $this->createHistoricalInspections($apars, $users);

        $this->command->info('Dashboard test data created successfully!');
        $this->command->info('Expected totals:');
    $this->command->info('- Good: 9 inspections');
    $this->command->info('- Needs Refill: 3 inspections');
    $this->command->info('- Damaged: 2 inspections');
    $this->command->info('- Expired: 1 inspection');
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
            
            $condition = $this->getWeightedCondition();
            
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
            case 'needs_refill':
                return 'Tekanan tabung menurun, perlu isi ulang segera';
            case 'damaged':
                return 'Komponen APAR rusak dan perlu perbaikan';
            case 'expired':
                return 'Masa berlaku APAR telah habis dan perlu diganti';
            default:
                return 'Inspeksi rutin';
        }
    }

    private function getWeightedCondition(): string
    {
        $random = rand(1, 100);

        if ($random <= 60) {
            return 'good';
        }

        if ($random <= 80) {
            return 'needs_refill';
        }

        if ($random <= 92) {
            return 'damaged';
        }

        return 'expired';
    }
}
