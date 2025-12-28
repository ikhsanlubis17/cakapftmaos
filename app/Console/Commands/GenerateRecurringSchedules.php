<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\InspectionSchedule;
use App\Services\ScheduleService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class GenerateRecurringSchedules extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'inspections:generate-recurring {--force : Force generation without 7-day check (for testing)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate next inspection schedules for recurring inspections';

    /**
     * Execute the console command.
     */
    public function handle(ScheduleService $scheduleService)
    {
        $this->info('Starting recurring schedule generation...');
        
        if ($this->option('force')) {
            $this->warn('⚠️  FORCE MODE: Bypassing 7-day check for testing purposes');
        }
        
        try {
            // Get all active schedules that are recurring (not 'once')
            // We group by APAR to ensure we only look at the latest schedule for each APAR
            $latestSchedules = InspectionSchedule::select('apar_id')
                ->selectRaw('MAX(start_at) as latest_start_at')
                ->where('is_active', true)
                ->where('frequency', '!=', 'once')
                ->groupBy('apar_id')
                ->get();

            $generatedCount = 0;
            $now = Carbon::now('UTC');

            foreach ($latestSchedules as $item) {
                $latestSchedule = InspectionSchedule::where('apar_id', $item->apar_id)
                    ->where('start_at', $item->latest_start_at)
                    ->first();

                if (!$latestSchedule) {
                    continue;
                }

                // Only generate next schedule if the latest one has started or is about to start
                // This prevents generating infinite schedules into the future
                // Skip this check if --force flag is used (for testing)
                if (!$this->option('force') && $latestSchedule->startAtUtc()->greaterThan($now->copy()->addDays(7))) {
                    $this->warn("Skipping APAR {$latestSchedule->apar_id}: Schedule is more than 7 days in the future. Use --force to override.");
                    continue;
                }

                // Check if a future schedule already exists (redundancy check)
                $futureScheduleExists = InspectionSchedule::where('apar_id', $latestSchedule->apar_id)
                    ->where('start_at', '>', $latestSchedule->start_at)
                    ->exists();

                if ($futureScheduleExists) {
                    continue;
                }

                // Calculate next date
                $nextStartAt = $this->calculateNextDate($latestSchedule->startAtUtc(), $latestSchedule->frequency);
                $nextEndAt = $this->calculateNextDate($latestSchedule->endAtUtc(), $latestSchedule->frequency);

                if (!$nextStartAt) {
                    continue;
                }

                // Adjust to working day if falls on weekend (Saturday or Sunday)
                $nextStartAt = $this->adjustToWorkingDay($nextStartAt);
                $nextEndAt = $this->adjustToWorkingDay($nextEndAt);

                // Create new schedule
                $this->info("Generating next schedule for APAR {$latestSchedule->apar_id} ({$latestSchedule->frequency})");
                
                // Prepare data for service
                // We need to convert back to local time components as expected by createSchedule
                $nextStartAtLocal = $nextStartAt->copy()->setTimezone(config('app.timezone', 'UTC'));
                $nextEndAtLocal = $nextEndAt->copy()->setTimezone(config('app.timezone', 'UTC'));

                $data = [
                    'apar_id' => $latestSchedule->apar_id,
                    'assigned_user_id' => $latestSchedule->assigned_user_id,
                    'scheduled_date' => $nextStartAtLocal->toDateString(),
                    'start_time' => $nextStartAtLocal->format('H:i'),
                    'end_time' => $nextEndAtLocal->format('H:i'),
                    'frequency' => $latestSchedule->frequency,
                    'is_active' => true,
                    'notes' => $latestSchedule->notes, // Copy notes from previous schedule
                ];

                $scheduleService->createSchedule($data);
                $generatedCount++;
            }

            $this->info("Successfully generated {$generatedCount} new schedules.");
            Log::info("Recurring schedule generation completed. Generated {$generatedCount} schedules.");

        } catch (\Exception $e) {
            $this->error('Error generating recurring schedules: ' . $e->getMessage());
            Log::error('Error generating recurring schedules: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }

    /**
     * Calculate next date based on frequency
     * 
     * Frequency intervals:
     * - weekly: 7 days
     * - monthly: 30 days (1 month)
     * - quarterly: 90 days (3 months)
     * - semiannual: 180 days (6 months)
     */
    private function calculateNextDate(Carbon $date, string $frequency): ?Carbon
    {
        $nextDate = $date->copy();

        switch ($frequency) {
            case 'weekly':
                return $nextDate->addDays(7);
            case 'monthly':
                return $nextDate->addDays(30);
            case 'quarterly':
                return $nextDate->addDays(90);
            case 'semiannual':
                return $nextDate->addDays(180);
            default:
                return null;
        }
    }

    /**
     * Adjust date to working day (Monday-Friday)
     * If date falls on weekend (Saturday or Sunday), move to previous Friday
     * 
     * @param Carbon $date The date to adjust
     * @return Carbon The adjusted date (Friday if weekend, unchanged if weekday)
     */
    private function adjustToWorkingDay(Carbon $date): Carbon
    {
        $adjustedDate = $date->copy();
        $dayOfWeek = $adjustedDate->dayOfWeek; // 0 = Sunday, 6 = Saturday

        // If Saturday (6), subtract 1 day to get Friday
        if ($dayOfWeek === Carbon::SATURDAY) {
            $adjustedDate->subDay();
            Log::info("Adjusted schedule from Saturday to Friday: {$date->toDateString()} -> {$adjustedDate->toDateString()}");
        }
        // If Sunday (0), subtract 2 days to get Friday
        elseif ($dayOfWeek === Carbon::SUNDAY) {
            $adjustedDate->subDays(2);
            Log::info("Adjusted schedule from Sunday to Friday: {$date->toDateString()} -> {$adjustedDate->toDateString()}");
        }

        return $adjustedDate;
    }
}
