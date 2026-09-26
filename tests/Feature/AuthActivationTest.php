<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

pest()->use(RefreshDatabase::class);

beforeEach(function () {
    $this->activationToken = Str::random(40);
    $this->user = User::factory()->create([
        'name' => 'Ikhsanul Arifin',
        'email' => 'lubis163774@gmail.com',
        'is_active' => false,
        'email_verified_at' => null,
        'activation_token' => $this->activationToken,
        'activation_expires_at' => now()->addHours(24),
    ]);
});

it('successfully activates account and returns user details', function () {
    $response = $this->postJson('/api/activate', [
        'token' => $this->activationToken,
        'password' => 'newPassword123!',
        'password_confirmation' => 'newPassword123!',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'message' => 'Akun berhasil diaktivasi. Silakan login.',
            'user' => [
                'name' => 'Ikhsanul Arifin',
                'email' => 'lubis163774@gmail.com',
            ],
        ]);

    $this->user->refresh();
    expect($this->user->is_active)->toBeTrue()
        ->and($this->user->email_verified_at)->not->toBeNull()
        ->and(Hash::check('newPassword123!', $this->user->password))->toBeTrue();
});

it('rejects activation when confirmation does not match', function () {
    $response = $this->postJson('/api/activate', [
        'token' => $this->activationToken,
        'password' => 'newPassword123!',
        'password_confirmation' => 'mismatch123!',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['password']);
});

it('rejects activation with invalid token', function () {
    $response = $this->postJson('/api/activate', [
        'token' => 'invalid-token-string',
        'password' => 'newPassword123!',
        'password_confirmation' => 'newPassword123!',
    ]);

    $response->assertStatus(400)
        ->assertJson(['message' => 'Token aktivasi tidak valid.']);
});

it('rejects activation when token has expired', function () {
    $this->user->update([
        'activation_expires_at' => now()->subHour(),
    ]);

    $response = $this->postJson('/api/activate', [
        'token' => $this->activationToken,
        'password' => 'newPassword123!',
        'password_confirmation' => 'newPassword123!',
    ]);

    $response->assertStatus(400)
        ->assertJson(['message' => 'Token aktivasi sudah kadaluarsa. Silakan hubungi admin untuk mengirim ulang email aktivasi.']);
});
