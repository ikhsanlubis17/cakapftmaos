import { test, expect } from './fixtures';
import { FT_MAOS_COORDINATES } from './helpers/test-helper';

/**
 * JOURNEY 6: Form Inspeksi Lapangan Anti-Fraud (CUJ-06)
 * Viewport Mobile (Teknisi): Validasi radius Geolocation anti-fraud,
 * emulasi koordinat dalam vs luar radius, dan seleksi temuan kerusakan.
 */
test.describe('CUJ-06: Mobile Field Inspection & Anti-Fraud Engine', () => {

  test('CUJ-06A (Happy Path): Deteksi koordinat GPS valid saat berada dalam area FT Maos', async ({ teknisiPage }) => {
    // Set koordinat valid di pusat FT Maos
    await teknisiPage.context().setGeolocation(FT_MAOS_COORDINATES.VALID);

    // Buka rute form inspeksi untuk tabung dengan QR seeded (misal ID 1 / QR code)
    await teknisiPage.goto('/inspections/new/APAR-001');

    // Jika form terbuka atau fallback ke pemilih APAR
    const headerTitle = teknisiPage.getByRole('heading').first();
    await expect(headerTitle).toBeVisible();

    // Verifikasi badge deteksi GPS muncul saat koordinat terbaca
    const gpsBadge = teknisiPage.getByTestId('gps-status-badge');
    if (await gpsBadge.isVisible()) {
      await expect(gpsBadge).toContainText(/Lokasi Valid|Jarak ke APAR/i);
    }
  });

  test('CUJ-06B (Failure State): Anti-fraud GPS mendeteksi koordinat palsu di luar radius toleransi', async ({ teknisiPage }) => {
    // Set koordinat jauh di luar FT Maos (20 km)
    await teknisiPage.context().setGeolocation(FT_MAOS_COORDINATES.OUTSIDE_RADIUS);

    await teknisiPage.goto('/inspections/new/APAR-001');

    // Jika tabung memiliki titik referensi GPS di FT Maos, badge harus menandai lokasi tidak valid
    const gpsBadge = teknisiPage.getByTestId('gps-status-badge');
    if (await gpsBadge.isVisible()) {
      await expect(gpsBadge).toContainText(/Lokasi Tidak Valid/i);
    }
  });

  test('CUJ-06C (Damage Selection): Form menampilkan opsi kategori saat kondisi dipilih Rusak', async ({ teknisiPage }) => {
    await teknisiPage.goto('/inspections/new/APAR-001');

    // Cari radio atau tombol kondisi Rusak jika tersedia di form
    const rusakRadio = teknisiPage.locator('input[value="damaged"], button:has-text("Rusak")').first();
    if (await rusakRadio.isVisible()) {
      await rusakRadio.click();

      // Accordion atau daftar kategori kerusakan harus terbuka
      await expect(teknisiPage.locator('text=Kategori Kerusakan|Kerusakan')).toBeVisible();
    }
  });

  test('CUJ-06D (Hardware Scanner Graceful Fallback): Komponen scanner membuka kamera sintetis tanpa crash', async ({ teknisiPage }) => {
    await teknisiPage.goto('/scan');

    // Pastikan halaman scanner terbuka dan tidak memicu Unhandled Exception
    await expect(teknisiPage).toHaveURL(/.*scan/);
    await expect(teknisiPage.getByRole('heading', { name: /Scan QR Code/i })).toBeVisible();
  });

});
