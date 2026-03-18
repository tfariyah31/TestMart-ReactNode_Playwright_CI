import { test as setup, request } from '@playwright/test'; // 1. Import 'test' as 'setup'
import fs from 'fs';
import path from 'path';
import { TEST_USERS, API_URL, APP_URL } from './fixtures/test-data';

const SESSION_DIR = path.join(__dirname, '.sessions');

const SESSION_ROLES = [
  TEST_USERS.superadmin,
  TEST_USERS.merchant,
  TEST_USERS.customer,
] as const;

// 2. Wrap your logic in a setup() block
setup('authenticate all users', async ({}) => {
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
  }

  console.log(`📁 Sessions directory: ${SESSION_DIR}`);
  
  // 3. Use Playwright's built-in request utility
  const context = await request.newContext();

  for (const user of SESSION_ROLES) {
    const apiFile   = path.join(SESSION_DIR, `${user.role}.api.json`);
    const stateFile = path.join(SESSION_DIR, `${user.role}.state.json`);

    if (fs.existsSync(apiFile) && fs.existsSync(stateFile)) {
      const ageMinutes = (Date.now() - fs.statSync(apiFile).mtimeMs) / 1000 / 60;
      if (ageMinutes < 20) {
        console.log(`✅ Reusing session for ${user.role} (${Math.round(ageMinutes)}m old)`);
        continue;
      }
    }

    try {
      console.log(`🔐 Logging in as ${user.role}...`);
      const res = await context.post(`${API_URL}/auth/login`, {
        data: { email: user.email, password: user.password },
      });

      if (!res.ok()) {
        console.warn(`⚠️  Could not login as ${user.role}: ${res.status()}`);
        continue;
      }

      const body = await res.json();

      // Save API session
      fs.writeFileSync(apiFile, JSON.stringify({
        accessToken:  body.accessToken,
        refreshToken: body.refreshToken,
        user:         body.user,
        savedAt:      Date.now(),
      }, null, 2));

      // Save Storage State for E2E
      const storageState = {
        cookies: [],
        origins: [
          {
            origin: APP_URL,
            localStorage: [
              { name: 'accessToken', value: body.accessToken },
              { name: 'userRole',    value: body.user.role   },
            ],
          },
        ],
      };

      fs.writeFileSync(stateFile, JSON.stringify(storageState, null, 2));
      console.log(`✅ Sessions saved for ${user.role} (api + state)`);
    } catch (err) {
      console.warn(`⚠️  Failed to create session for ${user.role}:`, err);
    }
  }

  await context.dispose();
});