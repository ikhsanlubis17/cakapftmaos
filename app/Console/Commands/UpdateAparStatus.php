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

        // Update expired APARs to inactive (only if they're currently active)
        // Don't change status if APAR is already needs_repair or under_repair
        $expiredCount = Apar::where('expired_at', '<', $today)
            ->where('status', 'active')
            ->update(['status' => 'inactive']);

        $this->info("Updated {$expiredCount} expired APARs to inactive status.");

        // Note: We don't automatically set needs_repair for expiring soon APARs
        // This should be handled through inspection process, not automatic status update
        // Expiration warnings can be shown in UI without changing status

        // Get statistics
        $totalApars = Apar::count();
        $activeApars = Apar::where('status', 'active')->count();
        $inactiveApars = Apar::where('status', 'inactive')->count();
        $needsRepairApars = Apar::where('status', 'needs_repair')->count();
        $underRepairApars = Apar::where('status', 'under_repair')->count();

        $this->info("\nAPAR Status Summary:");
        $this->info("Total APARs: {$totalApars}");
        $this->info("Active: {$activeApars}");
        $this->info("Inactive: {$inactiveApars}");
        $this->info("Needs Repair: {$needsRepairApars}");
        $this->info("Under Repair: {$underRepairApars}");

        $this->info('APAR status update completed successfully.');
    }
} 