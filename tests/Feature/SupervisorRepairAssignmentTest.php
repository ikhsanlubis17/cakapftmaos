<?php

namespace Tests\Feature;

use App\Models\Apar;
use App\Models\DamageCategory;
use App\Models\Inspection;
use App\Models\InspectionSchedule;
use App\Models\RepairApproval;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class SupervisorRepairAssignmentTest extends TestCase
{
    use RefreshDatabase;

    protected $supervisor;
    protected $teknisi;
    protected $teknisiToken;
    protected $supervisorToken;
    protected $apar;
    protected $damageCategory;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');

        $this->supervisor = User::factory()->create(['role' => 'supervisor']);
        $this->teknisi = User::factory()->create(['role' => 'teknisi']);

        $this->supervisorToken = JWTAuth::fromUser($this->supervisor);
        $this->teknisiToken = JWTAuth::fromUser($this->teknisi);

        $this->apar = Apar::create([
            'serial_number' => 'SN-APAR-REPAIR-01',
            'qr_code' => 'QR-APAR-REPAIR-01',
            'location_type' => 'statis',
            'location_name' => 'Gedung Kantor FT Maos',
            'status' => 'active',
            'capacity' => 6,
            'manufactured_date' => now()->subYear(),
            'expired_at' => now()->addYear(),
        ]);

        $this->damageCategory = DamageCategory::create([
            'name' => 'Pin Segel Rusak',
            'type' => 'general',
            'severity' => 'medium',
            'description' => 'Pin segel terlepas atau putus',
        ]);

        // Active inspection schedule for today
        InspectionSchedule::create([
            'apar_id' => $this->apar->id,
            'assigned_user_id' => $this->teknisi->id,
            'start_at' => now()->startOfDay(),
            'end_at' => now()->endOfDay(),
            'frequency' => 'weekly',
            'is_active' => true,
            'is_completed' => false,
        ]);
    }

    public function test_damaged_inspection_creates_pending_repair_approval_without_assigning_technician()
    {
        // Technician submits damaged inspection WITHOUT assigning technician or schedule
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->teknisiToken)
            ->postJson('/api/inspections', [
                'apar_id' => $this->apar->id,
                'apar_qrCode' => $this->apar->qr_code,
                'condition' => 'damaged',
                'notes' => 'Ditemukan pin segel lepas saat patroli pagi',
                'photo' => UploadedFile::fake()->image('apar.jpg'),
                'selfie' => UploadedFile::fake()->image('selfie.jpg'),
                'damage_categories' => [
                    [
                        'category_id' => $this->damageCategory->id,
                        'notes' => 'Segel putus',
                        'severity' => 'medium',
                        'damage_photo' => UploadedFile::fake()->image('damage.jpg'),
                    ]
                ],
            ]);

        $response->assertStatus(201);

        // Assert APAR status is needs_repair
        $this->assertDatabaseHas('apars', [
            'id' => $this->apar->id,
            'status' => 'needs_repair',
        ]);

        // Assert a pending RepairApproval is created awaiting Supervisor
        $this->assertDatabaseHas('repair_approvals', [
            'status' => 'pending',
            'assigned_user_id' => null,
        ]);
    }

    public function test_supervisor_approval_validates_technician_and_schedule_fields()
    {
        $inspection = Inspection::factory()->create([
            'apar_id' => $this->apar->id,
            'user_id' => $this->teknisi->id,
            'condition' => 'damaged',
            'requires_repair' => true,
        ]);

        $approval = RepairApproval::create([
            'inspection_id' => $inspection->id,
            'status' => 'pending',
        ]);

        // Missing technician and schedule
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->supervisorToken)
            ->postJson("/api/repair-approvals/{$approval->id}/approve", [
                'supervisor_notes' => 'Ganti pin', // too short (<10 chars)
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['supervisor_notes', 'assigned_teknisi_id', 'schedule_date', 'schedule_time']);
    }

    public function test_supervisor_successfully_assigns_technician_and_creates_repair_schedule()
    {
        $otherTeknisi = User::factory()->create(['role' => 'teknisi', 'name' => 'Budi Teknisi']);

        $inspection = Inspection::factory()->create([
            'apar_id' => $this->apar->id,
            'user_id' => $this->teknisi->id,
            'condition' => 'damaged',
            'requires_repair' => true,
        ]);

        $approval = RepairApproval::create([
            'inspection_id' => $inspection->id,
            'status' => 'pending',
        ]);

        $tomorrow = Carbon::now()->addDay()->format('Y-m-d');

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->supervisorToken)
            ->postJson("/api/repair-approvals/{$approval->id}/approve", [
                'supervisor_notes' => 'Harap segera lakukan penggantian pin segel dan cek ulang tekanan tabung.',
                'assigned_teknisi_id' => $otherTeknisi->id,
                'schedule_date' => $tomorrow,
                'schedule_time' => '09:30',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'approved',
                    'assigned_user_id' => $otherTeknisi->id,
                ]
            ]);

        // Assert RepairApproval updated with assigned technician
        $this->assertDatabaseHas('repair_approvals', [
            'id' => $approval->id,
            'status' => 'approved',
            'assigned_user_id' => $otherTeknisi->id,
            'approved_by' => $this->supervisor->id,
        ]);

        // Assert APAR status is under_repair
        $this->assertDatabaseHas('apars', [
            'id' => $this->apar->id,
            'status' => 'under_repair',
        ]);

        // Assert InspectionSchedule created for the assigned technician
        $this->assertDatabaseHas('inspection_schedules', [
            'apar_id' => $this->apar->id,
            'assigned_user_id' => $otherTeknisi->id,
            'frequency' => 'once',
            'is_active' => true,
        ]);
    }

    public function test_supervisor_submitting_damaged_inspection_requires_technician_assignment()
    {
        // Supervisor submits damaged inspection WITHOUT assigning technician or schedule
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->supervisorToken)
            ->postJson('/api/inspections', [
                'apar_id' => $this->apar->id,
                'apar_qrCode' => $this->apar->qr_code,
                'condition' => 'damaged',
                'notes' => 'Ditemukan manometer rusak saat inspeksi supervisor',
                'photo' => UploadedFile::fake()->image('apar.jpg'),
                'selfie' => UploadedFile::fake()->image('selfie.jpg'),
                'damage_categories' => [
                    [
                        'category_id' => $this->damageCategory->id,
                        'notes' => 'Manometer bocor',
                        'severity' => 'high',
                        'damage_photo' => UploadedFile::fake()->image('damage.jpg'),
                    ]
                ],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['assigned_teknisi_id', 'schedule_date', 'schedule_time']);
    }

    public function test_supervisor_submitting_damaged_inspection_rejects_schedule_conflict()
    {
        $busyTeknisi = User::factory()->create(['role' => 'teknisi', 'name' => 'Teknisi Sibuk']);
        $scheduleDate = Carbon::now()->addDay()->format('Y-m-d');
        $scheduleTime = '10:00';

        // Buat jadwal bentrok untuk teknisi
        $appTimezone = config('app.timezone', 'UTC');
        $startAt = Carbon::parse($scheduleDate . ' ' . $scheduleTime, $appTimezone);
        $endAt = $startAt->copy()->addHour();

        InspectionSchedule::create([
            'apar_id' => $this->apar->id,
            'assigned_user_id' => $busyTeknisi->id,
            'start_at' => $startAt,
            'end_at' => $endAt,
            'frequency' => 'once',
            'is_active' => true,
            'is_completed' => false,
        ]);

        // Supervisor mencoba menugaskan teknisi sibuk pada jam yang sama
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->supervisorToken)
            ->postJson('/api/inspections', [
                'apar_id' => $this->apar->id,
                'apar_qrCode' => $this->apar->qr_code,
                'condition' => 'damaged',
                'notes' => 'Inspeksi supervisor mendeteksi kerusakan',
                'photo' => UploadedFile::fake()->image('apar.jpg'),
                'selfie' => UploadedFile::fake()->image('selfie.jpg'),
                'assigned_teknisi_id' => $busyTeknisi->id,
                'schedule_date' => $scheduleDate,
                'schedule_time' => $scheduleTime,
                'supervisor_notes' => 'Segera perbaiki tabung ini.',
                'damage_categories' => [
                    [
                        'category_id' => $this->damageCategory->id,
                        'notes' => 'Handle patah',
                        'severity' => 'high',
                        'damage_photo' => UploadedFile::fake()->image('damage.jpg'),
                    ]
                ],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['assigned_teknisi_id']);
    }

    public function test_supervisor_submitting_damaged_inspection_successfully_assigns_technician_and_schedules_repair()
    {
        $freeTeknisi = User::factory()->create(['role' => 'teknisi', 'name' => 'Teknisi Siap']);
        $scheduleDate = Carbon::now()->addDays(2)->format('Y-m-d');
        $scheduleTime = '14:00';

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->supervisorToken)
            ->postJson('/api/inspections', [
                'apar_id' => $this->apar->id,
                'apar_qrCode' => $this->apar->qr_code,
                'condition' => 'damaged',
                'notes' => 'Inspeksi supervisor menemukan kerusakan',
                'photo' => UploadedFile::fake()->image('apar.jpg'),
                'selfie' => UploadedFile::fake()->image('selfie.jpg'),
                'assigned_teknisi_id' => $freeTeknisi->id,
                'schedule_date' => $scheduleDate,
                'schedule_time' => $scheduleTime,
                'supervisor_notes' => 'Ganti selang dan seal yang rapuh.',
                'damage_categories' => [
                    [
                        'category_id' => $this->damageCategory->id,
                        'notes' => 'Selang retak',
                        'severity' => 'medium',
                        'damage_photo' => UploadedFile::fake()->image('damage.jpg'),
                    ]
                ],
            ]);

        $response->assertStatus(201);

        // Assert APAR status is under_repair immediately
        $this->assertDatabaseHas('apars', [
            'id' => $this->apar->id,
            'status' => 'under_repair',
        ]);

        // Assert RepairApproval is approved with assigned technician
        $this->assertDatabaseHas('repair_approvals', [
            'status' => 'approved',
            'approved_by' => $this->supervisor->id,
            'assigned_user_id' => $freeTeknisi->id,
            'supervisor_notes' => 'Ganti selang dan seal yang rapuh.',
        ]);

        // Assert InspectionSchedule created for technician
        $this->assertDatabaseHas('inspection_schedules', [
            'apar_id' => $this->apar->id,
            'assigned_user_id' => $freeTeknisi->id,
            'frequency' => 'once',
            'is_active' => true,
        ]);
    }

    public function test_supervisor_cannot_submit_repair_report()
    {
        $inspection = Inspection::factory()->create([
            'apar_id' => $this->apar->id,
            'user_id' => $this->supervisor->id,
            'condition' => 'damaged',
            'requires_repair' => true,
        ]);

        $approval = RepairApproval::create([
            'inspection_id' => $inspection->id,
            'status' => 'approved',
            'approved_by' => $this->supervisor->id,
            'assigned_user_id' => $this->teknisi->id,
        ]);

        // Supervisor mencoba submit laporan perbaikan fisik
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->supervisorToken)
            ->postJson('/api/repair-reports', [
                'repair_approval_id' => $approval->id,
                'repair_description' => 'Supervisor mencoba submit perbaikan',
                'before_photo' => UploadedFile::fake()->image('before.jpg'),
                'after_photo' => UploadedFile::fake()->image('after.jpg'),
                'repair_completed_at' => now()->toDateTimeString(),
            ]);

        // Harus ditolak 403 Forbidden
        $response->assertStatus(403);
    }

    public function test_available_technicians_endpoint_detects_conflicts()
    {
        $freeTeknisi = User::factory()->create(['role' => 'teknisi', 'name' => 'Teknisi A Free', 'is_active' => true]);
        $busyTeknisi = User::factory()->create(['role' => 'teknisi', 'name' => 'Teknisi B Busy', 'is_active' => true]);

        $testDate = Carbon::now()->addDays(3)->format('Y-m-d');
        $testTime = '11:00';

        $appTimezone = config('app.timezone', 'UTC');
        $startAt = Carbon::parse($testDate . ' ' . $testTime, $appTimezone);
        $endAt = $startAt->copy()->addHour();

        // Buat jadwal untuk busyTeknisi
        InspectionSchedule::create([
            'apar_id' => $this->apar->id,
            'assigned_user_id' => $busyTeknisi->id,
            'start_at' => $startAt,
            'end_at' => $endAt,
            'frequency' => 'once',
            'is_active' => true,
            'is_completed' => false,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->supervisorToken)
            ->getJson("/api/schedules/available-technicians?schedule_date={$testDate}&schedule_time={$testTime}");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $data = collect($response->json('data'));

        $busyItem = $data->firstWhere('id', $busyTeknisi->id);
        $freeItem = $data->firstWhere('id', $freeTeknisi->id);

        $this->assertNotNull($busyItem);
        $this->assertFalse($busyItem['is_available']);
        $this->assertNotNull($busyItem['conflict']);

        $this->assertNotNull($freeItem);
        $this->assertTrue($freeItem['is_available']);
        $this->assertNull($freeItem['conflict']);
    }

    public function test_available_technicians_endpoint_filters_only_available_when_requested()
    {
        $freeTeknisi = User::factory()->create(['role' => 'teknisi', 'name' => 'Teknisi Siap Kerja', 'is_active' => true]);
        $busyTeknisi = User::factory()->create(['role' => 'teknisi', 'name' => 'Teknisi Sedang Sibuk', 'is_active' => true]);

        $testDate = Carbon::now()->addDays(4)->format('Y-m-d');
        $testTime = '14:00';

        $appTimezone = config('app.timezone', 'UTC');
        $startAt = Carbon::parse($testDate . ' ' . $testTime, $appTimezone);
        $endAt = $startAt->copy()->addHour();

        // Buat jadwal untuk busyTeknisi
        InspectionSchedule::create([
            'apar_id' => $this->apar->id,
            'assigned_user_id' => $busyTeknisi->id,
            'start_at' => $startAt,
            'end_at' => $endAt,
            'frequency' => 'once',
            'is_active' => true,
            'is_completed' => false,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->supervisorToken)
            ->getJson("/api/schedules/available-technicians?schedule_date={$testDate}&schedule_time={$testTime}&only_available=true");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $data = collect($response->json('data'));

        // Pastikan Teknisi sibuk TIDAK muncul sama sekali dalam daftar hasil
        $this->assertNull($data->firstWhere('id', $busyTeknisi->id));

        // Pastikan Teknisi free muncul dalam daftar hasil
        $freeItem = $data->firstWhere('id', $freeTeknisi->id);
        $this->assertNotNull($freeItem);
        $this->assertTrue($freeItem['is_available']);
    }
}


