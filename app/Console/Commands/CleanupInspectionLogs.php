<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\InspectionLog;
use Carbon\Carbon;

class CleanupInspectionLogs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'inspections:cleanup-logs {--days=365 : Number of days to keep logs}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up old inspection logs';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $days = $this->option('days');
        $cutoffDate = Carbon::now()->subDays($days);

        $this->info("Cleaning up inspection logs older than {$days} days...");

        $deletedCount = InspectionLog::where('created_at', '<', $cutoffDate)->delete();

        $this->info("Successfully deleted {$deletedCount} old inspection logs.");

        // Get remaining log count
        $remainingCount = InspectionLog::count();
        $this->info("Remaining inspection logs: {$remainingCount}");
    }
} 