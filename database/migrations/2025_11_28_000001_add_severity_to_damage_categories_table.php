<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('damage_categories', function (Blueprint $table) {
            $table->enum('severity', ['low', 'medium', 'high'])->default('medium')->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('damage_categories', function (Blueprint $table) {
            $table->dropColumn('severity');
        });
    }
};
