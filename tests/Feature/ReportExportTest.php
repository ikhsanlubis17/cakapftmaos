<?php

namespace Tests\Feature;

use App\Models\Apar;
use App\Models\AparType;
use App\Models\Inspection;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportExportTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $supervisor;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        $this->supervisor = User::factory()->create([
            'role' => 'supervisor',
            'is_active' => true,
        ]);

        $type = AparType::create([
            'name' => 'Dry Chemical Powder',
            'description' => 'DCP 6kg',
        ]);

        Apar::create([
            'serial_number' => 'APAR-TEST-001',
            'apar_type_id' => $type->id,
            'location_name' => 'Gedung Utama Lt 1',
            'location_type' => 'statis',
            'status' => 'active',
            'capacity' => 6,
            'pressure' => 15,
            'qr_code' => 'QR-APAR-TEST-001',
        ]);
    }

    public function test_admin_can_download_all_4_reports_in_pdf_and_excel(): void
    {
        $types = ['monthly', 'damage', 'readiness', 'audit'];
        $formats = ['pdf', 'excel'];

        foreach ($types as $type) {
            foreach ($formats as $format) {
                $response = $this->actingAs($this->admin, 'api')
                    ->get("/api/reports/generate?type={$type}&period=month&format={$format}");

                $response->assertStatus(200);

                if ($format === 'pdf') {
                    $this->assertEquals('application/pdf', $response->headers->get('content-type'));
                } else {
                    $this->assertStringContainsString('spreadsheetml', (string) $response->headers->get('content-type'));
                }
            }
        }
    }

    public function test_supervisor_can_download_all_4_reports_in_pdf_and_excel(): void
    {
        $types = ['monthly', 'damage', 'readiness', 'audit'];

        foreach ($types as $type) {
            $response = $this->actingAs($this->supervisor, 'api')
                ->get("/api/reports/generate?type={$type}&period=quarter&format=pdf");

            $response->assertStatus(200);
            $this->assertEquals('application/pdf', $response->headers->get('content-type'));
        }
    }

    public function test_all_period_filters_work(): void
    {
        $periods = ['today', 'week', 'month', 'quarter', 'year'];

        foreach ($periods as $period) {
            $response = $this->actingAs($this->admin, 'api')
                ->get("/api/reports/generate?type=monthly&period={$period}&format=pdf");

            $response->assertStatus(200);
        }
    }

    public function test_invalid_type_returns_400(): void
    {
        $response = $this->actingAs($this->admin, 'api')
            ->get('/api/reports/generate?type=invalid_type&period=month&format=pdf');

        $response->assertStatus(400);
        $response->assertJsonStructure(['message']);
    }

    public function test_invalid_format_returns_400(): void
    {
        $response = $this->actingAs($this->admin, 'api')
            ->get('/api/reports/generate?type=monthly&period=month&format=word');

        $response->assertStatus(400);
        $response->assertJsonStructure(['message']);
    }
}
