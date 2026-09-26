<?php

namespace Tests\Feature;

use App\Models\Apar;
use App\Models\AparType;
use App\Models\Inspection;
use App\Models\InspectionSchedule;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class InspectionIdentifierTest extends TestCase
{
    use RefreshDatabase;

    protected User $teknisi;
    protected User $admin;
    protected Apar $apar;
    protected InspectionSchedule $schedule;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');

        Carbon::setTestNow(Carbon::parse('2026-09-23 09:00:00', 'Asia/Jakarta'));

        $aparType = AparType::create(['name' => 'Powder', 'is_active' => true]);

        $this->apar = Apar::create([
            'serial_number' => 'APAR-SN-001',
            'qr_code' => 'APAR-QR-001',
            'location_type' => 'statis',
            'location_name' => 'Bangsal Pengisian BBM',
            'latitude' => -7.42000000,
            'longitude' => 109.10000000,
            'valid_radius' => 50,
            'apar_type_id' => $aparType->id,
            'capacity' => 6,
            'manufactured_date' => Carbon::now()->subYear(),
            'expired_at' => Carbon::now()->addYear(),
            'status' => 'active',
        ]);

        $this->teknisi = User::factory()->create(['role' => 'teknisi']);
        $this->admin = User::factory()->create(['role' => 'admin']);

        // Jadwal aktif untuk teknisi hari ini
        $this->schedule = InspectionSchedule::create([
            'apar_id' => $this->apar->id,
            'assigned_user_id' => $this->teknisi->id,
            'start_at' => Carbon::now('Asia/Jakarta')->startOfDay()->addHours(8),
            'end_at' => Carbon::now('Asia/Jakarta')->startOfDay()->addHours(16),
            'frequency' => 'monthly',
            'is_active' => true,
            'is_completed' => false,
            'notes' => 'Jadwal inspeksi bulanan',
        ]);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_can_validate_inspection_by_qr_code()
    {
        $this->actingAs($this->teknisi, 'api');

        $response = $this->postJson('/api/inspections/validate', [
            'identifier' => 'APAR-QR-001',
            'method' => 'qr_scan',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'valid' => true,
                'apar' => [
                    'id' => $this->apar->id,
                    'serial_number' => 'APAR-SN-001',
                    'qr_code' => 'APAR-QR-001',
                ],
            ]);
    }

    public function test_can_validate_inspection_by_manual_serial_number()
    {
        $this->actingAs($this->teknisi, 'api');

        $response = $this->postJson('/api/inspections/validate', [
            'identifier' => 'APAR-SN-001',
            'method' => 'manual_serial',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'valid' => true,
                'apar' => [
                    'id' => $this->apar->id,
                    'serial_number' => 'APAR-SN-001',
                    'qr_code' => 'APAR-QR-001',
                ],
            ]);
    }

    public function test_backward_compatibility_apar_qr_code_field()
    {
        $this->actingAs($this->teknisi, 'api');

        $response = $this->postJson('/api/inspections/validate', [
            'apar_qrCode' => 'APAR-QR-001',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'valid' => true,
                'apar' => [
                    'id' => $this->apar->id,
                ],
            ]);
    }

    public function test_validation_fails_for_non_existent_identifier()
    {
        $this->actingAs($this->teknisi, 'api');

        $response = $this->postJson('/api/inspections/validate', [
            'identifier' => 'NON-EXISTENT-APAR',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'valid' => false,
            ]);
    }

    public function test_validation_requires_identifier()
    {
        $this->actingAs($this->teknisi, 'api');

        $response = $this->postJson('/api/inspections/validate', []);

        $response->assertStatus(422)
            ->assertJson([
                'valid' => false,
            ]);
    }

    public function test_inspection_submission_stores_identification_method_manual_serial()
    {
        $this->actingAs($this->teknisi, 'api');

        $response = $this->postJson('/api/inspections', [
            'apar_id' => $this->apar->id,
            'apar_qrCode' => $this->apar->qr_code,
            'condition' => 'good',
            'notes' => 'Inspeksi dengan input nomor seri manual karena stiker kotor',
            'identification_method' => 'manual_serial',
            'photo' => UploadedFile::fake()->image('photo.jpg'),
            'selfie' => UploadedFile::fake()->image('selfie.jpg'),
            'lat' => -7.42000000,
            'lng' => 109.10000000,
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('inspections', [
            'apar_id' => $this->apar->id,
            'identification_method' => 'manual_serial',
            'condition' => 'good',
        ]);
    }

    public function test_inspection_submission_defaults_to_qr_scan_when_method_omitted()
    {
        $this->actingAs($this->teknisi, 'api');

        $response = $this->postJson('/api/inspections', [
            'apar_id' => $this->apar->id,
            'apar_qrCode' => $this->apar->qr_code,
            'condition' => 'good',
            'notes' => 'Inspeksi standar via QR',
            'photo' => UploadedFile::fake()->image('photo.jpg'),
            'selfie' => UploadedFile::fake()->image('selfie.jpg'),
            'lat' => -7.42000000,
            'lng' => 109.10000000,
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('inspections', [
            'apar_id' => $this->apar->id,
            'identification_method' => 'qr_scan',
        ]);
    }
}
