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
        Schema::table('users', function (Blueprint $table) {
            $table->softDeletes()->after('updated_at');
        });

        Schema::table('apars', function (Blueprint $table) {
            $table->softDeletes()->after('updated_at');
        });

        Schema::table('tank_trucks', function (Blueprint $table) {
            $table->softDeletes()->after('updated_at');
        });

        Schema::table('apar_types', function (Blueprint $table) {
            $table->softDeletes()->after('updated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('apar_types', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('tank_trucks', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('apars', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
