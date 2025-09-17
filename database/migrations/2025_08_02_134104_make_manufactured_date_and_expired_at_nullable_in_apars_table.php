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
            $table->date('manufactured_date')->nullable()->change();
            $table->date('expired_at')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('apars', function (Blueprint $table) {
            $table->date('manufactured_date')->nullable(false)->change();
            $table->date('expired_at')->nullable(false)->change();
        });
    }
};
