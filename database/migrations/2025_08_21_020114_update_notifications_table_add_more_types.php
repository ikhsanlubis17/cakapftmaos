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
        Schema::table('notifications', function (Blueprint $table) {
            // Drop the existing enum column
            $table->dropColumn('type');
        });

        Schema::table('notifications', function (Blueprint $table) {
            // Recreate the enum column with additional types
            $table->enum('type', [
                'email', 
                'whatsapp', 
                'system',
                'schedule_reminder',
                'schedule_created',
                'schedule_updated',
                'repair_approved',
                'repair_rejected',
                'repair_completed_admin',
                'inspection_reminder'
            ])->default('system')->after('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            // Drop the updated enum column
            $table->dropColumn('type');
        });

        Schema::table('notifications', function (Blueprint $table) {
            // Restore the original enum column
            $table->enum('type', ['email', 'whatsapp', 'system'])->default('system')->after('user_id');
        });
    }
};
