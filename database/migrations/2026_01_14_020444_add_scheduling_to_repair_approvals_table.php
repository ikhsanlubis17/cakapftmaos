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
        Schema::table('repair_approvals', function (Blueprint $table) {
            $table->timestamp('scheduled_at')->nullable()->after('approved_at');
            $table->foreignId('assigned_technician_id')->nullable()->constrained('users')->nullOnDelete()->after('scheduled_at');
            $table->text('schedule_notes')->nullable()->after('assigned_technician_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('repair_approvals', function (Blueprint $table) {
            $table->dropForeign(['assigned_technician_id']);
            $table->dropColumn(['scheduled_at', 'assigned_technician_id', 'schedule_notes']);
        });
    }
};
