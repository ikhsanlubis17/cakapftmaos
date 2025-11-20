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
        // First, modify the status enum to include 'needs_reinspection'
        DB::statement("ALTER TABLE inspections MODIFY COLUMN status ENUM('pending', 'completed', 'failed', 'needs_reinspection') DEFAULT 'pending'");
        
        Schema::table('inspections', function (Blueprint $table) {
            // Add re-inspection tracking fields
            $table->integer('reinspection_count')->default(0)->after('status');
            
            // Add parent inspection link for tracking re-inspection chain
            $table->foreignId('parent_inspection_id')
                ->nullable()
                ->after('reinspection_count')
                ->constrained('inspections')
                ->onDelete('set null');
            
            // Add reason for re-inspection (from supervisor notes)
            $table->text('reinspection_reason')->nullable()->after('parent_inspection_id');
            
            // Add index for performance
            $table->index('parent_inspection_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inspections', function (Blueprint $table) {
            $table->dropForeign(['parent_inspection_id']);
            $table->dropColumn(['reinspection_count', 'parent_inspection_id', 'reinspection_reason']);
        });
        
        // Revert status enum to original values
        DB::statement("ALTER TABLE inspections MODIFY COLUMN status ENUM('pending', 'completed', 'failed') DEFAULT 'pending'");
    }
};
