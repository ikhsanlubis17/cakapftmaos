<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = \DB::connection()->getDriverName();
        
        if ($driver === 'mysql') {
            // Update ENUM to include not_fixable status
            \DB::statement("ALTER TABLE apars MODIFY COLUMN status ENUM('active', 'inactive', 'needs_repair', 'under_repair', 'not_fixable') NOT NULL DEFAULT 'active'");
        }
        // For SQLite (testing), enum is treated as string, no change needed
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = \DB::connection()->getDriverName();
        
        if ($driver === 'mysql') {
            // Revert to previous ENUM values
            // First update any not_fixable to inactive
            \DB::table('apars')->where('status', 'not_fixable')->update(['status' => 'inactive']);
            
            \DB::statement("ALTER TABLE apars MODIFY COLUMN status ENUM('active', 'inactive', 'needs_repair', 'under_repair') NOT NULL DEFAULT 'active'");
        }
    }
};
