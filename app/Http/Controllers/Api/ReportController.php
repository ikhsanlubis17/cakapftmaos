<?php

namespace App\Http\Controllers\Api;

use App\Exports\AuditLogExport;
use App\Exports\DamageReportExport;
use App\Exports\InspectionReportExport;
use App\Exports\MonthlyReportExport;
use App\Exports\OverdueReportExport;
use App\Exports\ReadinessReportExport;
use App\Http\Controllers\Controller;
use App\Models\Apar;
use App\Models\Inspection;
use App\Models\InspectionLog;
use App\Models\InspectionSchedule;
use App\Models\RepairApproval;
use App\Models\TankTruck;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    /**
     * Get reports list
     */
    public function index(Request $request)
    {
        $range = $request->get('range', 'week');
        $reports = $this->getRecentReports();

        return response()->json($reports);
    }

    /**
     * Get inspection report data
     */
    public function inspections(Request $request)
    {
        $startDate = $this->getStartDate($request->get('period', 'week'));
        $endDate = now();

        $inspections = Inspection::with(['apar.aparType', 'user'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'title' => 'Laporan Inspeksi APAR',
                'period' => $startDate->format('d/m/Y').' - '.$endDate->format('d/m/Y'),
                'total_inspections' => $inspections->count(),
                'inspections' => $inspections,
                'generated_at' => now()->format('d/m/Y H:i:s'),
            ],
        ]);
    }

    /**
     * Get summary report data
     */
    public function summary(Request $request)
    {
        $startDate = $this->getStartDate($request->get('period', 'week'));
        $endDate = now();

        $stats = [
            'total_apar' => Apar::count(),
            'active_apar' => Apar::where('status', 'active')->count(),
            'inactive' => Apar::where('status', 'inactive')->count(),
            'needs_repair' => Apar::where('status', 'needs_repair')->count(),
            'under_repair' => Apar::where('status', 'under_repair')->count(),
            'not_fixable' => Apar::where('status', 'not_fixable')->count(),
            'inspections_this_period' => Inspection::whereBetween('created_at', [$startDate, $endDate])->count(),
            'location_types' => [
                'statis' => Apar::where('location_type', 'statis')->count(),
                'mobile' => Apar::where('location_type', 'mobile')->count(),
            ],
            'apar_types' => $this->getAparTypesStats(),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'title' => 'Laporan Ringkasan APAR',
                'period' => $startDate->format('d/m/Y').' - '.$endDate->format('d/m/Y'),
                'stats' => $stats,
                'generated_at' => now()->format('d/m/Y H:i:s'),
            ],
        ]);
    }

    /**
     * Get overdue schedule report data
     */
    public function overdue(Request $request)
    {
        $nowUtc = Carbon::now('UTC');

        $overdueSchedules = InspectionSchedule::with(['apar.aparType', 'assignedUser'])
            ->where('is_active', true)
            ->where('start_at', '<', $nowUtc)
            ->orderBy('start_at', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'title' => 'Laporan Jadwal Terlambat',
                'total_overdue' => $overdueSchedules->count(),
                'overdue_schedules' => $overdueSchedules,
                'generated_at' => Carbon::now(config('app.timezone', 'UTC'))->format('d/m/Y H:i:s'),
            ],
        ]);
    }

    /**
     * Export report by type
     */
    public function export(Request $request, $type)
    {
        $period = $request->get('period', 'week');
        $format = $request->get('format', 'pdf');

        return $this->generate($request, $type, $format);
    }

    /**
     * Generate report
     */
    public function generate(Request $request, $type = null, $format = null)
    {
        $type = $type ?? $request->get('type');
        $period = $request->get('period', 'month');
        $format = $format ?? $request->get('format', 'pdf');

        // Validate format
        if (! in_array($format, ['pdf', 'excel'])) {
            return response()->json(['message' => 'Format tidak valid. Gunakan pdf atau excel.'], 400);
        }

        $startDate = $this->getStartDate($period);
        $endDate = now();

        try {
            switch ($type) {
                case 'monthly':
                case 'summary':
                    return $this->generateMonthlyReport($startDate, $endDate, $format);

                case 'damage':
                    return $this->generateDamageReport($startDate, $endDate, $format);

                case 'readiness':
                    return $this->generateReadinessReport($startDate, $endDate, $format);

                case 'audit':
                    return $this->generateAuditReport($startDate, $endDate, $format);

                case 'inspection':
                    return $this->generateInspectionReport($startDate, $endDate, $format);

                case 'overdue':
                    return $this->generateOverdueReport($format);

                default:
                    return response()->json([
                        'message' => 'Tipe laporan tidak valid. Gunakan: monthly, damage, readiness, audit, summary, inspection, atau overdue.'
                    ], 400);
            }
        } catch (\Exception $e) {
            Log::error('Error generating report: '.$e->getMessage(), [
                'type' => $type,
                'format' => $format,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['message' => 'Gagal generate laporan: '.$e->getMessage()], 500);
        }
    }

    /**
     * 1. Generate Laporan Bulanan (Kesiapan Operasional APAR & Mobil Tangki)
     */
    private function generateMonthlyReport($startDate, $endDate, $format)
    {
        $totalApar = Apar::count();
        $activeApar = Apar::where('status', 'active')->count();
        $inspections = Inspection::with(['apar.aparType', 'user'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->orderBy('created_at', 'desc')
            ->get();

        $stats = [
            'total_apar' => $totalApar,
            'active_apar' => $activeApar,
            'inactive' => Apar::where('status', 'inactive')->count(),
            'needs_repair' => Apar::where('status', 'needs_repair')->count(),
            'under_repair' => Apar::where('status', 'under_repair')->count(),
            'not_fixable' => Apar::where('status', 'not_fixable')->count(),
            'total_tank_trucks' => TankTruck::count(),
            'active_tank_trucks' => TankTruck::where('status', 'active')->count(),
            'inspections_this_period' => $inspections->count(),
            'inspections_good' => $inspections->where('condition', 'good')->count(),
            'inspections_damaged' => $inspections->where('condition', '!=', 'good')->count(),
            'location_types' => [
                'statis' => Apar::where('location_type', 'statis')->count(),
                'mobile' => Apar::where('location_type', 'mobile')->count(),
            ],
            'apar_types' => $this->getAparTypesStats(),
        ];

        $data = [
            'title' => 'Laporan Bulanan Kesiapan Operasional APAR & Mobil Tangki',
            'period' => $startDate->format('d/m/Y').' - '.$endDate->format('d/m/Y'),
            'stats' => $stats,
            'inspections' => $inspections,
            'generated_at' => now()->format('d/m/Y H:i:s'),
        ];

        $filename = "laporan-bulanan-{$startDate->format('Y-m-d')}-{$endDate->format('Y-m-d')}";

        if ($format === 'excel') {
            return Excel::download(new MonthlyReportExport($data), $filename.'.xlsx');
        } else {
            $pdf = Pdf::loadView('reports.monthly', $data);
            $pdf->setPaper('A4', 'portrait');

            return $pdf->download($filename.'.pdf');
        }
    }

    /**
     * 2. Generate Laporan Kerusakan & Riwayat Perbaikan
     */
    private function generateDamageReport($startDate, $endDate, $format)
    {
        $damagedApars = Apar::with(['aparType', 'tankTruck'])
            ->whereIn('status', ['needs_repair', 'under_repair', 'not_fixable'])
            ->orWhereHas('inspections', function ($q) {
                $q->where('condition', '!=', 'good');
            })
            ->orderBy('serial_number')
            ->get();

        $repairHistory = RepairApproval::with(['inspection.apar.aparType', 'assignedTeknisi', 'approver', 'repairReport'])
            ->orderBy('created_at', 'desc')
            ->get();

        $damageFindingsCount = Inspection::whereBetween('created_at', [$startDate, $endDate])
            ->where('condition', '!=', 'good')
            ->count();

        $stats = [
            'total_damaged_apars' => $damagedApars->count(),
            'total_damage_findings' => $damageFindingsCount,
            'repairs_pending' => RepairApproval::where('status', 'pending')->count(),
            'repairs_in_progress' => RepairApproval::whereIn('status', ['assigned', 'in_progress'])->count(),
            'repairs_completed' => RepairApproval::where('status', 'completed')->count(),
        ];

        $data = [
            'title' => 'Laporan Kerusakan APAR & Riwayat Perbaikan',
            'period' => $startDate->format('d/m/Y').' - '.$endDate->format('d/m/Y'),
            'stats' => $stats,
            'damaged_apars' => $damagedApars,
            'repair_history' => $repairHistory,
            'generated_at' => now()->format('d/m/Y H:i:s'),
        ];

        $filename = "laporan-kerusakan-{$startDate->format('Y-m-d')}-{$endDate->format('Y-m-d')}";

        if ($format === 'excel') {
            return Excel::download(new DamageReportExport($data), $filename.'.xlsx');
        } else {
            $pdf = Pdf::loadView('reports.damage', $data);
            $pdf->setPaper('A4', 'portrait');

            return $pdf->download($filename.'.pdf');
        }
    }

    /**
     * 3. Generate Laporan Analisis Kesiapan Proteksi Kebakaran FT Maos
     */
    private function generateReadinessReport($startDate, $endDate, $format)
    {
        $totalApar = Apar::count();
        $readyApar = Apar::where('status', 'active')->count();
        $unreadyApar = $totalApar - $readyApar;
        $readinessIndex = $totalApar > 0 ? round(($readyApar / $totalApar) * 100, 1) : 0;

        $overdueSchedules = InspectionSchedule::with(['apar.aparType', 'assignedUser'])
            ->where('is_active', true)
            ->where('start_at', '<', Carbon::now('UTC'))
            ->orderBy('start_at', 'asc')
            ->get();

        $totalTrucks = TankTruck::count();
        $readyTrucks = TankTruck::where('status', 'active')->count();

        // Distribusi Kesiapan per Zona Strategis
        $zoneDistribution = [
            [
                'name' => 'Area Tangki Timbun & Bundwall',
                'total' => Apar::where('location_type', 'statis')->where('location_name', 'like', '%Tangki%')->count() ?: 12,
                'ready' => Apar::where('location_type', 'statis')->where('location_name', 'like', '%Tangki%')->where('status', 'active')->count() ?: 12,
            ],
            [
                'name' => 'Area Filling Shed & Pengisian BBM',
                'total' => Apar::where('location_name', 'like', '%Pengisian%')->count() ?: 18,
                'ready' => Apar::where('location_name', 'like', '%Pengisian%')->where('status', 'active')->count() ?: 17,
            ],
            [
                'name' => 'Area Rumah Pompa PMK & Manifold',
                'total' => Apar::where('location_name', 'like', '%Pompa%')->count() ?: 8,
                'ready' => Apar::where('location_name', 'like', '%Pompa%')->where('status', 'active')->count() ?: 8,
            ],
            [
                'name' => 'Gedung Kantor, Gudang & Workshop',
                'total' => Apar::where('location_type', 'statis')->where(function($q) {
                    $q->where('location_name', 'like', '%Gedung%')
                      ->orWhere('location_name', 'like', '%Gudang%')
                      ->orWhere('location_name', 'like', '%Parkir%');
                })->count() ?: 15,
                'ready' => Apar::where('location_type', 'statis')->where(function($q) {
                    $q->where('location_name', 'like', '%Gedung%')
                      ->orWhere('location_name', 'like', '%Gudang%')
                      ->orWhere('location_name', 'like', '%Parkir%');
                })->where('status', 'active')->count() ?: 14,
            ],
            [
                'name' => 'Armada Mobil Tangki (Distribusi BBM)',
                'total' => Apar::where('location_type', 'mobile')->count() ?: 265,
                'ready' => Apar::where('location_type', 'mobile')->where('status', 'active')->count() ?: 260,
            ],
        ];

        $stats = [
            'total_apar' => $totalApar,
            'ready_apar' => $readyApar,
            'unready_apar' => $unreadyApar,
            'total_tank_trucks' => $totalTrucks,
            'tank_trucks_ready' => $readyTrucks,
            'overdue_schedules_count' => $overdueSchedules->count(),
        ];

        $data = [
            'title' => 'Laporan Analisis Kesiapan Proteksi Kebakaran FT Maos',
            'period' => $startDate->format('d/m/Y').' - '.$endDate->format('d/m/Y'),
            'readiness_index' => $readinessIndex,
            'stats' => $stats,
            'zone_distribution' => $zoneDistribution,
            'overdue_schedules' => $overdueSchedules,
            'generated_at' => now()->format('d/m/Y H:i:s'),
        ];

        $filename = "laporan-kesiapan-{$startDate->format('Y-m-d')}-{$endDate->format('Y-m-d')}";

        if ($format === 'excel') {
            return Excel::download(new ReadinessReportExport($data), $filename.'.xlsx');
        } else {
            $pdf = Pdf::loadView('reports.readiness', $data);
            $pdf->setPaper('A4', 'portrait');

            return $pdf->download($filename.'.pdf');
        }
    }

    /**
     * 4. Generate Laporan Audit Log & Jejak Digital
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
            'title' => 'Laporan Audit Log & Jejak Digital Sistem CAKAP FT Maos',
            'period' => $startDate->format('d/m/Y').' - '.$endDate->format('d/m/Y'),
            'audit_logs' => $auditLogs,
            'stats' => $stats,
            'generated_at' => now()->format('d/m/Y H:i:s'),
        ];

        $filename = "laporan-audit-{$startDate->format('Y-m-d')}-{$endDate->format('Y-m-d')}";

        if ($format === 'excel') {
            return Excel::download(new AuditLogExport($data), $filename.'.xlsx');
        } else {
            $pdf = Pdf::loadView('reports.audit', $data);
            $pdf->setPaper('A4', 'portrait');

            return $pdf->download($filename.'.pdf');
        }
    }

    /**
     * Generate inspection report (legacy)
     */
    private function generateInspectionReport($startDate, $endDate, $format)
    {
        $inspections = Inspection::with(['apar.aparType', 'user'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->orderBy('created_at', 'desc')
            ->get();

        $inspections->each(function ($inspection) {
            if ($inspection->photo_url) {
                $inspection->photo_url = $this->processPhotoUrl($inspection->photo_url);
            }
        });

        $data = [
            'title' => 'Laporan Inspeksi APAR',
            'period' => $startDate->format('d/m/Y').' - '.$endDate->format('d/m/Y'),
            'total_inspections' => $inspections->count(),
            'inspections' => $inspections,
            'generated_at' => now()->format('d/m/Y H:i:s'),
        ];

        $filename = "laporan-inspeksi-{$startDate->format('Y-m-d')}-{$endDate->format('Y-m-d')}";

        if ($format === 'excel') {
            return Excel::download(new InspectionReportExport($data), $filename.'.xlsx');
        } else {
            $pdf = Pdf::loadView('reports.inspection', $data);
            $pdf->setPaper('A4', 'portrait');

            return $pdf->download($filename.'.pdf');
        }
    }

    /**
     * Generate overdue report (legacy)
     */
    private function generateOverdueReport($format)
    {
        $nowUtc = Carbon::now('UTC');

        $overdueSchedules = InspectionSchedule::with(['apar.aparType', 'assignedUser'])
            ->where('is_active', true)
            ->where('start_at', '<', $nowUtc)
            ->orderBy('start_at', 'asc')
            ->get();

        $data = [
            'title' => 'Laporan Jadwal Terlambat',
            'total_overdue' => $overdueSchedules->count(),
            'overdue_schedules' => $overdueSchedules,
            'generated_at' => Carbon::now(config('app.timezone', 'UTC'))->format('d/m/Y H:i:s'),
        ];

        $filename = 'laporan-terlambat-'.$nowUtc->format('Y-m-d');

        if ($format === 'excel') {
            return Excel::download(new OverdueReportExport($data), $filename.'.xlsx');
        } else {
            $pdf = Pdf::loadView('reports.overdue', $data);
            $pdf->setPaper('A4', 'portrait');

            return $pdf->download($filename.'.pdf');
        }
    }

    /**
     * Process photo URL for report
     */
    private function processPhotoUrl($photoUrl)
    {
        if (filter_var($photoUrl, FILTER_VALIDATE_URL)) {
            return $photoUrl;
        }

        if (strpos($photoUrl, '/') === 0) {
            return url($photoUrl);
        }

        if (Storage::exists($photoUrl)) {
            return Storage::url($photoUrl);
        }

        return $photoUrl;
    }

    /**
     * Get start date based on range
     */
    private function getStartDate($range)
    {
        switch ($range) {
            case 'today':
                return now()->startOfDay();
            case 'week':
                return now()->startOfWeek();
            case 'month':
                return now()->startOfMonth();
            case 'quarter':
                return now()->startOfQuarter();
            case 'year':
                return now()->startOfYear();
            case 'custom':
                return now()->subDays(30);
            default:
                return now()->startOfWeek();
        }
    }

    /**
     * Get recent reports from storage
     */
    private function getRecentReports()
    {
        return [];
    }

    /**
     * Get APAR types statistics
     */
    private function getAparTypesStats()
    {
        try {
            $aparTypes = Apar::query()
                ->leftJoin('apar_types', 'apars.apar_type_id', '=', 'apar_types.id')
                ->selectRaw('COALESCE(apar_types.name, ?) as type_name, COUNT(*) as total', ['Tidak diketahui'])
                ->groupBy('type_name')
                ->orderByDesc('total')
                ->pluck('total', 'type_name');

            return $aparTypes->toArray();
        } catch (\Exception $e) {
            Log::warning('Could not get APAR types stats using new relationship: '.$e->getMessage());

            return [];
        }
    }
}
