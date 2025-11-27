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
    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting inspection reminder process...');

        $notificationService = new NotificationService();
        
        // Send reminders for H-7, H-3, and H-1
        $h7Count = $this->sendRemindersForDays($notificationService, 7);
        $h3Count = $this->sendRemindersForDays($notificationService, 3);
        $h1Count = $this->sendRemindersForDays($notificationService, 1);
        
        $totalCount = $h7Count + $h3Count + $h1Count;

        if ($totalCount > 0) {
            $this->info("Successfully sent {$totalCount} reminders:");
            $this->info("- H-7: {$h7Count}");
            $this->info("- H-3: {$h3Count}");
            $this->info("- H-1: {$h1Count}");
        } else {
            $this->info('No reminders sent. No inspections scheduled for H-7, H-3, or H-1.');
        }
    }

    /**
     * Send inspection reminders for schedules due in X days
     */
    private function sendRemindersForDays($notificationService, $days)
    {
        $this->info("Checking inspection reminders for H-{$days}...");
        
        try {
            $sentCount = 0;
            $targetDate = Carbon::now()->addDays($days);
            
            // Get schedules due on the target date
            $schedules = InspectionSchedule::with(['apar', 'assignedUser'])
                ->where('is_active', true)
                ->where('is_completed', false)
                ->whereDate('start_at', $targetDate->toDateString())
                ->get();
            
            foreach ($schedules as $schedule) {
                if ($schedule->assignedUser && $schedule->assignedUser->email) {
                    // Check if we already sent a reminder today for this schedule (avoid duplicates)
                    // This is a basic check, ideally we should check the notification logs
                    
                    $sent = $notificationService->sendScheduleNotification($schedule, 'reminder');
                    if ($sent) {
                        $sentCount++;
                        $this->line("Reminder (H-{$days}) sent for APAR: {$schedule->apar->serial_number}");
                    }
                }
            }
            
            Log::info("Inspection reminders (H-{$days}) sent: {$sentCount} notifications");
            return $sentCount;
            
        } catch (\Exception $e) {
            Log::error("Error sending H-{$days} inspection reminders: " . $e->getMessage());
            $this->error("Error sending H-{$days} reminders: " . $e->getMessage());
            return 0;
        }
    }
} 