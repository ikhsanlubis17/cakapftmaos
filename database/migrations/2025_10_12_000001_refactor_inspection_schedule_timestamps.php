<?php

use Carbon\Carbon;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('inspection_schedules')) {
            return;
        }

        Schema::table('inspection_schedules', function (Blueprint $table) {
            if (!Schema::hasColumn('inspection_schedules', 'start_at')) {
                $table->dateTimeTz('start_at')->nullable()->after('assigned_user_id');
            }

            if (!Schema::hasColumn('inspection_schedules', 'end_at')) {
                $table->dateTimeTz('end_at')->nullable()->after('start_at');
            }
        });

        if (Schema::hasColumn('inspection_schedules', 'scheduled_date')) {
            $appTimezone = config('app.timezone', 'UTC');

            DB::table('inspection_schedules')
                ->select('id', 'scheduled_date', 'scheduled_time', 'start_time', 'end_time')
                ->orderBy('id')
                ->chunkById(100, function ($schedules) use ($appTimezone) {
                    foreach ($schedules as $schedule) {
                        if (empty($schedule->scheduled_date)) {
                            continue;
                        }

                        $startSource = $schedule->start_time ?? $schedule->scheduled_time ?? '00:00:00';
                        $endSource = $schedule->end_time ?? $startSource;

                        $startAtLocal = Carbon::parse($schedule->scheduled_date . ' ' . $startSource, $appTimezone);
                        $endAtLocal = Carbon::parse($schedule->scheduled_date . ' ' . $endSource, $appTimezone);

                        if ($endAtLocal->lessThanOrEqualTo($startAtLocal)) {
                            $endAtLocal = $startAtLocal->copy()->addHour();
                        }

                        DB::table('inspection_schedules')
                            ->where('id', $schedule->id)
                            ->update([
                                'start_at' => $startAtLocal->clone()->setTimezone('UTC'),
                                'end_at' => $endAtLocal->clone()->setTimezone('UTC'),
                            ]);
                    }
                });
        }

        $connection = Schema::getConnection()->getDriverName();

        if (Schema::hasColumn('inspection_schedules', 'start_at') && Schema::hasColumn('inspection_schedules', 'end_at')) {
            if ($connection === 'pgsql') {
                DB::statement('ALTER TABLE inspection_schedules ALTER COLUMN start_at SET NOT NULL');
                DB::statement('ALTER TABLE inspection_schedules ALTER COLUMN end_at SET NOT NULL');
            } elseif ($connection === 'mysql') {
                DB::statement('ALTER TABLE inspection_schedules MODIFY start_at DATETIME NOT NULL');
                DB::statement('ALTER TABLE inspection_schedules MODIFY end_at DATETIME NOT NULL');
            }
        }

        $columnsToDrop = collect(['scheduled_date', 'scheduled_time', 'start_time', 'end_time'])
            ->filter(fn (string $column) => Schema::hasColumn('inspection_schedules', $column))
            ->values();

        if ($columnsToDrop->isNotEmpty()) {
            Schema::table('inspection_schedules', function (Blueprint $table) use ($columnsToDrop) {
                $table->dropColumn($columnsToDrop->toArray());
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('inspection_schedules')) {
            return;
        }

        Schema::table('inspection_schedules', function (Blueprint $table) {
            if (!Schema::hasColumn('inspection_schedules', 'scheduled_date')) {
                $table->date('scheduled_date')->nullable()->after('assigned_user_id');
            }

            if (!Schema::hasColumn('inspection_schedules', 'scheduled_time')) {
                $table->time('scheduled_time')->nullable()->after('scheduled_date');
            }

            if (!Schema::hasColumn('inspection_schedules', 'start_time')) {
                $table->time('start_time')->nullable()->after('scheduled_time');
            }

            if (!Schema::hasColumn('inspection_schedules', 'end_time')) {
                $table->time('end_time')->nullable()->after('start_time');
            }
        });

        if (Schema::hasColumn('inspection_schedules', 'start_at')) {
            $appTimezone = config('app.timezone', 'UTC');

            DB::table('inspection_schedules')
                ->select('id', 'start_at', 'end_at')
                ->orderBy('id')
                ->chunkById(100, function ($schedules) use ($appTimezone) {
                    foreach ($schedules as $schedule) {
                        if (empty($schedule->start_at)) {
                            continue;
                        }

                        $startAtLocal = Carbon::parse($schedule->start_at)->setTimezone($appTimezone);
                        $endAtLocal = Carbon::parse($schedule->end_at ?? $schedule->start_at)->setTimezone($appTimezone);

                        DB::table('inspection_schedules')
                            ->where('id', $schedule->id)
                            ->update([
                                'scheduled_date' => $startAtLocal->toDateString(),
                                'scheduled_time' => $startAtLocal->format('H:i:s'),
                                'start_time' => $startAtLocal->format('H:i:s'),
                                'end_time' => $endAtLocal->format('H:i:s'),
                            ]);
                    }
                });
        }

        $columnsToDrop = collect(['start_at', 'end_at'])
            ->filter(fn (string $column) => Schema::hasColumn('inspection_schedules', $column))
            ->values();

        if ($columnsToDrop->isNotEmpty()) {
            Schema::table('inspection_schedules', function (Blueprint $table) use ($columnsToDrop) {
                $table->dropColumn($columnsToDrop->toArray());
            });
        }
    }
};
