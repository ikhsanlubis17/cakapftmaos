import { test, expect } from '@playwright/test';

/**
 * JOURNEY 1: Autentikasi, Guard Rute & Session Lifecycle (CUJ-01)
 * Mencakup Happy Path multi-role login, kredensial salah, validasi form,
 * proteksi rute unauthenticated, dan pemulihan saat session expired.
 */
test.describe('CUJ-01: Authentication & Session Lifecycle', () => {

  test('CUJ-01A (Happy Path): Admin dapat login dan dialihkan ke dashboard', async ({ page }) => {
    await page.goto('/login');

    // Pastikan berada di halaman login
    await expect(page.getByRole('heading', { name: /Masuk ke Akun Anda/i })).toBeVisible();

    // Isi formulir login admin
    await page.getByTestId('login-email-input').fill('admin@cakap-pertamina.com');
    await page.getByTestId('login-password-input').fill('password123');
    await page.getByTestId('login-submit-btn').click();

    // Verifikasi toast sukses muncul dan redirect ke dashboard
    await expect(page.getByRole('alert')).toContainText(/Login berhasil/i);
    await expect(page).toHaveURL('/');

    // Verifikasi token tersimpan di localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
  });

  test('CUJ-01A (Happy Path): Teknisi dapat login dan mengakses antarmuka lapangan', async ({ page }) => {
    await page.goto('/login');

    await page.getByTestId('login-email-input').fill('teknisi1@cakap-pertamina.com');
    await page.getByTestId('login-password-input').fill('password123');
    await page.getByTestId('login-submit-btn').click();

    await expect(page.getByRole('alert')).toContainText(/Login berhasil/i);
    await expect(page).toHaveURL('/');
  });

  test('CUJ-01B (Failure State): Login gagal saat kredensial salah (401)', async ({ page }) => {
    await page.goto('/login');

    await page.getByTestId('login-email-input').fill('admin@cakap-pertamina.com');
    await page.getByTestId('login-password-input').fill('password_salah_123');
    await page.getByTestId('login-submit-btn').click();

    // Verifikasi notifikasi error muncul
    const toastAlert = page.getByRole('alert');
    await expect(toastAlert).toBeVisible();
    await expect(toastAlert).toContainText(/Email atau password salah|Gagal melakukan login|Kredensial tidak valid/i);

    // Tetap berada di halaman login
    await expect(page).toHaveURL(/.*login/);
  });

  test('CUJ-01B (Failure State): Form login menolak submit saat email/password kosong', async ({ page }) => {
    await page.goto('/login');

    // Submit tanpa mengisi apa pun
    await page.getByTestId('login-submit-btn').click();

    // HTML5 validation mencegah navigasi
    await expect(page).toHaveURL(/.*login/);
  });

  test('CUJ-01C (Failure State): Tamu unauthenticated dicegah mengakses rute internal', async ({ page }) => {
    // Mencoba mengakses rute master APAR tanpa login
    await page.goto('/apar');

    // Sistem wajib me-redirect ke /welcome atau /login
    await expect(page).toHaveURL(/\/welcome|\/login/);
  });

  test('CUJ-01C (Failure State): Token invalid / kedaluwarsa otomatis memicu logout', async ({ page }) => {
    // Kunjungi halaman welcome dan simpan token kedaluwarsa palsu
    await page.goto('/welcome');
    await page.evaluate(() => {
      localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.expired');
    });

    // Coba buka halaman profile
    await page.goto('/profile');

    // Saat request API /api/user mengembalikan 401, interceptor harus membersihkan token
    await expect(page).toHaveURL(/\/welcome|\/login/);
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeFalsy();
  });

});
