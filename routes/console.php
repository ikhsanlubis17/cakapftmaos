<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ===== LARAVEL 12 SCHEDULER IMPLEMENTATION =====

// Send inspection reminders daily at 7:00 AM
Schedule::command('inspections:send-reminders')
    ->dailyAt('07:00')
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/inspection-reminders.log'));

// Update APAR status daily at 6:00 AM
Schedule::command('apar:update-status')
    ->dailyAt('06:00')
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/apar-status.log'));

// Clean up old inspection logs monthly
Schedule::command('inspections:cleanup-logs')
    ->monthly()
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/cleanup.log'));

// Test scheduler (remove this in production)
// Schedule::call(function () {
//     \Log::info('Auto Reminder Test: ' . now());
// })->everyMinute();
