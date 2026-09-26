import { test, expect } from './fixtures';

/**
 * JOURNEY 4: Review Inspeksi & Approval Temuan Kerusakan (CUJ-04)
 * Portal Supervisor: Antrean review hasil inspeksi teknisi,
 * dialog persetujuan/penolakan, dan validasi alasan penolakan.
 */
test.describe('CUJ-04: Inspection Review & Damage Approval', () => {

  test('CUJ-04A (Happy Path): Supervisor dapat membuka halaman antrean review inspeksi', async ({ supervisorPage }) => {
    await supervisorPage.goto('/inspections/review');

    // Verifikasi header halaman
    await expect(supervisorPage.getByRole('heading', { name: /Review Inspeksi/i })).toBeVisible();

    // Halaman harus menampilkan kartu statistik 'Menunggu Review'
    await expect(supervisorPage.getByText('Menunggu Review', { exact: true }).first()).toBeVisible();

    // Verifikasi apakah ada item dalam antrean atau empty state
    const hasItems = await supervisorPage.getByTestId('approve-inspection-btn').count() > 0;
    if (hasItems) {
      // Jika ada item, pastikan tombol Setujui dan Tolak dapat diklik
      await expect(supervisorPage.getByTestId('approve-inspection-btn').first()).toBeEnabled();
      await expect(supervisorPage.getByTestId('reject-inspection-btn').first()).toBeEnabled();
    } else {
      // Jika antrean kosong, pastikan empty state tampil informatif
      await expect(supervisorPage.getByTestId('empty-state')).toBeVisible();
    }
  });

  test('CUJ-04B (Failure & Validation State): Penolakan inspeksi mewajibkan pengisian alasan', async ({ supervisorPage }) => {
    // Mock data agar selalu ada 1 inspeksi pending untuk diuji
    await supervisorPage.route('**/api/inspections/review/pending', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 99991,
              apar_id: 1,
              condition: 'damaged',
              requires_repair: true,
              created_at: new Date().toISOString(),
              apar: {
                serial_number: 'APAR-TEST-REVIEW',
                location_name: 'Area Boiler Maos',
              },
              user: {
                name: 'Teknisi Uji',
              },
              inspection_damages: [
                { id: 1, damage_category: { name: 'Pressure Gauge Drop' } },
              ],
            },
          ],
        }),
      });
    });

    await supervisorPage.goto('/inspections/review');

    // Klik tombol Tolak
    const rejectBtn = supervisorPage.getByTestId('reject-inspection-btn').first();
    await expect(rejectBtn).toBeVisible();
    await rejectBtn.click();

    // Dialog penolakan harus terbuka
    await expect(supervisorPage.getByRole('heading', { name: /Tolak Inspeksi/i })).toBeVisible();

    // Klik konfirmasi tolak tanpa mengisi catatan alasan
    const confirmBtn = supervisorPage.getByRole('button', { name: /Tolak|Konfirmasi/i }).last();
    await confirmBtn.click();

    // Validasi dialog mencegah submit jika alasan belum diisi
    await expect(supervisorPage.getByRole('heading', { name: /Tolak Inspeksi/i })).toBeVisible();
  });

  test('CUJ-04C (Empty State): Tampilan informatif ketika semua inspeksi telah selesai direview', async ({ supervisorPage }) => {
    // Mock response data kosong
    await supervisorPage.route('**/api/inspections/review/pending', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    await supervisorPage.goto('/inspections/review');

    // Verifikasi empty state muncul
    await expect(supervisorPage.getByTestId('empty-state')).toBeVisible();
    await expect(supervisorPage.getByTestId('empty-state')).toContainText(/Semua Sudah Direview/i);
  });

});
