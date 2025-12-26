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
            // 1. Temporarily change to VARCHAR to allow new values
            \DB::statement("ALTER TABLE apars MODIFY COLUMN status VARCHAR(255) NOT NULL DEFAULT 'active'");
        }

        // 2. Map old values to new values
        \DB::table('apars')->where('status', 'damaged')->update(['status' => 'needs_repair']);
        \DB::table('apars')->where('status', 'refill')->update(['status' => 'under_repair']);
        \DB::table('apars')->where('status', 'expired')->update(['status' => 'inactive']);

        if ($driver === 'mysql') {
            // 3. Apply new ENUM definition
            \DB::statement("ALTER TABLE apars MODIFY COLUMN status ENUM('active', 'inactive', 'needs_repair', 'under_repair') NOT NULL DEFAULT 'active'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = \DB::connection()->getDriverName();
        if ($driver === 'mysql') {
             \DB::statement("ALTER TABLE apars MODIFY COLUMN status ENUM('active', 'refill', 'expired', 'damaged') NOT NULL DEFAULT 'active'");
        }

        \DB::table('apars')->where('status', 'needs_repair')->update(['status' => 'damaged']);
        \DB::table('apars')->where('status', 'under_repair')->update(['status' => 'refill']);
        \DB::table('apars')->where('status', 'inactive')->update(['status' => 'expired']);
    }
};
