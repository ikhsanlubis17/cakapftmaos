<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreScheduleRequest;
use App\Http\Requests\UpdateScheduleRequest;
use App\Services\ScheduleService;
use App\Models\InspectionSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ScheduleController extends Controller
{
    protected ScheduleService $scheduleService;

    public function __construct(ScheduleService $scheduleService)
    {
        $this->scheduleService = $scheduleService;
    }

    /**
     * Display a listing of inspection schedules.
     */
    public function index(Request $request)
    {
        // Prepare filters
        $filters = [
            'search' => $request->get('search'),
            'status' => $request->get('status', 'all'),
            'active' => $request->get('active', 'all'),
        ];

        $perPage = $request->get('per_page', 15);

        // Get schedules from service
        $responseData = $this->scheduleService->getSchedulesWithFilters($filters, $perPage);

        return response()->json($responseData);
    }

    /**
     * Display schedules assigned to the authenticated teknisi.
     */
    public function mySchedules()
    {
        $schedules = $this->scheduleService->getMySchedules(Auth::id());
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
    public function store(StoreScheduleRequest $request)
    {
        $schedule = $this->scheduleService->createSchedule($request->validated());

        return response()->json($schedule, 201);
    }

    /**
     * Update the specified schedule.
     */
    public function update(UpdateScheduleRequest $request, InspectionSchedule $schedule)
    {
        $result = $this->scheduleService->updateSchedule($schedule, $request->validated());

        return response()->json($result['schedule']);
    }

    /**
     * Remove the specified schedule.
     */
    public function destroy(InspectionSchedule $schedule)
    {
        $this->scheduleService->deleteSchedule($schedule);

        return response()->json(['message' => 'Jadwal berhasil dihapus']);
    }

    /**
     * Get upcoming inspection schedules for dashboard
     */
    public function upcoming(Request $request)
    {
        try {
            $result = $this->scheduleService->getUpcomingSchedules(
                $request->get('start_date'),
                $request->get('end_date')
            );

            return response()->json([
                'success' => true,
                'data' => $result
            ]);
        } catch (\Exception $e) {
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
        // Validate role admin
        if (Auth::user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk mengirim reminder email'
            ], 403);
        }

        $result = $this->scheduleService->sendScheduleReminder($schedule);

        return response()->json([
            'success' => $result['success'],
            'message' => $result['message'],
            'data' => $result['data'] ?? null,
        ], $result['status_code']);
    }
}
