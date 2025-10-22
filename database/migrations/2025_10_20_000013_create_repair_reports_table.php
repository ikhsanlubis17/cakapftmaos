<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('repair_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('repair_approval_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('inspection_id')->nullable()->constrained()->onDelete('set null');
            $table->text('report_notes')->nullable();
            $table->json('report_photos')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('repair_reports');
    }
};
