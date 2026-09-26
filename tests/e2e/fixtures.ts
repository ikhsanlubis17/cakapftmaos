import { test as base, expect, Page } from '@playwright/test';
import { STORAGE_STATE_ADMIN, STORAGE_STATE_SUPERVISOR, STORAGE_STATE_TEKNISI } from '../../playwright.config';

type AuthFixtures = {
  adminPage: Page;
  supervisorPage: Page;
  teknisiPage: Page;
};

export const test = base.extend<AuthFixtures>({
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: STORAGE_STATE_ADMIN,
      permissions: ['geolocation', 'camera'],
      geolocation: { latitude: -7.6045, longitude: 109.1534 },
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  supervisorPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: STORAGE_STATE_SUPERVISOR,
      permissions: ['geolocation', 'camera'],
      geolocation: { latitude: -7.6045, longitude: 109.1534 },
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  teknisiPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: STORAGE_STATE_TEKNISI,
      permissions: ['geolocation', 'camera'],
      geolocation: { latitude: -7.6045, longitude: 109.1534 },
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect };
