import { test, expect } from './fixtures';

/**
 * JOURNEY 5: Alur Perbaikan & Reinspeksi Tabung (CUJ-05)
 * Supervisor & Teknisi: Pemantauan tiket perbaikan, filter status,
 * pembukaan modal detail, dan portal tugas perbaikan personal.
 */
test.describe('CUJ-05: Repair Lifecycle & Approval Workflow', () => {

  test('CUJ-05A (Happy Path): Supervisor dapat memantau permohonan perbaikan dengan filter status', async ({ supervisorPage }) => {
    await supervisorPage.goto('/repair-approvals');

    // Verifikasi header halaman
    await expect(supervisorPage.getByRole('heading', { name: /Persetujuan Perbaikan/i })).toBeVisible();

    // Verifikasi kartu counter statistik status perbaikan
    await expect(supervisorPage.getByText('Disetujui', { exact: true }).first()).toBeVisible();
    await expect(supervisorPage.getByText('Ditolak', { exact: true }).first()).toBeVisible();

    // Uji perubahan filter status
    const filterSelect = supervisorPage.locator('select').first();
    await expect(filterSelect).toBeVisible();
    await filterSelect.selectOption('pending');

    // Pastikan filter diterapkan tanpa crash
    await expect(supervisorPage).toHaveURL(/.*repair-approvals/);
  });

  test('CUJ-05B (Empty State): Tampilan empty state saat tidak ada permohonan dengan status tertentu', async ({ supervisorPage }) => {
    // Mock response permohonan kosong
    await supervisorPage.route('**/api/repair-approvals*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    await supervisorPage.goto('/repair-approvals');

    // Verifikasi empty state muncul
    await expect(supervisorPage.getByTestId('empty-state')).toBeVisible();
    await expect(supervisorPage.getByTestId('empty-state')).toContainText(/Tidak Ada Data Persetujuan/i);
  });

  test('CUJ-05C (Happy Path): Teknisi dapat mengakses portal tugas perbaikan personal', async ({ teknisiPage }) => {
    await teknisiPage.goto('/my-repairs');

    // Verifikasi halaman tugas perbaikan teknisi terbuka
    await expect(teknisiPage).toHaveURL(/.*my-repairs/);

    // Navigasi atau konten utama tetap utuh dan responsive
    await expect(teknisiPage.locator('main')).toBeVisible();
  });

});
