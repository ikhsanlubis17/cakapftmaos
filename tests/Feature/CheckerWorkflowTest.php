<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Apar;
use App\Models\Inspection;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use Laravel\Sanctum\Sanctum;

class CheckerWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected $teknisi;
    protected $checker;
    protected $supervisor;
    protected $admin;
    protected $apar;

    protected function setUp(): void
    {
        parent::setUp();

        $this->teknisi = User::factory()->create(['role' => 'teknisi']);
        $this->checker = User::factory()->create(['role' => 'checker']);
        $this->supervisor = User::factory()->create(['role' => 'supervisor']);
        $this->admin = User::factory()->create(['role' => 'admin']);

        $this->apar = Apar::factory()->create();
    }

    public function test_teknisi_submission_goes_to_pending_checker()
    {
        $this->actingAs($this->teknisi, 'api');

        $this->apar->update(['qr_code' => 'TEST-QR-1']);

        // Create a schedule for today so validation passes
        \App\Models\InspectionSchedule::forceCreate([
            'apar_id' => $this->apar->id,
            'assigned_user_id' => $this->teknisi->id,
            'start_at' => now()->startOfDay(),
            'end_at' => now()->endOfDay(),
            'is_active' => true,
            'is_completed' => false,
        ]);

        $payload = [
            'apar_id' => $this->apar->id,
            'apar_qrCode' => 'TEST-QR-1',
            'condition' => 'good',
            'pressure' => 15,
            'physical_condition' => 'good',
            'notes' => 'Test inspection',
            'photo' => \Illuminate\Http\UploadedFile::fake()->image('apar.jpg'),
            'selfie' => \Illuminate\Http\UploadedFile::fake()->image('selfie.jpg'),
        ];

        // Use post for file upload
        $response = $this->post('/api/inspections', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('inspections', [
            'apar_id' => $this->apar->id,
            'inspection_status' => 'pending_checker',
        ]);
    }

    public function test_checker_can_view_pending_inspections()
    {
        $inspection = Inspection::factory()->create([
            'user_id' => $this->teknisi->id,
            'apar_id' => $this->apar->id,
            'inspection_status' => 'pending_checker',
        ]);

        $this->actingAs($this->checker, 'api');

        $response = $this->getJson('/api/inspections/review/pending');

        $response->assertStatus(200)
            ->assertJsonFragment(['id' => $inspection->id]);
    }

    public function test_checker_can_approve_inspection()
    {
        $inspection = Inspection::factory()->create([
            'user_id' => $this->teknisi->id,
            'apar_id' => $this->apar->id,
            'inspection_status' => 'pending_checker',
        ]);

        $this->actingAs($this->checker, 'api');

        $response = $this->postJson("/api/inspections/{$inspection->id}/approve", [
            'notes' => 'Checker approval note',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('inspections', [
            'id' => $inspection->id,
            'inspection_status' => 'approved_by_checker',
            'checker_id' => $this->checker->id,
            'checker_notes' => 'Checker approval note',
        ]);
    }

    public function test_checker_can_reject_inspection()
    {
        $inspection = Inspection::factory()->create([
            'user_id' => $this->teknisi->id,
            'apar_id' => $this->apar->id,
            'inspection_status' => 'pending_checker',
        ]);

        $this->actingAs($this->checker, 'api');

        $response = $this->postJson("/api/inspections/{$inspection->id}/reject", [
            'notes' => 'Checker rejection note',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('inspections', [
            'id' => $inspection->id,
            'inspection_status' => 'rejected_by_checker',
            'checker_id' => $this->checker->id,
            'checker_notes' => 'Checker rejection note',
        ]);
    }

    public function test_supervisor_sees_approved_by_checker_inspections()
    {
        $inspection = Inspection::factory()->create([
            'user_id' => $this->teknisi->id,
            'apar_id' => $this->apar->id,
            'inspection_status' => 'approved_by_checker',
        ]);

        $this->actingAs($this->supervisor, 'api');

        $response = $this->getJson('/api/inspections/review/pending');

        $response->assertStatus(200)
            ->assertJsonFragment(['id' => $inspection->id]);
    }

    public function test_supervisor_does_not_see_pending_checker_inspections()
    {
        $inspection = Inspection::factory()->create([
            'user_id' => $this->teknisi->id,
            'apar_id' => $this->apar->id,
            'inspection_status' => 'pending_checker',
        ]);

        $this->actingAs($this->supervisor, 'api');

        $response = $this->getJson('/api/inspections/review/pending');

        $response->assertStatus(200)
            ->assertJsonMissing(['id' => $inspection->id]);
    }

    public function test_admin_sees_rejected_by_checker_inspections()
    {
        $inspection = Inspection::factory()->create([
            'user_id' => $this->teknisi->id,
            'apar_id' => $this->apar->id,
            'inspection_status' => 'rejected_by_checker',
        ]);

        $this->actingAs($this->admin, 'api');

        $response = $this->getJson('/api/inspections/review/pending');

        $response->assertStatus(200)
            ->assertJsonFragment(['id' => $inspection->id]);
    }

    public function test_checker_submission_goes_to_approved_by_checker()
    {
        $this->actingAs($this->checker, 'api');

        $this->apar->update(['qr_code' => 'TEST-QR-CHECKER-1']);

        $payload = [
            'apar_id' => $this->apar->id,
            'apar_qrCode' => 'TEST-QR-CHECKER-1',
            'condition' => 'good',
            'pressure' => 15,
            'physical_condition' => 'good',
            'notes' => 'Checker self inspection',
            'photo' => \Illuminate\Http\UploadedFile::fake()->image('apar.jpg'),
            'selfie' => \Illuminate\Http\UploadedFile::fake()->image('selfie.jpg'),
        ];

        $response = $this->post('/api/inspections', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('inspections', [
            'apar_id' => $this->apar->id,
            'inspection_status' => 'approved_by_checker',
        ]);
    }

    public function test_admin_can_create_checker_user()
    {
        $this->actingAs($this->admin, 'api');

        $payload = [
            'name' => 'New Checker',
            'email' => 'newchecker@example.com',
            'role' => 'checker',
            'phone' => '081234567899',
            'admin_password' => 'password', // Assuming factory sets password to 'password'
        ];

        // Need to ensure admin has correct password for validation
        // The factory sets password hash to 'password'
        // But UserController checks Hash::check($request->admin_password, $admin->password)
        
        $response = $this->postJson('/api/users', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('users', [
            'email' => 'newchecker@example.com',
            'role' => 'checker',
        ]);
    }
}
