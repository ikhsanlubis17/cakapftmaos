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
        DB::statement("UPDATE `inspections` SET `condition` = 'damaged' WHERE `condition` = 'needs_repair'");

        // First, modify the enum column to allow new values
        DB::statement(<<<SQL
            ALTER TABLE `inspections`
            MODIFY COLUMN `condition`
            ENUM('good', 'needs_refill', 'expired', 'damaged')
            NOT NULL DEFAULT 'good'
        SQL);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement(<<<SQL
            UPDATE `inspections`
            SET `condition` = CASE
                WHEN `condition` IN ('needs_refill', 'expired', 'damaged') THEN 'needs_repair'
                ELSE `condition`
            END
        SQL);

        DB::statement(<<<SQL
            ALTER TABLE `inspections`
            MODIFY COLUMN `condition`
            ENUM('good', 'needs_repair')
            NOT NULL DEFAULT 'good'
        SQL);
    }
};
