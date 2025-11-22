<?php

namespace Tests\Feature;

use App\Models\Apar;
use App\Models\Inspection;
use App\Models\RepairApproval;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class RepairReinspectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_technician_can_trigger_reinspection_after_repair()
    {
        Storage::fake('public');

        // 1. Setup Data
        $technician = User::factory()->create(['role' => 'teknisi']);
        $supervisor = User::factory()->create(['role' => 'supervisor']);
        $apar = Apar::factory()->create(['status' => 'active']);

        // 2. Create Inspection needing repair
        $inspection = Inspection::factory()->create([
            'apar_id' => $apar->id,
            'user_id' => $technician->id,
            'condition' => 'damaged',
            'requires_repair' => true,
            'repair_status' => 'approved', // Already approved
        ]);

        // 3. Create Approved Repair Approval
        $approval = RepairApproval::factory()->create([
            'inspection_id' => $inspection->id,
            'status' => 'approved',
            'approved_by' => $supervisor->id,
            'approved_at' => now(),
        ]);

        // 4. Submit Repair Report with needs_reinspection = true
        $response = $this->actingAs($technician, 'api')->postJson('/api/repair-reports', [
            'repair_approval_id' => $approval->id,
            'repair_description' => 'Perbaikan selesai namun perlu pengecekan ulang valve',
            'before_photo' => UploadedFile::fake()->image('before.jpg'),
            'after_photo' => UploadedFile::fake()->image('after.jpg'),
            'repair_completed_at' => now()->toDateTimeString(),
            'needs_reinspection' => true,
        ]);

        // 5. Assertions
        $response->assertStatus(201);

        // Check Inspection Status
        $this->assertDatabaseHas('inspections', [
            'id' => $inspection->id,
            'status' => 'needs_reinspection',
            'repair_status' => 'completed',
        ]);

        // Check New Schedule Created
        $this->assertDatabaseHas('inspection_schedules', [
            'apar_id' => $apar->id,
            'assigned_user_id' => $technician->id,
            'priority' => 'high',
        ]);

        $schedule = \App\Models\InspectionSchedule::where('apar_id', $apar->id)
            ->where('assigned_user_id', $technician->id)
            ->latest()
            ->first();

        $this->assertStringContainsString('VERIFIKASI HASIL PERBAIKAN', $schedule->notes);
    }
}
