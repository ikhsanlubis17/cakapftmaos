<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\NotificationService;
use App\Models\Setting;

class SendAparExpiryAlertCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'apar:send-expiry-alerts {--days= : Custom threshold in days before expiration}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send email digest alert to supervisors and admins for APARs nearing expiration date';

    /**
     * Execute the console command.
     */
    public function handle(NotificationService $notificationService): int
    {
        $this->info('Memulai pengecekan masa kedaluwarsa APAR...');

        $days = $this->option('days') ? (int) $this->option('days') : null;
        $configuredDays = $days ?? (int) Setting::get('notify_apar_expiry_days', 30);

        $this->line("Batas ambang peringatan: {$configuredDays} hari ke depan.");

        $sentCount = $notificationService->sendAparExpiryAlerts($configuredDays);

        if ($sentCount > 0) {
            $this->info("Berhasil mengirimkan peringatan kedaluwarsa ke {$sentCount} penerima.");
        } else {
            $this->info("Tidak ada APAR yang mendekati masa kedaluwarsa atau notifikasi dinonaktifkan.");
        }

        return Command::SUCCESS;
    }
}
