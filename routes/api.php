<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AparController;
use App\Http\Controllers\Api\InspectionController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\TankTruckController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AparTypeController;
use App\Http\Controllers\Api\DamageCategoryController;
use App\Http\Controllers\Api\RepairApprovalController;
use App\Http\Controllers\Api\RepairReportController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/login', [AuthController::class, 'login']);

// Test route
Route::get('/test', function() {
    return response()->json(['message' => 'API is working!']);
});

// QR Code route (handles auth internally)
Route::get('/apar/{apar}/qr-code', [AparController::class, 'qrCode']);

// Dev routes for dashboard (temporary) - outside auth middleware for testing
Route::prefix('dev')->group(function () {
    Route::get('/dashboard/stats', [DashboardController::class, 'getStats']);
});

Route::middleware('auth:api')->group(function () {
    // User info
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Dashboard - Semua route dashboard harus dilindungi
    Route::prefix('dashboard')->group(function () {
        Route::get('/stats', [DashboardController::class, 'getStats']);
    });
    
    // APAR routes
    Route::get('/apar', [AparController::class, 'index']);
    Route::get('/apar/{apar}', [AparController::class, 'show']);
    Route::get('/apar/qr/{qrCode}', [AparController::class, 'showByQr']);
    Route::post('/apar', [AparController::class, 'store']);
    Route::put('/apar/{apar}', [AparController::class, 'update']);
    Route::delete('/apar/{apar}', [AparController::class, 'destroy']);
    Route::get('/apar/{apar}/inspections', [AparController::class, 'inspections']);
Route::post('/apar/download-qr-pdf', [AparController::class, 'downloadQrPdf']);
    
    // APAR Type routes (Admin only)
    Route::get('/apar-types', [AparTypeController::class, 'index']);
    Route::get('/apar-types/{aparType}', [AparTypeController::class, 'show']);
    Route::post('/apar-types', [AparTypeController::class, 'store']);
    Route::put('/apar-types/{aparType}', [AparTypeController::class, 'update']);
    Route::delete('/apar-types/{aparType}', [AparTypeController::class, 'destroy']);
    
    // Damage Category routes (Admin only)
    Route::get('/damage-categories', [DamageCategoryController::class, 'index']);
    Route::get('/damage-categories/active', [DamageCategoryController::class, 'active']);
    Route::get('/damage-categories/{damageCategory}', [DamageCategoryController::class, 'show']);
    Route::post('/damage-categories', [DamageCategoryController::class, 'store']);
    Route::put('/damage-categories/{damageCategory}', [DamageCategoryController::class, 'update']);
    Route::delete('/damage-categories/{damageCategory}', [DamageCategoryController::class, 'destroy']);
    Route::patch('/damage-categories/{damageCategory}/toggle-status', [DamageCategoryController::class, 'toggleStatus']);
    
    // Inspection routes
    Route::get('/inspections', [InspectionController::class, 'index']);
    Route::get('/inspections/my-inspections', [InspectionController::class, 'myInspections']);
    Route::get('/inspections/{inspection}', [InspectionController::class, 'show']);
    Route::post('/inspections', [InspectionController::class, 'store']);
    Route::put('/inspections/{inspection}', [InspectionController::class, 'update']);
    Route::delete('/inspections/{inspection}', [InspectionController::class, 'destroy']);
    
    // Repair Approval routes (Admin only)
    Route::get('/repair-approvals', [RepairApprovalController::class, 'index']);
    Route::get('/repair-approvals/pending', [RepairApprovalController::class, 'pending']);
    Route::get('/repair-approvals/stats', [RepairApprovalController::class, 'stats']);
    Route::get('/repair-approvals/{repairApproval}', [RepairApprovalController::class, 'show']);
    Route::post('/repair-approvals/{repairApproval}/approve', [RepairApprovalController::class, 'approve']);
    Route::post('/repair-approvals/{repairApproval}/reject', [RepairApprovalController::class, 'reject']);
    Route::post('/repair-approvals/{repairApproval}/mark-completed', [RepairApprovalController::class, 'markCompleted']);
    
    // Repair Report routes
    Route::get('/repair-reports', [RepairReportController::class, 'index']);
    Route::get('/repair-reports/stats', [RepairReportController::class, 'stats']);
    Route::get('/repair-reports/{repairReport}', [RepairReportController::class, 'show']);
    Route::post('/repair-reports', [RepairReportController::class, 'store']);
    Route::put('/repair-reports/{repairReport}', [RepairReportController::class, 'update']);
    Route::delete('/repair-reports/{repairReport}', [RepairReportController::class, 'destroy']);
    
    // User management routes (Admin only)
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{user}', [UserController::class, 'show']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{user}', [UserController::class, 'update']);
    Route::delete('/users/{user}', [UserController::class, 'destroy']);
    Route::patch('/users/{user}/toggle-status', [UserController::class, 'toggleStatus']);
    
    // Tank Truck routes
    Route::get('/tank-trucks', [TankTruckController::class, 'index']);
    Route::get('/tank-trucks/{tankTruck}', [TankTruckController::class, 'show']);
    Route::post('/tank-trucks', [TankTruckController::class, 'store']);
    Route::put('/tank-trucks/{tankTruck}', [TankTruckController::class, 'update']);
    Route::delete('/tank-trucks/{tankTruck}', [TankTruckController::class, 'destroy']);
    
    // Schedule routes
    Route::get('/schedules', [ScheduleController::class, 'index']);
    Route::get('/schedules/my-schedules', [ScheduleController::class, 'mySchedules']);
    Route::get('/schedules/upcoming', [ScheduleController::class, 'upcoming']);
    Route::get('/schedules/{schedule}', [ScheduleController::class, 'show']);
    Route::post('/schedules', [ScheduleController::class, 'store']);
    Route::put('/schedules/{schedule}', [ScheduleController::class, 'update']);
    Route::delete('/schedules/{schedule}', [ScheduleController::class, 'destroy']);
    Route::patch('/schedules/{schedule}/mark-completed', [ScheduleController::class, 'markCompleted']);
    Route::post('/schedules/{schedule}/send-reminder', [ScheduleController::class, 'sendReminder']);
    
    
    
    // Notification routes
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread', [NotificationController::class, 'unread']);
    Route::post('/notifications/bulk', [NotificationController::class, 'sendBulkNotifications']);
Route::post('/notifications/bulk-all', [NotificationController::class, 'sendBulkNotificationsAll']);
    Route::patch('/notifications/{notification}/mark-read', [NotificationController::class, 'markAsRead']);
    Route::patch('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    
    // Settings routes (Admin only)
    Route::get('/settings', [SettingController::class, 'index']);
    Route::put('/settings/{setting}', [SettingController::class, 'update']);
    
    // Report routes
    Route::get('/reports/inspections', [ReportController::class, 'inspections']);
    Route::get('/reports/summary', [ReportController::class, 'summary']);
    Route::get('/reports/overdue', [ReportController::class, 'overdue']);
    Route::get('/reports/export/{type}', [ReportController::class, 'export']);
    
    // Audit Log routes (Admin only)
    Route::get('/audit-logs', [AuditLogController::class, 'index']);
    Route::get('/audit-logs/export', [AuditLogController::class, 'export']);
}); 