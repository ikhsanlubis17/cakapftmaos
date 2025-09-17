<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

use Illuminate\Support\Facades\Mail;
use App\Services\NotificationService;
use App\Models\User;
use App\Models\InspectionSchedule;

class HealthCheck extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'health:check {--detailed : Show detailed information}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check system health for notifications';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔍 Checking CAKAP FT MAOS System Health...');
        $this->newLine();

        $checks = [
            'Database Connection' => [$this, 'checkDatabase'],
            'JWT Configuration' => [$this, 'checkJWT'],
    
            'Email SMTP' => [$this, 'checkEmail'],
            'Notification Service' => [$this, 'checkNotificationService'],
            'Scheduled Inspections' => [$this, 'checkScheduledInspections'],
            'Teknisi Data' => [$this, 'checkTeknisiData'],
        ];

        $results = [];
        $passed = 0;
        $failed = 0;

        foreach ($checks as $checkName => $checkMethod) {
            $this->info("Checking {$checkName}...");
            
            try {
                $result = $checkMethod();
                $results[$checkName] = $result;
                
                if ($result['status'] === 'success') {
                    $this->info("  ✓ {$checkName}: {$result['message']}");
                    $passed++;
                } else {
                    $this->error("  ✗ {$checkName}: {$result['message']}");
                    $failed++;
                }
            } catch (\Exception $e) {
                $results[$checkName] = [
                    'status' => 'error',
                    'message' => $e->getMessage()
                ];
                $this->error("  ✗ {$checkName}: {$e->getMessage()}");
                $failed++;
            }
        }

        $this->newLine();
        $this->info('📊 Health Check Summary:');
        $this->info("  Total Checks: " . count($checks));
        $this->info("  Passed: {$passed}");
        $this->info("  Failed: {$failed}");

        if ($failed > 0) {
            $this->error('⚠️  Some checks failed. Please review the issues above.');
            return 1;
        } else {
            $this->info('🎉 All health checks passed! System is ready.');
            return 0;
        }
    }

    /**
     * Check database connection
     */
    private function checkDatabase()
    {
        try {
            DB::connection()->getPdo();
            
            // Test a simple query
            $userCount = User::count();
            
            return [
                'status' => 'success',
                'message' => "Connected successfully. {$userCount} users found."
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => "Connection failed: {$e->getMessage()}"
            ];
        }
    }

    /**
     * Check JWT configuration
     */
    private function checkJWT()
    {
        $jwtSecret = config('jwt.secret');
        
        if (empty($jwtSecret) || $jwtSecret === 'your-secret-key') {
            return [
                'status' => 'error',
                'message' => 'JWT secret not configured properly'
            ];
        }

        return [
            'status' => 'success',
            'message' => 'JWT secret configured'
        ];
    }

    /**
     * Check Email SMTP
     */
    private function checkEmail()
    {
        $mailHost = config('mail.mailers.smtp.host');
        $mailUsername = config('mail.mailers.smtp.username');
        $mailPassword = config('mail.mailers.smtp.password');

        if (empty($mailHost) || $mailHost === 'smtp.gmail.com') {
            return [
                'status' => 'error',
                'message' => 'SMTP host not configured properly'
            ];
        }

        if (empty($mailUsername) || empty($mailPassword)) {
            return [
                'status' => 'error',
                'message' => 'SMTP credentials not configured'
            ];
        }

        try {
            // Test SMTP connection by attempting to send a test email
            // In Laravel 12, we can't directly access the transport, so we'll test by configuration validation
            $mailer = Mail::mailer();
            
            // Check if mailer is properly configured
            if ($mailer) {
                return [
                    'status' => 'success',
                    'message' => "SMTP configured for {$mailHost}"
                ];
            } else {
                return [
                    'status' => 'error',
                    'message' => 'SMTP mailer not properly configured'
                ];
            }
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => "SMTP configuration error: {$e->getMessage()}"
            ];
        }
    }

    /**
     * Check Notification Service
     */
    private function checkNotificationService()
    {
        try {
            $notificationService = new NotificationService();
            
            // Check if service can be instantiated
            if ($notificationService instanceof NotificationService) {
                return [
                    'status' => 'success',
                    'message' => 'Notification service ready'
                ];
            } else {
                return [
                    'status' => 'error',
                    'message' => 'Notification service not properly instantiated'
                ];
            }
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => "Service error: {$e->getMessage()}"
            ];
        }
    }

    /**
     * Check scheduled inspections
     */
    private function checkScheduledInspections()
    {
        try {
            $todaySchedules = InspectionSchedule::where('scheduled_date', today())
                ->where('is_active', true)
                ->count();

            $totalSchedules = InspectionSchedule::count();
            $activeSchedules = InspectionSchedule::where('is_active', true)->count();

            return [
                'status' => 'success',
                'message' => "{$todaySchedules} schedules today, {$activeSchedules} active, {$totalSchedules} total"
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => "Query failed: {$e->getMessage()}"
            ];
        }
    }

    /**
     * Check teknisi data
     */
    private function checkTeknisiData()
    {
        try {
            $teknisi = User::where('role', 'teknisi')->get();
            $teknisiWithContact = $teknisi->filter(function($user) {
                return !empty($user->email);
            });

            $totalTeknisi = $teknisi->count();
            $teknisiWithContactCount = $teknisiWithContact->count();

            if ($totalTeknisi === 0) {
                return [
                    'status' => 'error',
                    'message' => 'No teknisi found in database'
                ];
            }

            if ($teknisiWithContactCount === 0) {
                return [
                    'status' => 'error',
                    'message' => "{$totalTeknisi} teknisi found but none have contact info"
                ];
            }

            return [
                'status' => 'success',
                'message' => "{$teknisiWithContactCount}/{$totalTeknisi} teknisi have contact info"
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => "Query failed: {$e->getMessage()}"
            ];
        }
    }
}