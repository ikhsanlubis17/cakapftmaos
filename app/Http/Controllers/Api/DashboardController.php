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

            // Get inspection statistics - use scheduled_date and scheduled_time
            $overdueInspections = InspectionSchedule::where('is_active', true)
                ->whereRaw('CONCAT(scheduled_date, " ", scheduled_time) < ?', [now()->format('Y-m-d H:i:s')])
                ->where('is_completed', false)
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
                    'needs_repair' => $dayData->where('condition', 'needs_repair')->first()->total ?? 0,
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
}
