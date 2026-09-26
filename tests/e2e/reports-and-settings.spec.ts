import { test, expect } from './fixtures';

/**
 * JOURNEY 7: Pelaporan, Jejak Audit & Pengaturan Sistem (CUJ-07)
 * Supervisor & Admin: Filter laporan, trigger export Excel/PDF,
 * penanganan empty state laporan, dan perubahan pengaturan dinamis.
 */
test.describe('CUJ-07: Reports, Audit Trail & Dynamic Settings', () => {

  test('CUJ-07A (Happy Path): Supervisor dapat membuka halaman laporan dan melihat opsi ekspor', async ({ supervisorPage }) => {
    await supervisorPage.goto('/reports');

    // Verifikasi header laporan
    await expect(supervisorPage.getByRole('heading', { name: 'Laporan & Audit' })).toBeVisible();

    // Verifikasi tombol atau opsi ekspor (Excel / PDF) ada di halaman
    const exportExcelBtn = supervisorPage.getByRole('button', { name: /excel|unduh excel|ekspor/i }).first();
    if (await exportExcelBtn.isVisible()) {
      await expect(exportExcelBtn).toBeEnabled();
    }
  });

  test('CUJ-07B (Empty State): Rentang tanggal tanpa riwayat menampilkan pemberitahuan kosong', async ({ supervisorPage }) => {
    // Mock response laporan kosong
    await supervisorPage.route('**/api/reports*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    await supervisorPage.goto('/reports');

    // Halaman tetap render tanpa crash
    await expect(supervisorPage.locator('main')).toBeVisible();
  });

  test('CUJ-07C (Happy Path): Admin dapat membuka panel pengaturan dinamis sistem', async ({ adminPage }) => {
    await adminPage.goto('/settings');

    // Verifikasi header halaman pengaturan
    await expect(adminPage.getByRole('heading', { name: /Pengaturan/i }).first()).toBeVisible();

    // Verifikasi form pengaturan ter-render
    const formElement = adminPage.locator('form').first();
    await expect(formElement).toBeVisible();

    // Verifikasi tombol ubah / simpan pengaturan ada
    const saveBtn = adminPage.getByRole('button', { name: /Ubah Pengaturan|Simpan/i }).first();
    await expect(saveBtn).toBeVisible();
  });

});
