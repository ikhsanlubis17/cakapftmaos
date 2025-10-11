<?php

use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

pest()->use(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');

    Carbon::setTestNow(Carbon::parse('2025-01-01 08:00:00', 'UTC'));

    // Create a simple APAR (mobile so location validation won't block)
    $this->apar = \App\Models\Apar::create([
        'serial_number' => 'SN-TEST-1',
        'qr_code' => 'QR-TEST-1',
        'location_type' => 'mobile',
        'location_name' => 'Unit Test Location',
        'latitude' => null,
        'longitude' => null,
        'valid_radius' => 50,
        'apar_type_id' => null,
        'capacity' => 1,
        'manufactured_date' => Carbon::now('UTC')->subYear(),
        'expired_at' => Carbon::now('UTC')->addYear(),
        'status' => 'active',
    ]);

    // Create a schedule for tomorrow (so 'now' is outside the allowed window)
    $startAt = Carbon::now('UTC')->addDay()->setTime(2, 0);
    $endAt = $startAt->copy()->addHour();

    $this->schedule = \App\Models\InspectionSchedule::create([
        'apar_id' => $this->apar->id,
        'assigned_user_id' => null,
        'start_at' => $startAt,
        'end_at' => $endAt,
        'frequency' => 'weekly',
        'is_active' => true,
        'is_completed' => false,
        'notes' => 'Schedule for tests',
    ]);
});

afterEach(function () {
    Carbon::setTestNow();
});

it('prevents teknisi from creating inspection outside schedule window', function () {
    $teknisi = \App\Models\User::factory()->create([ 'role' => 'teknisi' ]);
    // assign schedule to teknisi explicitly
    $this->schedule->update(['assigned_user_id' => $teknisi->id]);

    $token = JWTAuth::fromUser($teknisi);

    $response = $this->withHeader('Authorization', 'Bearer ' . $token)
        ->postJson('/api/inspections', [
            'apar_id' => $this->apar->id,
            'apar_qrCode' => $this->apar->qr_code,
            'condition' => 'good',
            'notes' => 'Testing outside schedule',
            'photo' => UploadedFile::fake()->image('photo.jpg'),
            'selfie' => UploadedFile::fake()->image('selfie.jpg'),
        ]);

    $response->assertStatus(422)
        ->assertJson(['valid' => false]);
});

it('allows supervisor to create inspection regardless of schedule/time', function () {
    $supervisor = \App\Models\User::factory()->create([ 'role' => 'supervisor' ]);
    $token = JWTAuth::fromUser($supervisor);

    $response = $this->withHeader('Authorization', 'Bearer ' . $token)
        ->postJson('/api/inspections', [
            'apar_id' => $this->apar->id,
            'apar_qrCode' => $this->apar->qr_code,
            'condition' => 'good',
            'notes' => 'Supervisor override test',
            'photo' => UploadedFile::fake()->image('photo.jpg'),
            'selfie' => UploadedFile::fake()->image('selfie.jpg'),
        ]);

    $response->assertStatus(201)
        ->assertJsonStructure(['message', 'inspection']);
});

it('allows admin to create inspection regardless of schedule/time', function () {
    $admin = \App\Models\User::factory()->create([ 'role' => 'admin' ]);
    $token = JWTAuth::fromUser($admin);

    $response = $this->withHeader('Authorization', 'Bearer ' . $token)
        ->postJson('/api/inspections', [
            'apar_id' => $this->apar->id,
            'apar_qrCode' => $this->apar->qr_code,
            'condition' => 'good',
            'notes' => 'Admin override test',
            'photo' => UploadedFile::fake()->image('photo.jpg'),
            'selfie' => UploadedFile::fake()->image('selfie.jpg'),
        ]);

    $response->assertStatus(201)
        ->assertJsonStructure(['message', 'inspection']);
});
