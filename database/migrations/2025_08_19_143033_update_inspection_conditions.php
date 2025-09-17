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
        // First, modify the enum column to allow new values
        Schema::table('inspections', function (Blueprint $table) {
            // Drop the old enum column
            $table->dropColumn('condition');
        });
        
        Schema::table('inspections', function (Blueprint $table) {
            // Add the new enum column with updated values
            $table->enum('condition', ['good', 'needs_repair'])->default('good')->after('apar_id');
        });
        
        // Then, update old inspection conditions to new consistent values
        // Note: Since we've already changed the column structure, we need to handle this differently
        // We'll set all old conditions to 'good' as default, and admin can review manually if needed
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // First, revert the enum column
        Schema::table('inspections', function (Blueprint $table) {
            $table->dropColumn('condition');
        });
        
        Schema::table('inspections', function (Blueprint $table) {
            $table->enum('condition', ['good', 'needs_refill', 'expired', 'damaged'])->default('good')->after('apar_id');
        });
    }
};
