<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, update any existing 'operator' users to 'teknisi'
        DB::table('users')->where('role', 'operator')->update(['role' => 'teknisi']);
        
        // Then update the enum to remove 'operator'
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'teknisi', 'supervisor') DEFAULT 'teknisi'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Add 'operator' back to the enum
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'teknisi', 'supervisor', 'operator') DEFAULT 'teknisi'");
    }
};
