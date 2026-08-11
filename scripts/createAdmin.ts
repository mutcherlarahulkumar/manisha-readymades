/**
 * Creates the first owner account.
 *
 * There is no public sign-up, so the first account must be created here. Run it
 * once after configuring `.env.local`:
 *
 * ```bash
 * npm run create-admin -- --name "Owner" --email owner@example.com --password "Secret123"
 * ```
 *
 * Re-running with an existing email updates that account's password and
 * promotes it to owner, which is also the recovery path for a lost password.
 *
 * @module scripts/createAdmin
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Loads `.env.local` into `process.env` before any module reads it.
 *
 * The Next.js runtime does this automatically; a standalone script does not.
 */
function loadEnv(): void {
  try {
    const contents = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
    for (const line of contents.split(/\r?\n/)) {
      const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (match?.[1] && process.env[match[1]] === undefined) {
        process.env[match[1]] = match[2];
      }
    }
  } catch {
    // Falls through to the environment already present, e.g. in CI.
  }
}

loadEnv();

/**
 * Reads a `--flag value` pair from the command line.
 *
 * @param flag - Flag name without dashes.
 * @returns The value, or `undefined` when the flag is absent.
 */
function arg(flag: string): string | undefined {
  const index = process.argv.indexOf(`--${flag}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

/**
 * Creates or updates the owner account, then exits.
 */
async function main(): Promise<void> {
  const name = arg('name');
  const email = arg('email')?.toLowerCase();
  const password = arg('password');

  if (!name || !email || !password) {
    console.error(
      'Usage: npm run create-admin -- --name "Owner" --email owner@example.com --password "Secret123"',
    );
    process.exit(1);
  }

  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    console.error('Password must be at least 8 characters and contain a letter and a number.');
    process.exit(1);
  }

  // Imported after the environment is loaded so the connection string is present.
  const { connectToDatabase } = await import('@/lib/mongodb');
  const { hashPassword } = await import('@/lib/auth');
  const { Admin } = await import('@/models/Admin');
  const mongoose = (await import('mongoose')).default;

  await connectToDatabase();

  const passwordHash = await hashPassword(password);
  const existing = await Admin.findOne({ email });

  if (existing) {
    existing.set({ name, passwordHash, role: 'owner', isActive: true });
    await existing.save();
    console.warn(`Updated existing owner account: ${email}`);
  } else {
    await Admin.create({ name, email, passwordHash, role: 'owner', isActive: true });
    console.warn(`Created owner account: ${email}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

void main().catch((error: unknown) => {
  console.error('Failed to create the admin account:', error);
  process.exit(1);
});
