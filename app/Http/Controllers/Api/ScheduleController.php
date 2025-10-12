<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InspectionSchedule;
use App\Models\Apar;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ScheduleController extends Controller
{
    /**
     * Display a listing of inspection schedules.
     */
    public function index(Request $request)
    {
        // Only use cache for read-only operations, not for filtered searches
        $useCache = $request->get('page', 1) == 1 &&
            empty($request->get('search')) &&
            $request->get('status') === 'all' &&
            $request->get('active') === 'all';

        if ($useCache) {
            $cacheKey = 'schedules_' . md5($request->fullUrl());
            $cached = cache()->get($cacheKey);
            if ($cached) {
                return response()->json($cached);
            }
        }

        $query = InspectionSchedule::with(['apar.aparType', 'assignedUser']);

        // Apply search filter with improved logic
        if ($request->has('search') && !empty(trim($request->search))) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->whereHas('apar', function ($aparQuery) use ($search) {
                    $aparQuery->where('serial_number', 'like', "%{$search}%")
                        ->orWhere('location_name', 'like', "%{$search}%");
                })
                    ->orWhereHas('assignedUser', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        $appTimezone = config('app.timezone', 'UTC');
        $nowLocal = Carbon::now($appTimezone);
        $nowUtc = $nowLocal->copy()->setTimezone('UTC');
        $startOfTodayUtc = $nowLocal->copy()->startOfDay()->setTimezone('UTC');
        $endOfTodayUtc = $nowLocal->copy()->endOfDay()->setTimezone('UTC');

        // Apply status filter with improved logic - consistent with frontend
        if ($request->has('status') && $request->status !== 'all') {
            Log::info('Filter debug info', [
                'status' => $request->status,
                'now_local' => $nowLocal->toDateTimeString(),
                'now_utc' => $nowUtc->toDateTimeString(),
                'timezone' => $appTimezone,
            ]);

            switch ($request->status) {
                case 'overdue':
                    $query->where('start_at', '<', $nowUtc);
                    break;

                case 'today':
                    $query->whereBetween('start_at', [$startOfTodayUtc, $endOfTodayUtc]);
                    break;

                case 'upcoming':
                    $query->where('start_at', '>', $nowUtc);
                    break;
            }

            Log::info('Status filter applied', [
                'status' => $request->status,
                'query_sql' => $query->toSql(),
                'query_bindings' => $query->getBindings()
            ]);
        }

        // Apply active filter before pagination to ensure proper filtering
        if ($request->has('active') && $request->active !== 'all') {
            switch ($request->active) {
                case 'active':
                    $query->where('is_active', true);
                    break;
                case 'inactive':
                    $query->where('is_active', false);
                    break;
            }
        }

        // Debug: Log the final query before pagination
        if ($request->has('status') && $request->status !== 'all') {
            Log::info('Final query before pagination', [
                'sql' => $query->toSql(),
                'bindings' => $query->getBindings(),
                'status_filter' => $request->status
            ]);
        }

        // Apply pagination
        $perPage = $request->get('per_page', 15);
        $schedules = $query->orderBy('start_at')
            ->paginate($perPage);

        // Debug: Log pagination results
        Log::info('Pagination results', [
            'total' => $schedules->total(),
            'per_page' => $schedules->perPage(),
            'current_page' => $schedules->currentPage(),
            'data_count' => $schedules->count(),
            'status_filter' => $request->get('status'),
            'active_filter' => $request->get('active')
        ]);

        // Additional validation to ensure filter consistency - PERBAIKAN: Hapus validasi yang tidak perlu untuk 'today'
        if ($request->has('status') && $request->status !== 'all' && $request->status !== 'today') {
            $filteredData = $schedules->getCollection()->filter(function ($schedule) use ($request, $nowUtc) {
                $startAt = $schedule->startAtUtc();

                if (!$startAt) {
                    return false;
                }

                switch ($request->status) {
                    case 'overdue':
                        return $startAt->lessThan($nowUtc);

                    case 'upcoming':
                        return $startAt->greaterThan($nowUtc);

                    default:
                        return true;
                }
            });

            $schedules = new \Illuminate\Pagination\LengthAwarePaginator(
                $filteredData,
                $filteredData->count(),
                $schedules->perPage(),
                $schedules->currentPage(),
                [
                    'path' => $request->url(),
                    'pageName' => 'page',
                ]
            );
        }

        // Log filter results for debugging
        Log::info('Schedule filter applied', [
            'search' => $request->get('search'),
            'status' => $request->get('status'),
            'active' => $request->get('active'),
            'total_results' => $schedules->total(),
            'current_page' => $schedules->currentPage(),
            'per_page' => $schedules->perPage(),
            'filters_applied' => [
                'has_search' => $request->has('search') && !empty(trim($request->search)),
                'has_status_filter' => $request->has('status') && $request->status !== 'all',
                'has_active_filter' => $request->has('active') && $request->active !== 'all'
            ]
        ]);

        // Prepare response data
        $responseData = $schedules->toArray();

        // Add helpful message when no results found
        if ($schedules->total() === 0) {
            $message = 'Tidak ada jadwal yang sesuai dengan filter yang dipilih.';
            if ($request->has('active') && $request->active === 'inactive') {
                $message = 'Tidak ada jadwal nonaktif.';
            } elseif ($request->has('status') && $request->status === 'today') {
                $message = 'Tidak ada jadwal untuk hari ini.';
            } elseif ($request->has('status') && $request->status === 'overdue') {
                $message = 'Tidak ada jadwal yang terlambat.';
            } elseif ($request->has('status') && $request->status === 'upcoming') {
                $message = 'Tidak ada jadwal yang akan datang.';
            }

            // Add message to response data
            $responseData['message'] = $message;
        }

        // Cache the result for 5 minutes (only for first page without filters)
        if ($useCache) {
            $cacheKey = 'schedules_' . md5($request->fullUrl());
            cache()->put($cacheKey, $responseData, 300); // 5 minutes

            // Store cache key for later clearing
            $cacheKeys = cache()->get('schedules_cache_keys', []);
            $cacheKeys[] = $cacheKey;
            cache()->put('schedules_cache_keys', array_unique($cacheKeys), 3600);
        }

        return response()->json($responseData);
    }

    /**
     * Display schedules assigned to the authenticated teknisi.
     */
    public function mySchedules()
    {
        // Clear any existing cache for this user
        cache()->forget('my_schedules_' . Auth::id());

        $schedules = InspectionSchedule::where('assigned_user_id', Auth::id())
            ->with(['apar.aparType', 'apar.tankTruck', 'assignedUser'])
            ->orderBy('start_at')
            ->get();

        // Log for debugging
        Log::info('MySchedules fetched for user: ' . Auth::id() . ', count: ' . $schedules->count());

        return response()->json($schedules);
    }

    /**
     * Display the specified schedule.
     */
    public function show(InspectionSchedule $schedule)
    {
        $schedule->load(['apar.aparType', 'assignedUser']);
        return response()->json($schedule);
    }

    /**
     * Store a newly created schedule.
     */
    public function store(Request $request)
    {
        $request->validate([
            'apar_id' => 'required|exists:apars,id',
            'assigned_user_id' => 'required|exists:users,id',
            'scheduled_date' => 'required|date|after_or_equal:today',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'frequency' => ['required', Rule::in(['weekly', 'monthly', 'quarterly', 'semiannual'])],
            'is_active' => 'boolean',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Validasi tambahan untuk memastikan user adalah teknisi
        $assignedUser = User::find($request->assigned_user_id);
        if (!$assignedUser || $assignedUser->role !== 'teknisi') {
            return response()->json([
                'message' => 'User yang ditugaskan harus berperan sebagai teknisi',
                'errors' => ['assigned_user_id' => ['User yang ditugaskan harus berperan sebagai teknisi']]
            ], 422);
        }

        // Validasi bahwa teknisi memiliki email
        if (!$assignedUser->email) {
            return response()->json([
                'message' => 'Teknisi yang ditugaskan harus memiliki email untuk menerima notifikasi',
                'errors' => ['assigned_user_id' => ['Teknisi harus memiliki email']]
            ], 422);
        }

        $appTimezone = config('app.timezone', 'UTC');

        $startAtLocal = Carbon::parse($request->scheduled_date . ' ' . $request->start_time, $appTimezone);
        $endAtLocal = Carbon::parse($request->scheduled_date . ' ' . $request->end_time, $appTimezone);

        if ($endAtLocal->lessThanOrEqualTo($startAtLocal)) {
            $endAtLocal = $startAtLocal->copy()->addHour();
        }

        $schedule = InspectionSchedule::create([
            'apar_id' => $request->apar_id,
            'assigned_user_id' => $request->assigned_user_id,
            'start_at' => $startAtLocal->copy()->setTimezone('UTC'),
            'end_at' => $endAtLocal->copy()->setTimezone('UTC'),
            'frequency' => $request->frequency,
            'is_active' => $request->is_active ?? true,
            'notes' => $request->notes,
        ]);

        $schedule->load(['apar.aparType', 'assignedUser']);

        // Clear cache
        $this->clearSchedulesCache();

        // Kirim notifikasi ke teknisi yang ditugaskan (sync untuk memastikan terkirim)
        try {
            $notificationService = new NotificationService();
            $notificationService->sendScheduleNotification($schedule, 'created');
            Log::info("Schedule notification sent successfully for schedule ID: {$schedule->id}");
        } catch (\Exception $e) {
            Log::error("Failed to send schedule notification for schedule ID: {$schedule->id}", [
                'error' => $e->getMessage()
            ]);
            // Jangan gagalkan pembuatan schedule jika notifikasi gagal
        }

        return response()->json($schedule, 201);
    }

    /**
     * Update the specified schedule.
     */
    public function update(Request $request, InspectionSchedule $schedule)
    {
        $request->validate([
            'apar_id' => 'required|exists:apars,id',
            'assigned_user_id' => 'required|exists:users,id',
            'scheduled_date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'frequency' => ['required', Rule::in(['weekly', 'monthly', 'quarterly', 'semiannual'])],
            'is_active' => 'boolean',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Validasi tambahan untuk memastikan user adalah teknisi
        $assignedUser = User::find($request->assigned_user_id);
        if (!$assignedUser || $assignedUser->role !== 'teknisi') {
            return response()->json([
                'message' => 'User yang ditugaskan harus berperan sebagai teknisi',
                'errors' => ['assigned_user_id' => ['User yang ditugaskan harus berperan sebagai teknisi']]
            ], 422);
        }

        // Validasi bahwa teknisi memiliki email
        if (!$assignedUser->email) {
            return response()->json([
                'message' => 'Teknisi yang ditugaskan harus memiliki email untuk menerima notifikasi',
                'errors' => ['assigned_user_id' => ['Teknisi harus memiliki email']]
            ], 422);
        }

        $appTimezone = config('app.timezone', 'UTC');

        $oldAssignedUserId = $schedule->assigned_user_id;
        $oldStartAt = $schedule->start_at ? $schedule->start_at->copy() : null;
        $oldEndAt = $schedule->end_at ? $schedule->end_at->copy() : null;
        $oldAparId = $schedule->apar_id;
        $oldFrequency = $schedule->frequency;
        $oldNotes = $schedule->notes;

        $startAtLocal = Carbon::parse($request->scheduled_date . ' ' . $request->start_time, $appTimezone);
        $endAtLocal = Carbon::parse($request->scheduled_date . ' ' . $request->end_time, $appTimezone);

        if ($endAtLocal->lessThanOrEqualTo($startAtLocal)) {
            $endAtLocal = $startAtLocal->copy()->addHour();
        }

        $schedule->update([
            'apar_id' => $request->apar_id,
            'assigned_user_id' => $request->assigned_user_id,
            'start_at' => $startAtLocal->copy()->setTimezone('UTC'),
            'end_at' => $endAtLocal->copy()->setTimezone('UTC'),
            'frequency' => $request->frequency,
            'is_active' => $request->is_active,
            'notes' => $request->notes,
        ]);

        $schedule->load(['apar.aparType', 'assignedUser']);

        // Clear cache
        $this->clearSchedulesCache();

        // Kirim notifikasi jika ada perubahan (sync untuk memastikan terkirim)
        $oldStartAtIso = $oldStartAt ? $oldStartAt->toIso8601String() : null;
        $oldEndAtIso = $oldEndAt ? $oldEndAt->toIso8601String() : null;
        $newStartAtIso = $schedule->start_at ? $schedule->start_at->toIso8601String() : null;
        $newEndAtIso = $schedule->end_at ? $schedule->end_at->toIso8601String() : null;

        $hasChanges = $oldAssignedUserId != $request->assigned_user_id ||
            $oldStartAtIso !== $newStartAtIso ||
            $oldEndAtIso !== $newEndAtIso ||
            $oldAparId != $request->apar_id ||
            $oldFrequency != $request->frequency ||
            $oldNotes != $request->notes;

        if ($hasChanges) {
            Log::info('Schedule updated, sending notification', [
                'schedule_id' => $schedule->id,
                'old_assigned_user' => $oldAssignedUserId,
                'new_assigned_user' => $request->assigned_user_id,
                'old_start_at' => $oldStartAtIso,
                'new_start_at' => $newStartAtIso,
                'old_end_at' => $oldEndAtIso,
                'new_end_at' => $newEndAtIso,
                'old_apar' => $oldAparId,
                'new_apar' => $request->apar_id,
                'old_frequency' => $oldFrequency,
                'new_frequency' => $request->frequency
            ]);

            try {
                $notificationService = new NotificationService();
                $notificationService->sendScheduleNotification($schedule, 'updated');
                Log::info("Schedule update notification sent successfully for schedule ID: {$schedule->id}");
            } catch (\Exception $e) {
                Log::error("Failed to send schedule update notification for schedule ID: {$schedule->id}", [
                    'error' => $e->getMessage()
                ]);
                // Jangan gagalkan update schedule jika notifikasi gagal
            }
        } else {
            Log::info('Schedule updated but no changes detected', [
                'schedule_id' => $schedule->id
            ]);
        }

        return response()->json($schedule);
    }

    /**
     * Remove the specified schedule.
     */
    public function destroy(InspectionSchedule $schedule)
    {
        // Clear cache
        $this->clearSchedulesCache();

        // Kirim notifikasi sebelum menghapus (async)
        dispatch(function () use ($schedule) {
            $notificationService = new NotificationService();
            $notificationService->sendScheduleNotification($schedule, 'deleted');
        })->afterResponse();

        $schedule->delete();
        return response()->json(['message' => 'Jadwal berhasil dihapus']);
    }

    /**
     * Clear schedules cache
     */
    private function clearSchedulesCache()
    {
        // Clear all schedules cache
        $keys = cache()->get('schedules_cache_keys', []);
        foreach ($keys as $key) {
            cache()->forget($key);
        }
        cache()->forget('schedules_cache_keys');

        // Clear specific cache keys
        cache()->forget('my_schedules_' . Auth::id());
        cache()->forget('all_schedules');

        // Log cache clearing for debugging
        Log::info('Schedules cache cleared for user: ' . Auth::id());
    }

    /**
     * Get upcoming inspection schedules for dashboard
     */
    public function upcoming(Request $request)
    {
        try {
            $appTimezone = config('app.timezone', 'UTC');
            $startDateInput = $request->get('start_date', Carbon::now($appTimezone)->toDateString());
            $endDateInput = $request->get('end_date', Carbon::now($appTimezone)->addDays(7)->toDateString());

            $startBoundaryUtc = Carbon::parse($startDateInput, $appTimezone)->startOfDay()->setTimezone('UTC');
            $endBoundaryUtc = Carbon::parse($endDateInput, $appTimezone)->endOfDay()->setTimezone('UTC');
            $nowUtc = Carbon::now('UTC');

            $schedules = InspectionSchedule::with(['apar', 'assignedUser'])
                ->where('is_active', true)
                ->where('is_completed', false)
                ->whereBetween('start_at', [$startBoundaryUtc, $endBoundaryUtc])
                ->where('start_at', '>', $nowUtc)
                ->orderBy('start_at')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'schedules' => $schedules,
                    'total' => $schedules->count(),
                    'date_range' => [
                        'start_date' => $startDateInput,
                        'end_date' => $endDateInput
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching upcoming schedules: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil jadwal inspeksi terdekat',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send reminder email for a specific schedule
     */
    public function sendReminder(InspectionSchedule $schedule)
    {
        try {
            // Validasi role admin
            if (Auth::user()->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki akses untuk mengirim reminder email'
                ], 403);
            }

            // Validasi bahwa schedule masih aktif dan belum selesai
            if (!$schedule->is_active || $schedule->is_completed) {
                return response()->json([
                    'success' => false,
                    'message' => 'Jadwal tidak aktif atau sudah selesai'
                ], 400);
            }

            // Validasi bahwa teknisi memiliki email
            if (!$schedule->assignedUser || !$schedule->assignedUser->email) {
                return response()->json([
                    'success' => false,
                    'message' => 'Teknisi tidak memiliki email yang valid'
                ], 400);
            }

            // Kirim reminder email
            $notificationService = new NotificationService();
            $notificationService->sendScheduleReminder($schedule);

            // Log pengiriman reminder
            Log::info("Reminder email sent successfully for schedule ID: {$schedule->id} to user: {$schedule->assignedUser->email}");

            return response()->json([
                'success' => true,
                'message' => 'Reminder email berhasil dikirim kepada teknisi',
                'data' => [
                    'schedule_id' => $schedule->id,
                    'technician_email' => $schedule->assignedUser->email,
                    'sent_at' => now()->toISOString()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to send reminder email for schedule ID: {$schedule->id}", [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengirim reminder email: ' . $e->getMessage()
            ], 500);
        }
    }
}
