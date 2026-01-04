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
        Schema::table('inspections', function (Blueprint $table) {
            // Add inspection_status for supervisor review of teknisi inspections
            // Default is 'approved' for backward compatibility with existing data
            $table->enum('inspection_status', ['pending_review', 'approved', 'rejected'])
                ->default('approved')
                ->after('status');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->after('inspection_status');
            $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
            $table->text('review_notes')->nullable()->after('reviewed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inspections', function (Blueprint $table) {
            $table->dropForeign(['reviewed_by']);
            $table->dropColumn(['inspection_status', 'reviewed_by', 'reviewed_at', 'review_notes']);
        });
    }
};
