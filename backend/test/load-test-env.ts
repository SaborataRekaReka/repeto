import * as path from 'path';
import * as fs from 'fs';

/**
 * Loads .env.test BEFORE any test module imports.
 * This ensures e2e tests use the isolated test database (repeto_test),
 * not the dev database where real user data lives.
 */
const envTestPath = path.resolve(__dirname, '..', '.env.test');
if (!fs.existsSync(envTestPath)) {
  throw new Error(
    `.env.test not found at ${envTestPath}. ` +
      'E2e tests require a separate test database to avoid wiping dev data.',
  );
}

const content = fs.readFileSync(envTestPath, 'utf-8');
for (const line of content.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx);
  const value = trimmed.slice(eqIdx + 1);
  process.env[key] = value;
}
