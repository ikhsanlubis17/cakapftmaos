<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds assigned_checker_id to inspection_schedules table.
     * When admin creates a schedule, they must also assign a checker
     * who will review the technician's inspection report.
     */
    public function up(): void
    {
        Schema::table('inspection_schedules', function (Blueprint $table) {
            $table->foreignId('assigned_checker_id')
                ->nullable()
                ->after('assigned_user_id')
                ->constrained('users')
                ->nullOnDelete();

            // Index for checker queries
            $table->index(['assigned_checker_id', 'start_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inspection_schedules', function (Blueprint $table) {
            $table->dropForeign(['assigned_checker_id']);
            $table->dropIndex(['assigned_checker_id', 'start_at']);
            $table->dropColumn('assigned_checker_id');
        });
    }
};
