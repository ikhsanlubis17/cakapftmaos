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
        Schema::table('apars', function (Blueprint $table) {
            $table->dropColumn('type');
            $table->foreignId('apar_type_id')
                ->nullable()
                ->constrained('apar_types')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('apars', function (Blueprint $table) {
            $table->enum('type', ['powder', 'co2', 'foam', 'liquid'])->default('powder');
            $table->dropForeign(['apar_type_id']);
            $table->dropColumn('apar_type_id');
        });
    }
};
