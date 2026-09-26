<?php

namespace Tests\Feature;

use App\Models\Apar;
use App\Models\AparType;
use App\Models\Inspection;
use App\Models\RepairApproval;
use App\Models\RepairReport;
use App\Models\TankTruck;
use App\Models\User;
use App\Services\RepairReportService;
use App\Services\ImageService;
use App\Services\ReinspectionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SoftDeletesAndTransactionTest extends TestCase
{
    use RefreshDatabase;

    public function test_master_models_support_soft_deletes(): void
    {
        // 1. Test User Soft Delete
        $user = User::factory()->create(['name' => 'Test Worker', 'role' => 'teknisi']);
        $user->delete();

        $this->assertSoftDeleted('users', ['id' => $user->id]);
        $this->assertNull(User::find($user->id));
        $this->assertNotNull(User::withTrashed()->find($user->id));

        // 2. Test AparType Soft Delete
        $aparType = AparType::create(['name' => 'CO2 High Pressure', 'is_active' => true]);
        $aparType->delete();

        $this->assertSoftDeleted('apar_types', ['id' => $aparType->id]);
        $this->assertNull(AparType::find($aparType->id));
        $this->assertNotNull(AparType::withTrashed()->find($aparType->id));

        // 3. Test TankTruck Soft Delete
        $tankTruck = TankTruck::create([
            'plate_number' => 'B 9999 PER',
            'driver_name' => 'Budi Santoso',
            'driver_phone' => '081234567890',
            'status' => 'active',
        ]);
        $tankTruck->delete();

        $this->assertSoftDeleted('tank_trucks', ['id' => $tankTruck->id]);
        $this->assertNull(TankTruck::find($tankTruck->id));
        $this->assertNotNull(TankTruck::withTrashed()->find($tankTruck->id));

        // 4. Test Apar Soft Delete
        $apar = Apar::factory()->create([
            'serial_number' => 'APAR-PERTAMINA-001',
            'qr_code' => 'QR-PERTAMINA-001',
            'status' => 'active',
        ]);
        $apar->delete();

        $this->assertSoftDeleted('apars', ['id' => $apar->id]);
        $this->assertNull(Apar::find($apar->id));
        $this->assertNotNull(Apar::withTrashed()->find($apar->id));
    }

    public function test_soft_deleted_apar_preserves_inspection_historical_relation(): void
    {
        $aparType = AparType::create(['name' => 'Foam AFFF', 'is_active' => true]);
        $user = User::factory()->create(['role' => 'teknisi']);
        $apar = Apar::factory()->create([
            'serial_number' => 'APAR-HIST-001',
            'qr_code' => 'QR-HIST-001',
            'apar_type_id' => $aparType->id,
            'status' => 'active',
        ]);

        $inspection = Inspection::create([
            'apar_id' => $apar->id,
            'user_id' => $user->id,
            'photo_url' => '/storage/inspections/photos/sample.jpg',
            'condition' => 'good',
            'status' => 'completed',
            'inspection_status' => 'approved',
            'repair_status' => 'none',
        ]);

        // Soft delete the APAR
        $apar->delete();

        // Ensure APAR is soft deleted
        $this->assertSoftDeleted('apars', ['id' => $apar->id]);

        // Verify inspection record still exists and its apar relation with trashed can be retrieved
        $reloadedInspection = Inspection::find($inspection->id);
        $this->assertNotNull($reloadedInspection);
        $this->assertEquals($apar->id, $reloadedInspection->apar_id);
        $this->assertNotNull(Apar::withTrashed()->find($reloadedInspection->apar_id));
    }

    public function test_repair_report_service_approve_is_atomic_with_transaction(): void
    {
        $aparType = AparType::create(['name' => 'Dry Powder', 'is_active' => true]);
        $user = User::factory()->create(['role' => 'teknisi']);
        $supervisor = User::factory()->create(['role' => 'supervisor']);

        $apar = Apar::factory()->create([
            'serial_number' => 'APAR-REPAIR-001',
            'qr_code' => 'QR-REPAIR-001',
            'apar_type_id' => $aparType->id,
            'status' => 'needs_repair',
        ]);

        $inspection = Inspection::create([
            'apar_id' => $apar->id,
            'user_id' => $user->id,
            'photo_url' => '/storage/inspections/photos/sample.jpg',
            'condition' => 'damaged',
            'status' => 'completed',
            'inspection_status' => 'approved',
            'repair_status' => 'approved',
            'requires_repair' => true,
        ]);

        $repairApproval = RepairApproval::create([
            'inspection_id' => $inspection->id,
            'approved_by' => $supervisor->id,
            'status' => 'approved',
        ]);

        $repairReport = RepairReport::create([
            'repair_approval_id' => $repairApproval->id,
            'reported_by' => $user->id,
            'repair_description' => 'Replaced nozzle and pressure gauge',
            'before_photo_url' => '/storage/repairs/before/sample.jpg',
            'after_photo_url' => '/storage/repairs/after/sample.jpg',
            'repair_completed_at' => now(),
            'status' => 'pending_review',
        ]);

        $service = app(RepairReportService::class);
        $approvedReport = $service->approve($repairReport, $supervisor->id, 'Disetujui dan siap beroperasi');

        // Check that all 4 states have transitioned synchronously
        $this->assertEquals('approved', $approvedReport->status);
        $this->assertEquals('completed', $repairApproval->fresh()->status);
        $this->assertEquals('completed', $inspection->fresh()->repair_status);
        $this->assertEquals('active', $apar->fresh()->status->value);
    }
}
