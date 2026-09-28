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
     * Adds checker review workflow fields to inspections table.
     * This enables the two-tier review: Checker reviews first, then Supervisor.
     * Also tracks original vs corrected data when checker makes edits.
     */
    public function up(): void
    {
        // First, update the inspection_status enum to include checker review states
        DB::statement("ALTER TABLE inspections MODIFY COLUMN inspection_status ENUM('pending_checker_review', 'pending_supervisor_review', 'approved', 'rejected') DEFAULT 'approved'");

        Schema::table('inspections', function (Blueprint $table) {
            // Checker review fields
            $table->foreignId('checked_by')->nullable()->after('reviewed_at')->constrained('users')->nullOnDelete();
            $table->timestamp('checked_at')->nullable()->after('checked_by');
            $table->text('checker_notes')->nullable()->after('checked_at');
            
            // Checker's corrected values (if they edited the report)
            $table->enum('checker_condition', ['good', 'damaged'])->nullable()->after('checker_notes');
            $table->json('checker_damages')->nullable()->after('checker_condition'); // JSON array of corrected damage entries
            
            // Original values snapshot (stored when checker submits review)
            $table->enum('original_condition', ['good', 'damaged'])->nullable()->after('checker_damages');
            $table->json('original_damages')->nullable()->after('original_condition'); // JSON snapshot of original damage entries
            
            // Flag to indicate if checker made any edits
            $table->boolean('is_checker_edited')->default(false)->after('original_damages');

            // Index for checker queries
            $table->index(['checked_by']);
            $table->index(['inspection_status', 'checked_by']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inspections', function (Blueprint $table) {
            $table->dropForeign(['checked_by']);
            $table->dropIndex(['checked_by']);
            $table->dropIndex(['inspection_status', 'checked_by']);
            $table->dropColumn([
                'checked_by',
                'checked_at',
                'checker_notes',
                'checker_condition',
                'checker_damages',
                'original_condition',
                'original_damages',
                'is_checker_edited',
            ]);
        });

        // Revert inspection_status enum - map new values back to old ones first
        DB::table('inspections')
            ->where('inspection_status', 'pending_checker_review')
            ->update(['inspection_status' => 'pending_review']);
        DB::table('inspections')
            ->where('inspection_status', 'pending_supervisor_review')
            ->update(['inspection_status' => 'pending_review']);

        DB::statement("ALTER TABLE inspections MODIFY COLUMN inspection_status ENUM('pending_review', 'approved', 'rejected') DEFAULT 'approved'");
    }
};
