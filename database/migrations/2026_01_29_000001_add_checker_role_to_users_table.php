<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds 'checker' role to the users table role enum.
     * Checker is responsible for verifying technician inspection reports
     * before they go to supervisor review.
     */
    public function up(): void
    {
        // For MySQL, we need to modify the enum to include 'checker'
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'teknisi', 'supervisor', 'checker') DEFAULT 'teknisi'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // First update any checker users to teknisi before removing the enum value
        DB::table('users')->where('role', 'checker')->update(['role' => 'teknisi']);
        
        // Revert to original enum
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'teknisi', 'supervisor') DEFAULT 'teknisi'");
    }
};
