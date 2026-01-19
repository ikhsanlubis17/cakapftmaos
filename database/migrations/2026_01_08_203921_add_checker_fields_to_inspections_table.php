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
        Schema::table('inspections', function (Blueprint $table) {
            $table->foreignId('checker_id')->nullable()->constrained('users')->after('inspection_status');
            $table->timestamp('checker_reviewed_at')->nullable()->after('checker_id');
            $table->text('checker_notes')->nullable()->after('checker_reviewed_at');
        });

        // Expand enum to include new status values
        if (DB::getDriverName() !== 'sqlite') {
             DB::statement("ALTER TABLE inspections MODIFY COLUMN inspection_status ENUM('pending_review', 'approved', 'rejected', 'pending_checker', 'approved_by_checker', 'rejected_by_checker') NOT NULL DEFAULT 'approved'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inspections', function (Blueprint $table) {
            $table->dropForeign(['checker_id']);
            $table->dropColumn(['checker_id', 'checker_reviewed_at', 'checker_notes']);
        });

        // Revert enum (WARNING: this might fail if there are values using the new options)
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE inspections MODIFY COLUMN inspection_status ENUM('pending_review', 'approved', 'rejected') NOT NULL DEFAULT 'approved'");
        }
    }
};
