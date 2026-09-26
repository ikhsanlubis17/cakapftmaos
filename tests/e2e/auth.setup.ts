import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { STORAGE_STATE_ADMIN, STORAGE_STATE_SUPERVISOR, STORAGE_STATE_TEKNISI } from '../../playwright.config';

const users = [
  {
    role: 'admin',
    email: 'admin@cakap-pertamina.com',
    password: 'password123',
    storagePath: STORAGE_STATE_ADMIN,
  },
  {
    role: 'supervisor',
    email: 'supervisor@cakap-pertamina.com',
    password: 'password123',
    storagePath: STORAGE_STATE_SUPERVISOR,
  },
  {
    role: 'teknisi',
    email: 'teknisi1@cakap-pertamina.com',
    password: 'password123',
    storagePath: STORAGE_STATE_TEKNISI,
  },
];

setup('authenticate all roles and generate storage states', async ({ request, page, baseURL }) => {
  // Ensure output directory exists
  const authDir = path.dirname(STORAGE_STATE_ADMIN);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  for (const user of users) {
    // 1. Authenticate via backend API to obtain valid JWT token
    const response = await request.post(`${baseURL || 'http://127.0.0.1:8000'}/api/login`, {
      data: {
        email: user.email,
        password: user.password,
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    const token = body.token || body.data?.token || body.access_token;
    expect(token).toBeTruthy();

    // 2. Open base page and inject token into localStorage (using tokenStorage key 'token')
    await page.goto('/welcome');
    await page.evaluate((jwtToken) => {
      localStorage.setItem('token', jwtToken);
    }, token);

    // 3. Persist the storage state to disk
    await page.context().storageState({ path: user.storagePath });
  }
});
