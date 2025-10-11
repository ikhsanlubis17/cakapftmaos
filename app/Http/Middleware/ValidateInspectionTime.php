<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\InspectionSchedule;
use Carbon\Carbon;

class ValidateInspectionTime
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        // Only apply to inspection submission
        if ($request->route()->getName() !== 'inspections.store') {
            return $next($request);
        }

        $aparId = $request->input('apar_id');
        
        // Check if there's a scheduled inspection for this APAR
        $schedule = InspectionSchedule::where('apar_id', $aparId)
            ->where('is_active', true)
            ->where('is_completed', false)
            ->orderBy('start_at')
            ->first();

        if ($schedule) {
            $nowUtc = Carbon::now('UTC');
            $startAtUtc = $schedule->startAtUtc();
            $endAtUtc = $schedule->endAtUtc();

            if (!$startAtUtc || !$endAtUtc) {
                return response()->json([
                    'message' => 'Jadwal inspeksi belum memiliki waktu mulai atau selesai yang valid',
                ], 422);
            }

            $windowStart = $startAtUtc->copy()->subHours(2);
            $windowEnd = $endAtUtc->copy()->addHours(2);

            if ($nowUtc->lt($windowStart) || $nowUtc->gt($windowEnd)) {
                $appTimezone = config('app.timezone', 'UTC');
                $startLocal = $schedule->startAtLocal()?->format('H:i:s');
                $endLocal = $schedule->endAtLocal()?->format('H:i:s');

                return response()->json([
                    'message' => 'Inspeksi hanya dapat dilakukan pada waktu yang telah dijadwalkan',
                    'scheduled_time' => $startLocal,
                    'current_time' => Carbon::now($appTimezone)->format('H:i:s'),
                    'valid_window' => ($startLocal ?? '-') . ' - ' . ($endLocal ?? '-')
                ], 422);
            }
        }

        return $next($request);
    }
} 