<?php

namespace Tests\Feature;

use App\Models\Apar;
use App\Models\AparType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AparQrCodeTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_get_qr_code_for_apar()
    {
        $aparType = AparType::create(['name' => 'Powder', 'is_active' => true]);
        $apar = Apar::factory()->create([
            'status' => 'active',
            'apar_type_id' => $aparType->id,
            'qr_code' => 'APAR-TEST-QR-001',
        ]);

        $response = $this->getJson("/api/apar/{$apar->id}/qr-code");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'qr_code',
                'mime_type',
                'svg',
            ]);

        $this->assertEquals('image/svg+xml', $response->json('mime_type'));
        $this->assertNotEmpty($response->json('qr_code'));
        $this->assertStringContainsString('<svg', base64_decode($response->json('qr_code')));
    }

    public function test_admin_can_download_qr_pdf()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $aparType = AparType::create(['name' => 'CO2', 'is_active' => true]);
        $apar = Apar::factory()->create([
            'status' => 'active',
            'apar_type_id' => $aparType->id,
            'qr_code' => 'APAR-TEST-QR-PDF-001',
        ]);

        $this->actingAs($admin, 'api');

        $response = $this->postJson('/api/apar/download-qr-pdf', [
            'apars' => [
                ['id' => $apar->id],
            ],
        ]);

        $response->assertStatus(200);
        $this->assertEquals('application/pdf', $response->headers->get('Content-Type'));
    }

    public function test_admin_can_download_qr_pdf_with_format_qr_only()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $aparType = AparType::create(['name' => 'Powder', 'is_active' => true]);
        $apar = Apar::factory()->create([
            'status' => 'active',
            'apar_type_id' => $aparType->id,
            'qr_code' => 'APAR-TEST-QR-ONLY',
        ]);

        $this->actingAs($admin, 'api');

        $response = $this->postJson('/api/apar/download-qr-pdf', [
            'apars' => [
                ['id' => $apar->id],
            ],
            'print_format' => 'qr_only',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('application/pdf', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('qr-code-apar-', $response->headers->get('Content-Disposition') ?? '');
    }

    public function test_admin_can_download_qr_pdf_with_format_serial_only()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $aparType = AparType::create(['name' => 'Foam', 'is_active' => true]);
        $apar = Apar::factory()->create([
            'status' => 'active',
            'apar_type_id' => $aparType->id,
            'serial_number' => 'APAR-TEST-SN-ONLY',
            'qr_code' => 'APAR-TEST-QR-002',
        ]);

        $this->actingAs($admin, 'api');

        $response = $this->postJson('/api/apar/download-qr-pdf', [
            'apars' => [
                ['id' => $apar->id],
            ],
            'print_format' => 'serial_only',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('application/pdf', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('nomor-seri-apar-', $response->headers->get('Content-Disposition') ?? '');
    }

    public function test_download_qr_pdf_rejects_invalid_print_format()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $apar = Apar::factory()->create([
            'status' => 'active',
        ]);

        $this->actingAs($admin, 'api');

        $response = $this->postJson('/api/apar/download-qr-pdf', [
            'apars' => [
                ['id' => $apar->id],
            ],
            'print_format' => 'invalid_format',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['print_format']);
    }

    public function test_blade_template_renders_4_per_row_and_sequential_combination()
    {
        $aparType = AparType::create(['name' => 'CO2', 'is_active' => true]);
        $apars = collect();
        for ($i = 1; $i <= 7; $i++) {
            $apars->push((object)[
                'id' => $i,
                'serial_number' => "APAR-SN-00{$i}",
                'qr_code' => "APAR-QR-00{$i}",
                'qr_code_image' => base64_encode('<svg></svg>'),
                'capacity' => 5,
                'location_name' => "Lokasi {$i}",
                'aparType' => $aparType,
            ]);
        }

        // Test format BOTH
        $viewBoth = view('pdf.apar-qr-codes', [
            'apars' => $apars,
            'printFormat' => 'both',
            'generatedAt' => '23/09/2026 17:00:00',
            'totalApars' => 7,
        ])->render();

        $this->assertStringContainsString('BAGIAN 1: KARTU QR CODE APAR', $viewBoth);
        $this->assertStringContainsString('BAGIAN 2: LABEL NOMOR SERI APAR', $viewBoth);
        $this->assertStringContainsString('grid-table', $viewBoth);
        $this->assertStringContainsString('grid-col-empty', $viewBoth);
        $this->assertStringContainsString('page-break', $viewBoth);
        $this->assertStringContainsString('APAR-SN-001', $viewBoth);

        // Test format QR_ONLY
        $viewQrOnly = view('pdf.apar-qr-codes', [
            'apars' => $apars,
            'printFormat' => 'qr_only',
            'generatedAt' => '23/09/2026 17:00:00',
            'totalApars' => 7,
        ])->render();

        $this->assertStringContainsString('KARTU QR CODE APAR', $viewQrOnly);
        $this->assertStringContainsString('apar-card', $viewQrOnly);
        $this->assertStringContainsString('APAR-SN-001', $viewQrOnly);
        $this->assertStringNotContainsString('BAGIAN 2: LABEL NOMOR SERI APAR', $viewQrOnly);

        // Test format SERIAL_ONLY
        $viewSerialOnly = view('pdf.apar-qr-codes', [
            'apars' => $apars,
            'printFormat' => 'serial_only',
            'generatedAt' => '23/09/2026 17:00:00',
            'totalApars' => 7,
        ])->render();

        $this->assertStringContainsString('LABEL NOMOR SERI APAR', $viewSerialOnly);
        $this->assertStringContainsString('apar-card-serial-only', $viewSerialOnly);
        $this->assertStringContainsString('APAR-SN-001', $viewSerialOnly);
        $this->assertStringNotContainsString('BAGIAN 1: KARTU QR CODE APAR', $viewSerialOnly);
    }
}

