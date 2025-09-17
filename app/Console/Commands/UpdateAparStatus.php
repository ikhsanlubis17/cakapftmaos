<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Apar;
use Carbon\Carbon;

class UpdateAparStatus extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'apar:update-status';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update APAR status based on expiration date';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting APAR status update process...');

        $today = Carbon::today();
        $thirtyDaysFromNow = Carbon::today()->addDays(30);

        // Update expired APARs
        $expiredCount = Apar::where('expired_at', '<', $today)
            ->where('status', '!=', 'expired')
            ->update(['status' => 'expired']);

        $this->info("Updated {$expiredCount} APARs to expired status.");

        // Update APARs that will expire soon (within 30 days)
        $expiringSoonCount = Apar::whereBetween('expired_at', [$today, $thirtyDaysFromNow])
            ->where('status', 'active')
            ->update(['status' => 'needs_refill']);

        $this->info("Updated {$expiringSoonCount} APARs to needs_refill status.");

        // Get statistics
        $totalApars = Apar::count();
        $activeApars = Apar::where('status', 'active')->count();
        $expiredApars = Apar::where('status', 'expired')->count();
        $needsRefillApars = Apar::where('status', 'needs_refill')->count();

        $this->info("\nAPAR Status Summary:");
        $this->info("Total APARs: {$totalApars}");
        $this->info("Active: {$activeApars}");
        $this->info("Needs Refill: {$needsRefillApars}");
        $this->info("Expired: {$expiredApars}");

        $this->info('APAR status update completed successfully.');
    }
} 