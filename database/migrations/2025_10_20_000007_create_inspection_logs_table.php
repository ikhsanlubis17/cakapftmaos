<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inspection_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('apar_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('inspection_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('action'); // 'scan_qr', 'start_inspection', 'submit_inspection', 'validation_failed'
            $table->decimal('lat', 10, 8)->nullable();
            $table->decimal('lng', 11, 8)->nullable();
            $table->string('ip_address');
            $table->text('user_agent');
            $table->json('device_info')->nullable(); // Browser, OS, device type
            $table->text('details')->nullable(); // Additional details about the action
            $table->boolean('is_successful')->default(true);
            $table->timestamps();

            // indexes
            $table->index(['apar_id', 'created_at']);
            $table->index(['user_id', 'created_at']);
            $table->index(['action']);
            $table->index(['is_successful']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inspection_logs');
    }
};
