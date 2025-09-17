<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Apar;
use App\Models\Inspection;
use App\Models\InspectionLog;
use App\Models\InspectionSchedule;
use App\Models\User;
use App\Exports\InspectionReportExport;
use App\Exports\SummaryReportExport;
use App\Exports\OverdueReportExport;
use App\Exports\AuditLogExport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

class ReportController extends Controller
{
    /**
     * Get reports list
     */
    public function index(Request $request)
    {
        $range = $request->get('range', 'week');
        
        // Get recent reports from storage
        $reports = $this->getRecentReports();
        
        return response()->json($reports);
    }

    /**
     * Generate report
     */
    public function generate(Request $request, $type = null, $format = null)
    {
        $type = $type ?? $request->get('type');
        $period = $request->get('period', 'week');
        $format = $format ?? $request->get('format', 'pdf');
        
        // Validate format
        if (!in_array($format, ['pdf', 'excel'])) {
            return response()->json(['message' => 'Format tidak valid. Gunakan pdf atau excel.'], 400);
        }
        
        $startDate = $this->getStartDate($period);
        $endDate = now();

        try {
            switch ($type) {
                case 'inspection':
                    return $this->generateInspectionReport($startDate, $endDate, $format);
                case 'summary':
                    return $this->generateSummaryReport($startDate, $endDate, $format);
                case 'overdue':
                    return $this->generateOverdueReport($format);
                case 'audit':
                    return $this->generateAuditReport($startDate, $endDate, $format);
                default:
                    return response()->json(['message' => 'Tipe laporan tidak valid. Gunakan: inspection, summary, overdue, atau audit.'], 400);
            }
        } catch (\Exception $e) {
            Log::error('Error generating report: ' . $e->getMessage());
            return response()->json(['message' => 'Gagal generate laporan: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Generate inspection report
     */
    private function generateInspectionReport($startDate, $endDate, $format)
    {
        $inspections = Inspection::with(['apar.aparType', 'user'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->orderBy('created_at', 'desc')
            ->get();

        // Process photo URLs for report
        $inspections->each(function ($inspection) {
            if ($inspection->photo_url) {
                // Ensure photo URL is accessible
                $inspection->photo_url = $this->processPhotoUrl($inspection->photo_url);
            }
        });

        $data = [
            'title' => 'Laporan Inspeksi APAR',
            'period' => $startDate->format('d/m/Y') . ' - ' . $endDate->format('d/m/Y'),
            'total_inspections' => $inspections->count(),
            'inspections' => $inspections,
            'generated_at' => now()->format('d/m/Y H:i:s'),
        ];

        $filename = "laporan-inspeksi-{$startDate->format('Y-m-d')}-{$endDate->format('Y-m-d')}";

        if ($format === 'excel') {
            return Excel::download(new InspectionReportExport($data), $filename . '.xlsx');
        } else {
            $pdf = PDF::loadView('reports.inspection', $data);
            $pdf->setPaper('A4', 'portrait');
            return $pdf->download($filename . '.pdf');
        }
    }

    /**
     * Process photo URL for report
     */
    private function processPhotoUrl($photoUrl)
    {
        // If it's already a full URL, return as is
        if (filter_var($photoUrl, FILTER_VALIDATE_URL)) {
            return $photoUrl;
        }
        
        // If it's a relative path, make it absolute
        if (strpos($photoUrl, '/') === 0) {
            return url($photoUrl);
        }
        
        // If it's stored in storage, get the public URL
        if (Storage::exists($photoUrl)) {
            return Storage::url($photoUrl);
        }
        
        return $photoUrl;
    }

    /**
     * Generate summary report
     */
    private function generateSummaryReport($startDate, $endDate, $format)
    {
        try {
            $stats = [
                'total_apar' => Apar::count(),
                'active_apar' => Apar::where('status', 'active')->count(),
                'needs_refill' => Apar::where('status', 'refill')->count(),
                'expired' => Apar::where('status', 'expired')->count(),
                'damaged' => Apar::where('status', 'damaged')->count(),
                'inspections_this_period' => Inspection::whereBetween('created_at', [$startDate, $endDate])->count(),
                'location_types' => [
                    'statis' => Apar::where('location_type', 'statis')->count(),
                    'mobile' => Apar::where('location_type', 'mobile')->count(),
                ],
                'apar_types' => $this->getAparTypesStats(),
            ];

            $data = [
                'title' => 'Laporan Ringkasan APAR',
                'period' => $startDate->format('d/m/Y') . ' - ' . $endDate->format('d/m/Y'),
                'stats' => $stats,
                'generated_at' => now()->format('d/m/Y H:i:s'),
            ];

            $filename = "laporan-ringkasan-{$startDate->format('Y-m-d')}-{$endDate->format('Y-m-d')}";

            if ($format === 'excel') {
                return Excel::download(new SummaryReportExport($data), $filename . '.xlsx');
            } else {
                $pdf = PDF::loadView('reports.summary', $data);
                $pdf->setPaper('A4', 'portrait');
                return $pdf->download($filename . '.pdf');
            }
        } catch (\Exception $e) {
            Log::error('Error generating summary report: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Generate overdue report
     */
    private function generateOverdueReport($format)
    {
        $overdueSchedules = InspectionSchedule::with(['apar.aparType', 'assignedUser'])
            ->where('is_active', true)
            ->whereRaw('CONCAT(scheduled_date, " ", scheduled_time) < ?', [now()->format('Y-m-d H:i:s')])
            ->orderBy('scheduled_date', 'asc')
            ->orderBy('scheduled_time', 'asc')
            ->get();

        $data = [
            'title' => 'Laporan Jadwal Terlambat',
            'total_overdue' => $overdueSchedules->count(),
            'overdue_schedules' => $overdueSchedules,
            'generated_at' => now()->format('d/m/Y H:i:s'),
        ];

        $filename = "laporan-terlambat-" . now()->format('Y-m-d');

        if ($format === 'excel') {
            return Excel::download(new OverdueReportExport($data), $filename . '.xlsx');
        } else {
            $pdf = PDF::loadView('reports.overdue', $data);
            $pdf->setPaper('A4', 'portrait');
            return $pdf->download($filename . '.pdf');
        }
    }

    /**
     * Generate audit report
     */
    private function generateAuditReport($startDate, $endDate, $format)
    {
        $auditLogs = InspectionLog::with(['user', 'apar.aparType'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->orderBy('created_at', 'desc')
            ->get();

        $stats = [
            'total_logs' => $auditLogs->count(),
            'successful_logs' => $auditLogs->where('is_successful', true)->count(),
            'failed_logs' => $auditLogs->where('is_successful', false)->count(),
            'unique_users' => $auditLogs->unique('user_id')->count(),
            'unique_apars' => $auditLogs->unique('apar_id')->count(),
            'actions_breakdown' => $auditLogs->groupBy('action')->map->count(),
        ];

        $data = [
            'title' => 'Laporan Audit Log APAR',
            'period' => $startDate->format('d/m/Y') . ' - ' . $endDate->format('d/m/Y'),
            'audit_logs' => $auditLogs,
            'stats' => $stats,
            'generated_at' => now()->format('d/m/Y H:i:s'),
        ];

        $filename = "laporan-audit-{$startDate->format('Y-m-d')}-{$endDate->format('Y-m-d')}";

        if ($format === 'excel') {
            return Excel::download(new AuditLogExport($data), $filename . '.xlsx');
        } else {
            $pdf = PDF::loadView('reports.audit', $data);
            $pdf->setPaper('A4', 'portrait');
            return $pdf->download($filename . '.pdf');
        }
    }

    /**
     * Get start date based on range
     */
    private function getStartDate($range)
    {
        switch ($range) {
            case 'week':
                return now()->startOfWeek();
            case 'month':
                return now()->startOfMonth();
            case 'quarter':
                return now()->startOfQuarter();
            case 'year':
                return now()->startOfYear();
            case 'custom':
                return now()->subDays(30); // Default to last 30 days
            default:
                return now()->startOfWeek();
        }
    }

    /**
     * Get recent reports from storage
     */
    private function getRecentReports()
    {
        // This would typically read from a database table storing generated reports
        // For now, return empty array
        return [];
    }

    /**
     * Get APAR types statistics
     */
    private function getAparTypesStats()
    {
        try {
            // Try to get stats using new apar_type_id relationship
            $aparTypes = Apar::with('aparType')
                ->get()
                ->groupBy('aparType.name')
                ->map->count();
            
            // If no data found, return empty array
            if ($aparTypes->isEmpty()) {
                return [];
            }
            
            return $aparTypes;
        } catch (\Exception $e) {
            Log::warning('Could not get APAR types stats using new relationship: ' . $e->getMessage());
            return [];
        }
    }
}
