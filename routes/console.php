<?php

use Illuminate\Support\Facades\Schedule;

// ===== LARAVEL 12 SCHEDULER IMPLEMENTATION =====

// Send inspection reminders daily at 7:00 AM
Schedule::command('inspections:send-reminders')
    ->dailyAt('07:00')
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/inspection-reminders.log'));

// Send APAR expiry early warnings daily at 07:30 AM
Schedule::command('apar:send-expiry-alerts')
    ->dailyAt('07:30')
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/apar-expiry-alerts.log'));

// Generate recurring schedules daily at 01:00 AM
Schedule::command('inspections:generate-recurring')
    ->dailyAt('01:00')
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/recurring-schedules.log'));

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

// Eskalasi SLA approval perbaikan — setiap jam
// Kirim reminder ke supervisor jika ada repair_approval yang belum ditindaklanjuti melebihi SLA
Schedule::command('inspection:escalate-approvals')
    ->hourly()
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/sla-escalation.log'));
