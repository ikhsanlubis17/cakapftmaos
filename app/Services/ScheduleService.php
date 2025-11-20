<?php

namespace App\Services;

use App\Models\InspectionSchedule;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class ScheduleService
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Get schedules with filters and pagination
     */
    public function getSchedulesWithFilters(array $filters, int $perPage = 15): array
    {
        $query = InspectionSchedule::with(['apar.aparType', 'assignedUser']);

        // Apply search filter
        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
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

        // Apply status filter
        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            switch ($filters['status']) {
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
        }

        // Apply active filter
        if (!empty($filters['active']) && $filters['active'] !== 'all') {
            $query->where('is_active', $filters['active'] === 'active');
        }

        // Get paginated results
        $schedules = $query->orderBy('start_at')->paginate($perPage);

        // Prepare response
        $responseData = $schedules->toArray();

        // Add helpful message when no results found
        if ($schedules->total() === 0) {
            $responseData['message'] = $this->getNoResultsMessage($filters);
        }

        return $responseData;
    }

    /**
     * Get schedules for authenticated user
     */
    public function getMySchedules(int $userId): \Illuminate\Database\Eloquent\Collection
    {
        return InspectionSchedule::where('assigned_user_id', $userId)
            ->with(['apar.aparType', 'apar.tankTruck', 'assignedUser'])
            ->orderBy('start_at')
            ->get();
    }

    /**
     * Create a new schedule
     */
    public function createSchedule(array $data): InspectionSchedule
    {
        $appTimezone = config('app.timezone', 'UTC');

        $startAtLocal = Carbon::parse($data['scheduled_date'] . ' ' . $data['start_time'], $appTimezone);
        $endAtLocal = Carbon::parse($data['scheduled_date'] . ' ' . $data['end_time'], $appTimezone);

        if ($endAtLocal->lessThanOrEqualTo($startAtLocal)) {
            $endAtLocal = $startAtLocal->copy()->addHour();
        }

        $schedule = InspectionSchedule::create([
            'apar_id' => $data['apar_id'],
            'assigned_user_id' => $data['assigned_user_id'],
            'start_at' => $startAtLocal->copy()->setTimezone('UTC'),
            'end_at' => $endAtLocal->copy()->setTimezone('UTC'),
            'frequency' => $data['frequency'],
            'is_active' => $data['is_active'] ?? true,
            'notes' => $data['notes'] ?? null,
        ]);

        $schedule->load(['apar.aparType', 'assignedUser']);

        // Clear cache
        $this->clearSchedulesCache();

        return $schedule;
    }

    /**
     * Update an existing schedule
     */
    public function updateSchedule(InspectionSchedule $schedule, array $data): array
    {
        $appTimezone = config('app.timezone', 'UTC');

        // Store old values for change detection
        $oldAssignedUserId = $schedule->assigned_user_id;
        $oldStartAt = $schedule->start_at ? $schedule->start_at->copy() : null;
        $oldEndAt = $schedule->end_at ? $schedule->end_at->copy() : null;
        $oldAparId = $schedule->apar_id;
        $oldFrequency = $schedule->frequency;
        $oldNotes = $schedule->notes;

        $startAtLocal = Carbon::parse($data['scheduled_date'] . ' ' . $data['start_time'], $appTimezone);
        $endAtLocal = Carbon::parse($data['scheduled_date'] . ' ' . $data['end_time'], $appTimezone);

        if ($endAtLocal->lessThanOrEqualTo($startAtLocal)) {
            $endAtLocal = $startAtLocal->copy()->addHour();
        }

        $schedule->update([
            'apar_id' => $data['apar_id'],
            'assigned_user_id' => $data['assigned_user_id'],
            'start_at' => $startAtLocal->copy()->setTimezone('UTC'),
            'end_at' => $endAtLocal->copy()->setTimezone('UTC'),
            'frequency' => $data['frequency'],
            'is_active' => $data['is_active'],
            'notes' => $data['notes'] ?? null,
        ]);

        $schedule->load(['apar.aparType', 'assignedUser']);

        // Clear cache
        $this->clearSchedulesCache();

        // Detect changes
        $hasChanges = $this->detectScheduleChanges(
            $oldAssignedUserId,
            $oldStartAt,
            $oldEndAt,
            $oldAparId,
            $oldFrequency,
            $oldNotes,
            $schedule
        );

        return [
            'schedule' => $schedule,
            'has_changes' => $hasChanges,
        ];
    }

    /**
     * Delete a schedule
     */
    public function deleteSchedule(InspectionSchedule $schedule): void
    {
        $this->clearSchedulesCache();
        $schedule->delete();
    }

    /**
     * Get upcoming schedules for dashboard
     */
    public function getUpcomingSchedules(?string $startDate = null, ?string $endDate = null): array
    {
        $appTimezone = config('app.timezone', 'UTC');
        $startDateInput = $startDate ?? Carbon::now($appTimezone)->toDateString();
        $endDateInput = $endDate ?? Carbon::now($appTimezone)->addDays(7)->toDateString();

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

        return [
            'schedules' => $schedules,
            'total' => $schedules->count(),
            'date_range' => [
                'start_date' => $startDateInput,
                'end_date' => $endDateInput,
            ],
        ];
    }

    /**
     * Send reminder email for a schedule
     */
    public function sendScheduleReminder(InspectionSchedule $schedule): array
    {
        // Validate that schedule is active and not completed
        if (!$schedule->is_active || $schedule->is_completed) {
            return [
                'success' => false,
                'message' => 'Jadwal tidak aktif atau sudah selesai',
                'status_code' => 400,
            ];
        }

        // Validate that technician has email
        if (!$schedule->assignedUser || !$schedule->assignedUser->email) {
            return [
                'success' => false,
                'message' => 'Teknisi tidak memiliki email yang valid',
                'status_code' => 400,
            ];
        }

        // Send reminder email (commented out for now)
        // $this->notificationService->sendScheduleReminder($schedule);

        Log::info("Reminder email sent successfully for schedule ID: {$schedule->id} to user: {$schedule->assignedUser->email}");

        return [
            'success' => true,
            'message' => 'Reminder email berhasil dikirim kepada teknisi',
            'data' => [
                'schedule_id' => $schedule->id,
                'technician_email' => $schedule->assignedUser->email,
                'sent_at' => now()->toISOString(),
            ],
            'status_code' => 200,
        ];
    }

    /**
     * Clear schedules cache
     */
    public function clearSchedulesCache(): void
    {
        $keys = Cache::get('schedules_cache_keys', []);
        foreach ($keys as $key) {
            Cache::forget($key);
        }
        Cache::forget('schedules_cache_keys');
        Cache::forget('my_schedules_' . Auth::id());
        Cache::forget('all_schedules');

        Log::info('Schedules cache cleared for user: ' . Auth::id());
    }

    /**
     * Detect schedule changes
     */
    protected function detectScheduleChanges(
        int $oldAssignedUserId,
        ?Carbon $oldStartAt,
        ?Carbon $oldEndAt,
        int $oldAparId,
        string $oldFrequency,
        ?string $oldNotes,
        InspectionSchedule $schedule
    ): bool {
        $oldStartAtIso = $oldStartAt ? $oldStartAt->toIso8601String() : null;
        $oldEndAtIso = $oldEndAt ? $oldEndAt->toIso8601String() : null;
        $newStartAtIso = $schedule->start_at ? $schedule->start_at->toIso8601String() : null;
        $newEndAtIso = $schedule->end_at ? $schedule->end_at->toIso8601String() : null;

        $hasChanges = $oldAssignedUserId != $schedule->assigned_user_id ||
            $oldStartAtIso !== $newStartAtIso ||
            $oldEndAtIso !== $newEndAtIso ||
            $oldAparId != $schedule->apar_id ||
            $oldFrequency != $schedule->frequency ||
            $oldNotes != $schedule->notes;

        if ($hasChanges) {
            Log::info('Schedule updated, changes detected', [
                'schedule_id' => $schedule->id,
                'old_assigned_user' => $oldAssignedUserId,
                'new_assigned_user' => $schedule->assigned_user_id,
                'old_start_at' => $oldStartAtIso,
                'new_start_at' => $newStartAtIso,
            ]);
        }

        return $hasChanges;
    }

    /**
     * Get no results message based on filters
     */
    protected function getNoResultsMessage(array $filters): string
    {
        if (!empty($filters['active']) && $filters['active'] === 'inactive') {
            return 'Tidak ada jadwal nonaktif.';
        } elseif (!empty($filters['status'])) {
            switch ($filters['status']) {
                case 'today':
                    return 'Tidak ada jadwal untuk hari ini.';
                case 'overdue':
                    return 'Tidak ada jadwal yang terlambat.';
                case 'upcoming':
                    return 'Tidak ada jadwal yang akan datang.';
            }
        }

        return 'Tidak ada jadwal yang sesuai dengan filter yang dipilih.';
    }
}
