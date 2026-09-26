<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditLogService;
use App\Models\InspectionLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    protected AuditLogService $auditLogService;

    public function __construct(AuditLogService $auditLogService)
    {
        $this->auditLogService = $auditLogService;
    }

    /**
     * Display a listing of audit logs
     */
    public function index(Request $request)
    {
        $filters = [
            'user_id' => $request->get('user_id'),
            'user_name' => $request->get('user_name'),
            'apar_id' => $request->get('apar_id'),
            'apar_serial' => $request->get('apar_serial'),
            'action' => $request->get('action'),
            'ip_address' => $request->get('ip_address'),
            'is_successful' => $request->get('is_successful'),
            'start_date' => $request->get('start_date'),
            'end_date' => $request->get('end_date'),
        ];

        $logs = $this->auditLogService->getAuditLogs($filters);

        return response()->json([
            'data' => $logs,
            'total' => $logs->count(),
        ]);
    }

    /**
     * Display the specified audit log
     */
    public function show(InspectionLog $auditLog)
    {
        $auditLog->load(['apar', 'user', 'inspection']);

        // Parse device info if available
        $deviceInfo = $this->auditLogService->parseDeviceInfo(
            $auditLog->user_agent,
            $auditLog->device_info
        );

        $auditLog->parsed_device_info = $deviceInfo;
        $auditLog->action_label = $this->auditLogService->getActionLabel($auditLog->action);

        return response()->json($auditLog);
    }

    /**
     * Get audit log statistics
     */
    public function stats(Request $request)
    {
        $filters = [
            'start_date' => $request->get('start_date'),
            'end_date' => $request->get('end_date'),
        ];

        $stats = $this->auditLogService->getAuditLogStats($filters);

        return response()->json($stats);
    }

    /**
     * Export audit logs
     */
    public function export(Request $request)
    {
        $filters = [
            'user_id' => $request->get('user_id'),
            'user_name' => $request->get('user_name'),
            'apar_id' => $request->get('apar_id'),
            'apar_serial' => $request->get('apar_serial'),
            'action' => $request->get('action'),
            'ip_address' => $request->get('ip_address'),
            'is_successful' => $request->get('is_successful'),
            'start_date' => $request->get('start_date'),
            'end_date' => $request->get('end_date'),
        ];

        $exportData = $this->auditLogService->exportAuditLogs($filters);

        return response()->json([
            'data' => $exportData,
            'total' => count($exportData),
        ]);
    }

    /**
     * Clean up old audit logs
     */
    public function cleanup(Request $request)
    {
        // Support both 'days_to_keep' and 'days' parameter names
        $days = $request->input('days_to_keep', $request->input('days'));
        $request->merge(['days_to_keep' => $days]);

        $request->validate([
            'days_to_keep' => 'required|integer|min:30|max:365',
        ]);

        $result = $this->auditLogService->cleanupOldLogs((int) $request->input('days_to_keep'));

        return response()->json([
            'message' => "Successfully deleted {$result['deleted_count']} old audit logs",
            'deleted_count' => $result['deleted_count'],
            'cutoff_date' => $result['cutoff_date'],
        ]);
    }

    /**
     * Get cleanup statistics
     */
    public function cleanupStats()
    {
        $stats = $this->auditLogService->getCleanupStats();

        return response()->json($stats);
    }
}