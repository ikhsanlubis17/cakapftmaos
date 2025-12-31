<?php

use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use App\Models\Apar;
use App\Models\DamageCategory;
use App\Models\User;

pest()->use(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');

    // Create a technician
    $this->user = User::factory()->create(['role' => 'teknisi']);
    $this->token = JWTAuth::fromUser($this->user);

    // Create an APAR
    $this->apar = Apar::create([
        'serial_number' => 'SN-TEST-VAL',
        'qr_code' => 'QR-TEST-VAL',
        'location_type' => 'statis',
        'location_name' => 'Validation Test Loc',
        'status' => 'active',
        'capacity' => 1,
        'manufactured_date' => now()->subYear(),
        'expired_at' => now()->addYear(),
    ]);

    // Create Damage Category
    $this->damageCategory = DamageCategory::create([
        'name' => 'Korosi',
        'type' => 'general',
        'severity' => 'medium',
        'description' => 'Karat pada tabung',
    ]);
});


it('allows submission with condition good and no damage categories', function () {
    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
        ->postJson('/api/inspections', [
            'apar_id' => $this->apar->id,
            'apar_qrCode' => $this->apar->qr_code,
            'condition' => 'good',
            'notes' => 'All good',
            'photo' => UploadedFile::fake()->image('photo.jpg'),
            'selfie' => UploadedFile::fake()->image('selfie.jpg'),
        ]);

    $response->assertStatus(200);
});

it('validation fails when condition is damaged but damage_categories is missing', function () {
    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
        ->postJson('/api/inspections', [
            'apar_id' => $this->apar->id,
            'apar_qrCode' => $this->apar->qr_code,
            'condition' => 'damaged',
            'notes' => 'Damaged but no details',
            'photo' => UploadedFile::fake()->image('photo.jpg'),
            'selfie' => UploadedFile::fake()->image('selfie.jpg'),
            // damage_categories missing
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['damage_categories']);
});

it('validation fails when condition is damaged but damage_categories is empty', function () {
    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
        ->postJson('/api/inspections', [
            'apar_id' => $this->apar->id,
            'apar_qrCode' => $this->apar->qr_code,
            'condition' => 'damaged',
            'notes' => 'Damaged but array empty',
            'photo' => UploadedFile::fake()->image('photo.jpg'),
            'selfie' => UploadedFile::fake()->image('selfie.jpg'),
            'damage_categories' => [],
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['damage_categories']);
});

it('allows submission when condition is damaged and damage_categories is provided', function () {
    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
        ->postJson('/api/inspections', [
            'apar_id' => $this->apar->id,
            'apar_qrCode' => $this->apar->qr_code,
            'condition' => 'damaged',
            'notes' => 'Damaged with details',
            'photo' => UploadedFile::fake()->image('photo.jpg'),
            'selfie' => UploadedFile::fake()->image('selfie.jpg'),
            'damage_categories' => [
                [
                    'category_id' => $this->damageCategory->id,
                    'notes' => 'Rusty',
                    'severity' => 'medium',
                    'damage_photo' => UploadedFile::fake()->image('damage.jpg'),
                ]
            ],
        ]);

    // Assuming the response structure or success message
    $response->assertStatus(200);
});
