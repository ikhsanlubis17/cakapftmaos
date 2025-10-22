<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inspection_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('apar_id')->constrained()->onDelete('cascade');
            $table->foreignId('assigned_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->dateTimeTz('start_at');
            $table->dateTimeTz('end_at');
            $table->enum('frequency', ['weekly', 'monthly', 'quarterly', 'semiannual'])->default('weekly');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_completed')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();

            // indexes
            $table->index(['apar_id', 'start_at']);
            $table->index(['start_at', 'is_active']);
            $table->index(['is_completed']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inspection_schedules');
    }
};
