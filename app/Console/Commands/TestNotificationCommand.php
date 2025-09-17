<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\NotificationService;
use App\Models\User;
use App\Models\InspectionSchedule;
use Illuminate\Support\Facades\Mail;

class TestNotificationCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:notification {email?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test sending notification email to Ikhsanul Arifin';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🧪 Testing Notification System...');
        
        // Get Ikhsanul Arifin user
        $teknisi = User::where('email', 'lubis163774@gmail.com')->first();
        
        if (!$teknisi) {
            $this->error('❌ User Ikhsanul Arifin not found!');
            $this->error('Please run: php artisan db:seed --class=UserSeeder');
            return 1;
        }
        
        $this->info("✅ Found user: {$teknisi->name} ({$teknisi->email})");
        
        // Check if there are schedules
        $schedules = InspectionSchedule::where('assigned_user_id', $teknisi->id)
            ->where('is_active', true)
            ->get();
            
        if ($schedules->isEmpty()) {
            $this->error('❌ No active schedules found for Ikhsanul Arifin!');
            $this->error('Please run: php artisan db:seed --class=TestScheduleSeeder');
            return 1;
        }
        
        $this->info("✅ Found {$schedules->count()} active schedules");
        
        // Test basic email sending
        $this->info('📧 Testing basic email sending...');
        try {
            Mail::raw('Test email dari sistem CAKAP FT MAOS', function($message) use ($teknisi) {
                $message->to($teknisi->email)
                        ->subject('Test Email - CAKAP FT MAOS');
            });
            $this->info('✅ Basic email sent successfully!');
        } catch (\Exception $e) {
            $this->error('❌ Failed to send basic email: ' . $e->getMessage());
            $this->error('Please check your email configuration in .env file');
            return 1;
        }
        
        // Test notification service
        $this->info('🔔 Testing notification service...');
        try {
            $notificationService = new NotificationService();
            
            // Test sending to today's schedules
            $todayCount = $notificationService->sendBulkInspectionReminders();
            $this->info("✅ Sent {$todayCount} notifications for today's schedules");
            
            // Test sending to all active schedules
            $allCount = $notificationService->sendBulkInspectionRemindersAll();
            $this->info("✅ Sent {$allCount} notifications for all active schedules");
            
        } catch (\Exception $e) {
            $this->error('❌ Failed to send notifications: ' . $e->getMessage());
            return 1;
        }
        
        $this->info('🎉 All tests completed successfully!');
        $this->info("📧 Check email: {$teknisi->email}");
        
        return 0;
    }
}
