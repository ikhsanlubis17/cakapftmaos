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
            ->where('scheduled_date', today())
            ->where('is_completed', false)
            ->first();

        if ($schedule) {
            $now = Carbon::now();
            $scheduledTime = Carbon::parse($schedule->scheduled_time);
            
            // Allow inspection within 2 hours before and after scheduled time
            $startTime = $scheduledTime->subHours(2);
            $endTime = $scheduledTime->addHours(4); // 2 hours before + 2 hours after
            
            if ($now->lt($startTime) || $now->gt($endTime)) {
                return response()->json([
                    'message' => 'Inspeksi hanya dapat dilakukan pada waktu yang telah dijadwalkan',
                    'scheduled_time' => $schedule->scheduled_time,
                    'current_time' => $now->format('H:i:s'),
                    'valid_window' => $startTime->format('H:i:s') . ' - ' . $endTime->format('H:i:s')
                ], 422);
            }
        }

        return $next($request);
    }
} 