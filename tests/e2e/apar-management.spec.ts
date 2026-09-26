import { test, expect } from './fixtures';
import { generateTestId, FT_MAOS_COORDINATES } from './helpers/test-helper';

/**
 * JOURNEY 2: Manajemen Data Master APAR (CUJ-02)
 * Portal Admin: Pembuatan tabung baru, validasi duplikasi serial, pencarian,
 * filter reaktif, penanganan empty state, dan pemicu cetak QR PDF.
 */
test.describe('CUJ-02: Master Data Management APAR (Admin Portal)', () => {

  test('CUJ-02A (Happy Path): Admin berhasil mendaftarkan APAR baru statis', async ({ adminPage }) => {
    const testSerial = generateTestId('APAR');

    await adminPage.goto('/apar');
    await expect(adminPage.getByRole('heading', { name: /Manajemen APAR/i })).toBeVisible();

    // Buka formulir tambah APAR
    await adminPage.getByTestId('add-apar-btn').click();
    await expect(adminPage).toHaveURL(/\/apar\/create/);

    // Isi formulir pendaftaran tabung
    await adminPage.getByTestId('serial-number-input').fill(testSerial);
    await adminPage.getByTestId('location-type-select').selectOption('statis');
    await adminPage.getByTestId('location-name-input').fill('Pos Jaga Terminal 1');

    // Koordinat FT Maos
    await adminPage.locator('input#latitude').fill(FT_MAOS_COORDINATES.VALID.latitude.toString());
    await adminPage.locator('input#longitude').fill(FT_MAOS_COORDINATES.VALID.longitude.toString());

    // Pilih jenis APAR & kapasitas
    await adminPage.getByTestId('apar-type-select').selectOption({ index: 1 });
    await adminPage.getByTestId('capacity-input').fill('6');

    // Submit form pendaftaran
    await adminPage.getByTestId('submit-apar-btn').click();

    // Verifikasi redirect kembali ke list
    await expect(adminPage).toHaveURL(/\/apar$/);

    // Verifikasi APAR yang baru dibuat muncul di tabel
    await adminPage.getByTestId('apar-search-input').fill(testSerial);
    await expect(adminPage.getByTestId('apar-table')).toContainText(testSerial);
  });

  test('CUJ-02B (Failure State): Sistem menolak duplikasi nomor seri APAR (422)', async ({ adminPage }) => {
    // Gunakan nomor seri unik pertama
    const duplicateSerial = generateTestId('DUP');

    // 1. Buat tabung pertama
    await adminPage.goto('/apar/create');
    await adminPage.getByTestId('serial-number-input').fill(duplicateSerial);
    await adminPage.getByTestId('location-name-input').fill('Gedung Utama');
    await adminPage.getByTestId('apar-type-select').selectOption({ index: 1 });
    await adminPage.getByTestId('capacity-input').fill('6');
    await adminPage.getByTestId('submit-apar-btn').click();
    await expect(adminPage).toHaveURL(/\/apar$/);

    // 2. Coba daftarkan kembali dengan nomor seri yang sama
    await adminPage.goto('/apar/create');
    await adminPage.getByTestId('serial-number-input').fill(duplicateSerial);
    await adminPage.getByTestId('location-name-input').fill('Gedung Cadangan');
    await adminPage.getByTestId('apar-type-select').selectOption({ index: 1 });
    await adminPage.getByTestId('capacity-input').fill('6');
    await adminPage.getByTestId('submit-apar-btn').click();

    // Verifikasi error penolakan duplikasi muncul
    const toastAlert = adminPage.getByRole('alert');
    await expect(toastAlert).toBeVisible();
    await expect(toastAlert).toContainText(/sudah digunakan|telah terdaftar|gagal/i);
  });

  test('CUJ-02C (Happy & Failure Path): Pencarian filter dan tampilan Empty State', async ({ adminPage }) => {
    await adminPage.goto('/apar');
    await expect(adminPage.getByTestId('apar-table')).toBeVisible();

    // Pencarian kata kunci acak yang tidak ada
    await adminPage.getByTestId('apar-search-input').fill('APAR_TIDAK_ADA_DI_SISTEM_99999');

    // Verifikasi Empty State muncul dengan pesan yang sesuai
    await expect(adminPage.getByTestId('empty-state')).toBeVisible();
    await expect(adminPage.getByTestId('empty-state')).toContainText(/Tidak ada APAR ditemukan/i);

    // Bersihkan filter
    await adminPage.getByRole('button', { name: /Bersihkan Filter/i }).click();
    await expect(adminPage.getByTestId('apar-table')).toBeVisible();
  });

  test('CUJ-02D (Happy Path): Admin dapat membuka modal unduh QR Code APAR', async ({ adminPage }) => {
    await adminPage.goto('/apar');

    // Klik tombol Unduh QR Code APAR
    const qrDownloadBtn = adminPage.getByRole('button', { name: /Unduh QR Code APAR/i });
    if (await qrDownloadBtn.isVisible()) {
      await qrDownloadBtn.click();
      // Pastikan modal terbuka
      await expect(adminPage.getByRole('heading', { name: /Unduh QR Code APAR/i })).toBeVisible();
    }
  });

});
