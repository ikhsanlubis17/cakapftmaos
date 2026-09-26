import { test, expect } from './fixtures';

/**
 * JOURNEY 3: Monitoring Dasbor & Metrik Kesiapan (CUJ-03)
 * Portal Supervisor: Pemantauan kartu metrik KPI, grafik kesiapan,
 * dan penanganan kegagalan network/API yang anggun.
 */
test.describe('CUJ-03: Supervisor Dashboard & Metrics Monitoring', () => {

  test('CUJ-03A (Happy Path): Dashboard memuat widget metrik kesiapan operasional', async ({ supervisorPage }) => {
    await supervisorPage.goto('/');

    // Verifikasi header selamat datang atau branding dashboard
    await expect(supervisorPage.getByRole('heading', { name: /Dashboard|CAKAP/i }).first()).toBeVisible();

    // Verifikasi widget KPI utama ada dan memuat data
    // Total APAR, Siap Pakai, atau status tabung
    const statCards = supervisorPage.locator('.bg-white.border');
    await expect(statCards.first()).toBeVisible();

    // Pastikan tidak ada teks error crash
    await expect(supervisorPage.locator('text=ChunkLoadError')).not.toBeVisible();
  });

  test('CUJ-03B (Failure State): Penanganan anggun saat API statistik mengalami kegagalan (500)', async ({ supervisorPage }) => {
    // Intercept endpoint statistik dan kembalikan response error server 500
    await supervisorPage.route('**/api/stats', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error pada layanan analitik' }),
      });
    });

    await supervisorPage.goto('/');

    // Halaman tidak boleh mengalami crash total / blank screen
    // Kontainer layout tetap utuh
    await expect(supervisorPage.locator('main')).toBeVisible();
  });

});
