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
        Schema::table('damage_categories', function (Blueprint $table) {
            // Add type column - will be set to first APAR type after adding
            $table->string('type')->nullable()->after('name')->index();
        });

        // Set default type to first active APAR type for existing records
        $firstAparType = \App\Models\AparType::active()->first();
        if ($firstAparType) {
            \DB::table('damage_categories')
                ->whereNull('type')
                ->update(['type' => $firstAparType->name]);
        }

        // Make type column non-nullable after setting defaults
        Schema::table('damage_categories', function (Blueprint $table) {
            $table->string('type')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('damage_categories', function (Blueprint $table) {
            $table->dropColumn('type');
        });
    }
};
