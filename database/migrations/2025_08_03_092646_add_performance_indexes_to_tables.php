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
        // Add indexes to apars table
        Schema::table('apars', function (Blueprint $table) {
            $table->index(['status', 'location_type']);
            $table->index(['expired_at']);
            $table->index(['tank_truck_id']);
            $table->index(['serial_number']);
        });

        // Add indexes to inspections table
        Schema::table('inspections', function (Blueprint $table) {
            $table->index(['apar_id', 'created_at']);
            $table->index(['user_id', 'created_at']);
            $table->index(['condition']);
            $table->index(['created_at']);
        });

        // Add indexes to inspection_logs table
        Schema::table('inspection_logs', function (Blueprint $table) {
            $table->index(['apar_id', 'created_at']);
            $table->index(['user_id', 'created_at']);
            $table->index(['action']);
            $table->index(['is_successful']);
        });

        // Add indexes to inspection_schedules table
        Schema::table('inspection_schedules', function (Blueprint $table) {
            $table->index(['apar_id', 'start_at']);
            $table->index(['start_at', 'is_active']);
            $table->index(['is_completed']);
        });

        // Add indexes to users table
        Schema::table('users', function (Blueprint $table) {
            $table->index(['role']);
            $table->index(['email']);
        });

        // Add indexes to tank_trucks table
        Schema::table('tank_trucks', function (Blueprint $table) {
            $table->index(['status']);
            $table->index(['plate_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove indexes from apars table
        Schema::table('apars', function (Blueprint $table) {
            $table->dropIndex(['status', 'location_type']);
            $table->dropIndex(['expired_at']);
            $table->dropIndex(['tank_truck_id']);
            $table->dropIndex(['serial_number']);
        });

        // Remove indexes from inspections table
        Schema::table('inspections', function (Blueprint $table) {
            $table->dropIndex(['apar_id', 'created_at']);
            $table->dropIndex(['user_id', 'created_at']);
            $table->dropIndex(['condition']);
            $table->dropIndex(['created_at']);
        });

        // Remove indexes from inspection_logs table
        Schema::table('inspection_logs', function (Blueprint $table) {
            $table->dropIndex(['apar_id', 'created_at']);
            $table->dropIndex(['user_id', 'created_at']);
            $table->dropIndex(['action']);
            $table->dropIndex(['is_successful']);
        });

        // Remove indexes from inspection_schedules table
        Schema::table('inspection_schedules', function (Blueprint $table) {
            $table->dropIndex(['apar_id', 'start_at']);
            $table->dropIndex(['start_at', 'is_active']);
            $table->dropIndex(['is_completed']);
        });

        // Remove indexes from users table
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role']);
            $table->dropIndex(['email']);
        });

        // Remove indexes from tank_trucks table
        Schema::table('tank_trucks', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['plate_number']);
        });
    }
};
