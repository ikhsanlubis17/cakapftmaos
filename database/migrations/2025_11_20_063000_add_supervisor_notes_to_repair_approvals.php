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
        Schema::table('repair_approvals', function (Blueprint $table) {
            // Add new supervisor notes field (text type for long content)
            $table->text('supervisor_notes')->nullable()->after('admin_notes');
            
            // Add rejection reason field (text type for detailed reasons)
            $table->text('rejection_reason')->nullable()->after('supervisor_notes');
            
            // Add decision timestamp
            $table->timestamp('decision_made_at')->nullable()->after('approved_at');
        });

        // Migrate existing admin_notes to supervisor_notes
        DB::statement('UPDATE repair_approvals SET supervisor_notes = admin_notes WHERE admin_notes IS NOT NULL');
        
        // Note: admin_notes column is kept for backward compatibility but is now deprecated
        // It should be removed in a future migration after confirming all systems use supervisor_notes
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('repair_approvals', function (Blueprint $table) {
            $table->dropColumn(['supervisor_notes', 'rejection_reason', 'decision_made_at']);
        });
    }
};
