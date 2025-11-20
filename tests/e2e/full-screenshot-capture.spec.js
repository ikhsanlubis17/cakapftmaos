import { test, expect } from '@playwright/test';

/**
 * E2E Screenshot Capture Test Suite
 * 
 * This test suite captures screenshots of all major features in the application
 * for documentation purposes. It runs on two projects:
 * - desktop: Admin/Supervisor features
 * - teknisi-mobile: Technician features (responsive)
 * 
 * IMPORTANT: Update these credentials with valid test data from your database
 */

// ============================================================================
// TEST CREDENTIALS - UPDATE THESE WITH YOUR TEST DATABASE CREDENTIALS
// ============================================================================
const ADMIN_USER = {
  email: 'admin@cakap-pertamina.com',   
  password: 'password123'        
};

const SUPERVISOR_USER = {
  email: 'supervisor@cakap-pertamina.com',  
  password: 'password123'     
};

const TEKNISI_USER = {
  email: 'teknisi1@cakap-pertamina.com',     
  password: 'password123' 
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Login helper function
 */
async function login(page, email, password) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for navigation to complete - app redirects to root '/' after login
  await page.waitForURL('/', { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Extra wait for React hydration
}

/**
 * Take screenshot with consistent naming
 * Screenshots are saved in separate folders: screenshots/desktop and screenshots/mobile
 * Uses testInfo.project.name to automatically determine the correct folder
 */
async function captureScreen(page, name, testInfo) {
  await page.waitForTimeout(1000); // Wait for animations
  
  // Map project name to folder name
  // 'desktop' -> 'desktop'
  // 'teknisi-mobile' -> 'mobile'
  const folderName = testInfo.project.name === 'teknisi-mobile' ? 'mobile' : 'desktop';
  
  await page.screenshot({
    path: `screenshots/${folderName}/${name}.png`,
    fullPage: true
  });
}

// ============================================================================
// DESKTOP TESTS (Admin & Supervisor Features)
// ============================================================================

test.describe('Desktop - Admin Features', () => {
  test.skip(({ browserName }) => browserName !== 'chromium');
  
  test('01 - Login Page', async ({ page }, testInfo) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await captureScreen(page, '01-login-page', testInfo);
  });

  test('02 - Admin Dashboard', async ({ page }, testInfo) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password);
    await captureScreen(page, '02-admin-dashboard', testInfo);
  });

  test('03 - APAR Management List', async ({ page }, testInfo) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password);
    await page.goto('/apar');
    await page.waitForLoadState('networkidle');
    await captureScreen(page, '03-apar-list', testInfo);
  });

  test('04 - APAR Types Management', async ({ page }, testInfo) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password);
    await page.goto('/apar-types');
    await page.waitForLoadState('networkidle');
    await captureScreen(page, '04-apar-types', testInfo);
  });

  test('05 - Damage Categories', async ({ page }, testInfo) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password);
    await page.goto('/damage-categories');
    await page.waitForLoadState('networkidle');
    await captureScreen(page, '05-damage-categories', testInfo);
  });

  test('06 - Tank Trucks Management', async ({ page }, testInfo) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password);
    await page.goto('/tank-trucks');
    await page.waitForLoadState('networkidle');
    await captureScreen(page, '06-tank-trucks', testInfo);
  });

  test('07 - User Management', async ({ page }, testInfo) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password);
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    await captureScreen(page, '07-users-list', testInfo);
  });

  test('08 - Inspection Schedules', async ({ page }, testInfo) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password);
    await page.goto('/schedules');
    await page.waitForLoadState('networkidle');
    await captureScreen(page, '08-schedules', testInfo);
  });

  test('09 - Settings Page', async ({ page }, testInfo) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password);
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await captureScreen(page, '09-settings', testInfo);
  });
});

