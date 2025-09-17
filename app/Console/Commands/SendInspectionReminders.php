<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\NotificationService;
use App\Models\InspectionSchedule;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class SendInspectionReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'inspections:send-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send inspection reminders for APARs based on frequency and timing rules';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting inspection reminder process...');

        $notificationService = new NotificationService();
        
        // Send reminders based on frequency
        $dailyCount = $this->sendDailyReminders($notificationService);
        $weeklyCount = $this->sendWeeklyReminders($notificationService);
        $monthlyCount = $this->sendMonthlyReminders($notificationService);
        
        $totalCount = $dailyCount + $weeklyCount + $monthlyCount;

        if ($totalCount > 0) {
            $this->info("Successfully sent {$totalCount} reminders:");
            $this->info("- Daily: {$dailyCount}");
            $this->info("- Weekly: {$weeklyCount}");
            $this->info("- Monthly: {$monthlyCount}");
        } else {
            $this->info('No reminders sent. No inspections scheduled or no teknisi assigned.');
        }
    }

    /**
     * Send daily inspection reminders (H-1)
     */
    private function sendDailyReminders($notificationService)
    {
        $this->info('Checking daily inspection reminders...');
        
        try {
            $sentCount = 0;
            $tomorrow = Carbon::tomorrow();
            
            // Ambil jadwal harian untuk besok
            $dailySchedules = InspectionSchedule::with(['apar', 'assignedUser'])
                ->where('is_active', true)
                ->where('frequency', 'daily')
                ->where('scheduled_date', $tomorrow->toDateString())
                ->get();
            
            foreach ($dailySchedules as $schedule) {
                if ($schedule->assignedUser && $schedule->assignedUser->email) {
                    $sent = $notificationService->sendScheduleNotification($schedule, 'reminder');
                    if ($sent) {
                        $sentCount++;
                        $this->line("Daily reminder sent for APAR: {$schedule->apar->serial_number}");
                    }
                }
            }
            
            Log::info("Daily inspection reminders sent: {$sentCount} notifications");
            return $sentCount;
            
        } catch (\Exception $e) {
            Log::error('Error sending daily inspection reminders: ' . $e->getMessage());
            $this->error('Error sending daily reminders: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Send weekly inspection reminders (H-3)
     */
    private function sendWeeklyReminders($notificationService)
    {
        $this->info('Checking weekly inspection reminders...');
        
        try {
            $sentCount = 0;
            $threeDaysLater = Carbon::now()->addDays(3);
            
            // Ambil jadwal mingguan untuk 3 hari ke depan
            $weeklySchedules = InspectionSchedule::with(['apar', 'assignedUser'])
                ->where('is_active', true)
                ->where('frequency', 'weekly')
                ->where('scheduled_date', $threeDaysLater->toDateString())
                ->get();
            
            foreach ($weeklySchedules as $schedule) {
                if ($schedule->assignedUser && $schedule->assignedUser->email) {
                    $sent = $notificationService->sendScheduleNotification($schedule, 'reminder');
                    if ($sent) {
                        $sentCount++;
                        $this->line("Weekly reminder sent for APAR: {$schedule->apar->serial_number}");
                    }
                }
            }
            
            Log::info("Weekly inspection reminders sent: {$sentCount} notifications");
            return $sentCount;
            
        } catch (\Exception $e) {
            Log::error('Error sending weekly inspection reminders: ' . $e->getMessage());
            $this->error('Error sending weekly reminders: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Send monthly inspection reminders (H-7)
     */
    private function sendMonthlyReminders($notificationService)
    {
        $this->info('Checking monthly inspection reminders...');
        
        try {
            $sentCount = 0;
            $sevenDaysLater = Carbon::now()->addDays(7);
            
            // Ambil jadwal bulanan untuk 7 hari ke depan
            $monthlySchedules = InspectionSchedule::with(['apar', 'assignedUser'])
                ->where('is_active', true)
                ->where('frequency', 'monthly')
                ->where('scheduled_date', $sevenDaysLater->toDateString())
                ->get();
            
            foreach ($monthlySchedules as $schedule) {
                if ($schedule->assignedUser && $schedule->assignedUser->email) {
                    $sent = $notificationService->sendScheduleNotification($schedule, 'reminder');
                    if ($sent) {
                        $sentCount++;
                        $this->line("Monthly reminder sent for APAR: {$schedule->apar->serial_number}");
                    }
                }
            }
            
            Log::info("Monthly inspection reminders sent: {$sentCount} notifications");
            return $sentCount;
            
        } catch (\Exception $e) {
            Log::error('Error sending monthly inspection reminders: ' . $e->getMessage());
            $this->error('Error sending monthly reminders: ' . $e->getMessage());
            return 0;
        }
    }
} 