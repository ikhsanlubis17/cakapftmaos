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
        Schema::table('repair_reports', function (Blueprint $table) {
            $table->enum('status', ['pending_review', 'approved', 'needs_rework', 'rejected'])
                ->default('pending_review')
                ->after('repair_completed_at');
            $table->text('supervisor_notes')->nullable()->after('status');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->after('supervisor_notes');
            $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('repair_reports', function (Blueprint $table) {
            $table->dropForeign(['reviewed_by']);
            $table->dropColumn(['status', 'supervisor_notes', 'reviewed_by', 'reviewed_at']);
        });
    }
};