test.describe('Desktop - Supervisor Features', () => {
  test.skip(({ browserName }) => browserName !== 'chromium');

  test('10 - Supervisor Dashboard', async ({ page }, testInfo) => {
    await login(page, SUPERVISOR_USER.email, SUPERVISOR_USER.password);
    await captureScreen(page, '10-supervisor-dashboard', testInfo);
  });

  test('11 - Repair Approvals List', async ({ page }, testInfo) => {
    await login(page, SUPERVISOR_USER.email, SUPERVISOR_USER.password);
    await page.goto('/repair-approvals');
    await page.waitForLoadState('networkidle');
    await captureScreen(page, '11-repair-approvals-list', testInfo);
  });

  test('12 - Repair Approval Detail (Pending)', async ({ page }, testInfo) => {
    await login(page, SUPERVISOR_USER.email, SUPERVISOR_USER.password);
    await page.goto('/repair-approvals');
    await page.waitForLoadState('networkidle');
    
    // Try to click first pending approval if exists
    const firstApproval = page.locator('tr').filter({ hasText: 'Menunggu' }).first();
    if (await firstApproval.count() > 0) {
      await firstApproval.click();
      await page.waitForLoadState('networkidle');
      await captureScreen(page, '12-repair-approval-detail-pending', testInfo);
    }
  });

  test('13 - Repair Approval Modal - Approve', async ({ page }, testInfo) => {
    await login(page, SUPERVISOR_USER.email, SUPERVISOR_USER.password);
    await page.goto('/repair-approvals');
    await page.waitForLoadState('networkidle');
    
    // Try to open approval modal
    const firstApproval = page.locator('tr').filter({ hasText: 'Menunggu' }).first();
    if (await firstApproval.count() > 0) {
      await firstApproval.click();
      await page.waitForLoadState('networkidle');
      
      // Click approve button
      const approveBtn = page.getByRole('button', { name: /setujui/i });
      if (await approveBtn.count() > 0) {
        await approveBtn.click();
        await page.waitForTimeout(500);
        await captureScreen(page, '13-approval-modal-approve', testInfo);
      }
    }
  });

  test('14 - Repair Approval Modal - Reject', async ({ page }, testInfo) => {
    await login(page, SUPERVISOR_USER.email, SUPERVISOR_USER.password);
    await page.goto('/repair-approvals');
    await page.waitForLoadState('networkidle');
    
    // Try to open rejection modal
    const firstApproval = page.locator('tr').filter({ hasText: 'Menunggu' }).first();
    if (await firstApproval.count() > 0) {
      await firstApproval.click();
      await page.waitForLoadState('networkidle');
      
      // Click reject button
      const rejectBtn = page.getByRole('button', { name: /tolak/i });
      if (await rejectBtn.count() > 0) {
        await rejectBtn.click();
        await page.waitForTimeout(500);
        await captureScreen(page, '14-approval-modal-reject', testInfo);
      }
    }
  });

  test('15 - Inspections History (Read-Only)', async ({ page }, testInfo) => {
    await login(page, SUPERVISOR_USER.email, SUPERVISOR_USER.password);
    await page.goto('/inspections');
    await page.waitForLoadState('networkidle');
    await captureScreen(page, '15-inspections-history', testInfo);
  });
});

// ============================================================================
// MOBILE TESTS (Technician Features - Responsive)
// ============================================================================

test.describe('Mobile - Technician Features', () => {
  test.skip(({ browserName }) => browserName !== 'chromium');

  test('16 - Mobile Login', async ({ page }, testInfo) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await captureScreen(page, '16-mobile-login', testInfo);
  });

  test('17 - Technician Dashboard', async ({ page }, testInfo) => {
    await login(page, TEKNISI_USER.email, TEKNISI_USER.password);
    await captureScreen(page, '17-technician-dashboard', testInfo);
  });

  test('18 - My Inspections List', async ({ page }, testInfo) => {
    await login(page, TEKNISI_USER.email, TEKNISI_USER.password);
    await page.goto('/my-inspections');
    await page.waitForLoadState('networkidle');
    await captureScreen(page, '18-my-inspections-list', testInfo);
  });

  test('19 - My Inspections - Approved Item', async ({ page }, testInfo) => {
    await login(page, TEKNISI_USER.email, TEKNISI_USER.password);
    await page.goto('/my-inspections');
    await page.waitForLoadState('networkidle');
    
    // Scroll to find approved item with supervisor decision
    const approvedItem = page.locator('div').filter({ hasText: /disetujui/i }).first();
    if (await approvedItem.count() > 0) {
      await approvedItem.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await captureScreen(page, '19-inspection-approved-with-supervisor', testInfo);
    }
  });

  test('20 - My Inspections - Rejected Item', async ({ page }, testInfo) => {
    await login(page, TEKNISI_USER.email, TEKNISI_USER.password);
    await page.goto('/my-inspections');
    await page.waitForLoadState('networkidle');
    
    // Scroll to find rejected item with supervisor decision
    const rejectedItem = page.locator('div').filter({ hasText: /ditolak/i }).first();
    if (await rejectedItem.count() > 0) {
      await rejectedItem.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await captureScreen(page, '20-inspection-rejected-with-reinspection', testInfo);
    }
  });

  test('21 - Scan QR Page', async ({ page }, testInfo) => {
    await login(page, TEKNISI_USER.email, TEKNISI_USER.password);
    await page.goto('/scan');
    await page.waitForLoadState('networkidle');
    await captureScreen(page, '21-scan-qr-page', testInfo);
  });

  test('22 - Inspection Form', async ({ page }, testInfo) => {
    await login(page, TEKNISI_USER.email, TEKNISI_USER.password);
    // Note: This requires a valid APAR ID, adjust as needed
    await page.goto('/inspection/create?apar_id=1');
    await page.waitForLoadState('networkidle');
    await captureScreen(page, '22-inspection-form', testInfo);
  });

  test('23 - Notifications', async ({ page }, testInfo) => {
    await login(page, TEKNISI_USER.email, TEKNISI_USER.password);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    await captureScreen(page, '23-notifications', testInfo);
  });

  test('24 - Profile Page', async ({ page }, testInfo) => {
    await login(page, TEKNISI_USER.email, TEKNISI_USER.password);
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await captureScreen(page, '24-profile-page', testInfo);
  });
});

// ============================================================================
// ADDITIONAL FEATURE TESTS
// ============================================================================

test.describe('Additional Features', () => {
  test.skip(({ browserName }) => browserName !== 'chromium');

  test('25 - Reports Dashboard', async ({ page }, testInfo) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password);
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    await captureScreen(page, '25-reports-dashboard', testInfo);
  });

  test('26 - Inspection Analytics', async ({ page }, testInfo) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password);
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    await captureScreen(page, '26-analytics', testInfo);
  });
});
