<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Apar;
use App\Models\Inspection;
use App\Models\RepairApproval;
use App\Models\InspectionSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function getStats(Request $request)
    {
        try {
            // Get date range from request, default to current week
            $startDate = $request->get('start_date', Carbon::now()->startOfWeek()->format('Y-m-d'));
            $endDate = $request->get('end_date', Carbon::now()->endOfWeek()->format('Y-m-d'));

            // Get APAR statistics
            $totalApar = Apar::count();
            $activeApar = Apar::where('status', 'active')->count();
            $needsRepairApar = Apar::where('status', 'needs_repair')->count();
            $inactiveApar = Apar::where('status', 'inactive')->count();
            $underRepairApar = Apar::where('status', 'under_repair')->count();
            
            // Ensure total matches the sum of all categories
            $calculatedTotal = $activeApar + $needsRepairApar + $inactiveApar + $underRepairApar;
            if ($calculatedTotal !== $totalApar) {
                // If there's a mismatch, adjust the largest category to match total
                $difference = $totalApar - $calculatedTotal;
                if ($difference > 0) {
                    // Add difference to the largest category
                    if ($activeApar >= $needsRepairApar && $activeApar >= $inactiveApar && $activeApar >= $underRepairApar) {
                        $activeApar += $difference;
                    } elseif ($needsRepairApar >= $activeApar && $needsRepairApar >= $inactiveApar && $needsRepairApar >= $underRepairApar) {
                        $needsRepairApar += $difference;
                    } elseif ($inactiveApar >= $activeApar && $inactiveApar >= $needsRepairApar && $inactiveApar >= $underRepairApar) {
                        $inactiveApar += $difference;
                    } else {
                        $underRepairApar += $difference;
                    }
                }
            }

            // Get inspection statistics using UTC start timestamps
            $nowUtc = Carbon::now('UTC');
            $overdueInspections = InspectionSchedule::where('is_active', true)
                ->where('is_completed', false)
                ->where('start_at', '<', $nowUtc)
                ->count();

            // Get repair approval statistics
            $repairStats = RepairApproval::selectRaw('status, count(*) as total')
                ->groupBy('status')
                ->get()
                ->keyBy('status');

            // Get inspection data with results breakdown for the specified date range
            $inspectionsByDate = Inspection::selectRaw('
                    DATE(created_at) as date,
                    `condition`,
                    count(*) as total
                ')
                ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                ->groupBy('date', 'condition')
                ->get()
                ->groupBy('date');

            // Process inspection data to create stacked bar chart data
            $processedInspections = [];
            $dateRange = [];
            $currentDate = Carbon::parse($startDate);
            $endDateObj = Carbon::parse($endDate);
            
            while ($currentDate->lte($endDateObj)) {
                $dateStr = $currentDate->format('Y-m-d');
                $dateRange[] = $currentDate->format('l'); // Day name
                
                $dayData = $inspectionsByDate->get($dateStr, collect());
                $processedInspections[] = [
                    'date' => $dateStr,
                    'day' => $currentDate->format('l'),
                    'good' => $dayData->where('condition', 'good')->first()->total ?? 0,
                    'needs_repair' => $dayData->whereIn('condition', ['damaged', 'needs_refill', 'expired'])->sum('total'),
                    'total' => $dayData->sum('total'),
                ];
                
                $currentDate->addDay();
            }

            // Get recent inspections
            $recentInspections = Inspection::with(['apar', 'user'])
                ->latest()
                ->take(5)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'stats' => [
                        'totalApar' => $totalApar,
                        'activeApar' => $activeApar,
                        'pendingRepairs' => $needsRepairApar,
                        'expiredApar' => $inactiveApar,
                        'inactiveApar' => $inactiveApar,
                        'overdueInspections' => $overdueInspections,
                    ],
                    'aparStatusChart' => [
                        'active' => $activeApar,
                        'needsRepair' => $needsRepairApar,
                        'inactive' => $inactiveApar,
                        'underRepair' => $underRepairApar,
                    ],
                    'repairStatusChart' => [
                        'approved' => $repairStats->get('approved', 0)->total ?? 0,
                        'pending' => $repairStats->get('pending', 0)->total ?? 0,
                        'rejected' => $repairStats->get('rejected', 0)->total ?? 0,
                        'completed' => $repairStats->get('completed', 0)->total ?? 0,
                    ],
                    'inspectionsByDate' => $processedInspections,
                    'dateRange' => $dateRange,
                    'recentInspections' => $recentInspections,
                    'dateRangeInfo' => [
                        'startDate' => $startDate,
                        'endDate' => $endDate,
                    ],
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching dashboard data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Statistik akurasi pelaporan per teknisi (Sprint 3A - Temuan #11).
     *
     * Mengukur "false alarm rate" setiap teknisi dengan menghitung berapa banyak inspeksi
     * mereka yang di-reject oleh supervisor (menandakan laporan yang tidak akurat atau sengaja
     * dimanipulasi). Berguna untuk identifikasi teknisi yang perlu coaching atau investigasi.
     *
     * Diproteksi: hanya Admin dan Supervisor yang dapat mengakses data ini.
     */
    public function technicianAccuracy(Request $request)
    {
        try {
            $periodDays = (int) $request->get('days', 30);
            $startDate  = Carbon::now()->subDays($periodDays);

            // Ambil semua teknisi yang memiliki inspeksi dalam periode
            $stats = DB::table('inspections')
                ->join('users', 'inspections.user_id', '=', 'users.id')
                ->select([
                    'users.id as user_id',
                    'users.name as technician_name',
                    'users.employee_id',
                    DB::raw('COUNT(*) as total_inspections'),
                    DB::raw("SUM(CASE WHEN inspections.inspection_status = 'rejected' THEN 1 ELSE 0 END) as rejected_count"),
                    DB::raw("SUM(CASE WHEN inspections.inspection_status = 'approved' THEN 1 ELSE 0 END) as approved_count"),
                    DB::raw("SUM(CASE WHEN inspections.mobile_flag_status = 'flagged' THEN 1 ELSE 0 END) as mobile_flagged_count"),
                    DB::raw("SUM(CASE WHEN inspections.is_mock_location_detected = 1 THEN 1 ELSE 0 END) as mock_location_count"),
                    // False alarm rate: persen inspeksi yang di-reject dari total
                    DB::raw('ROUND(100.0 * SUM(CASE WHEN inspections.inspection_status = \'rejected\' THEN 1 ELSE 0 END) / COUNT(*), 1) as false_alarm_rate_pct'),
                ])
                ->where('inspections.created_at', '>=', $startDate)
                ->whereNull('users.deleted_at')
                ->groupBy('users.id', 'users.name', 'users.employee_id')
                ->orderByDesc('false_alarm_rate_pct')
                ->get();

            return response()->json([
                'success'    => true,
                'period_days'=> $periodDays,
                'since'      => $startDate->toDateString(),
                'data'       => $stats,
                'summary' => [
                    'total_technicians'   => $stats->count(),
                    'high_risk_count'     => $stats->where('false_alarm_rate_pct', '>=', 30)->count(), // >30% rejection rate
                    'total_mock_location_incidents' => $stats->sum('mock_location_count'),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching technician accuracy: ' . $e->getMessage()
            ], 500);
        }
    }
}
