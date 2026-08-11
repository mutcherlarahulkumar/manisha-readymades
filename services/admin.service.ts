/**
 * Admin account management and credential verification.
 *
 * `passwordHash` is `select: false` on the schema, so it is only ever loaded by
 * {@link authenticate} — no other query can leak it.
 *
 * @module services/admin.service
 */
import { ApiError } from '@/lib/api/ApiError';
import { hashPassword, verifyPassword, type SessionPayload } from '@/lib/auth';
import { serialize } from '@/lib/serialize';
import { Admin, type AdminDocument } from '@/models/Admin';
import { Order } from '@/models/Order';
import type { Admin as AdminJson } from '@/types/models';
import type * as yup from 'yup';
import type { adminCreateSchema, adminUpdateSchema } from '@/validation/admin.schema';

/** Validated payload for creating an admin. */
export type AdminCreateValues = yup.InferType<typeof adminCreateSchema>;
/** Validated payload for updating an admin; the password may be omitted. */
export type AdminUpdateValues = yup.InferType<typeof adminUpdateSchema>;

/**
 * Verifies an email/password pair and returns the session claims.
 *
 * Both a missing account and a wrong password produce the same message, so the
 * endpoint cannot be used to enumerate valid emails.
 *
 * @param email - Submitted email address.
 * @param password - Submitted plaintext password.
 * @returns Session claims for the authenticated admin.
 * @throws {ApiError} 401 on bad credentials, 403 when the account is disabled.
 */
export async function authenticate(email: string, password: string): Promise<SessionPayload> {
  const admin = await Admin.findOne({ email: email.toLowerCase() })
    .select('+passwordHash')
    .lean<AdminDocument | null>();

  if (!admin) throw ApiError.unauthorized('Incorrect email or password');

  const matches = await verifyPassword(password, admin.passwordHash);
  if (!matches) throw ApiError.unauthorized('Incorrect email or password');
  if (!admin.isActive) throw ApiError.forbidden('This account has been deactivated');

  return {
    sub: admin._id.toString(),
    email: admin.email,
    name: admin.name,
    role: admin.role,
  };
}

/**
 * Lists all admin accounts, newest first. Never includes password hashes.
 *
 * @returns All admin users.
 */
export async function listAdmins(): Promise<AdminJson[]> {
  const docs = await Admin.find().sort({ createdAt: -1 }).lean();
  return serialize<AdminJson[]>(docs);
}

/**
 * Fetches one admin by id.
 *
 * @param id - The admin's ObjectId.
 * @returns The admin.
 * @throws {ApiError} 404 when it does not exist.
 */
export async function getAdmin(id: string): Promise<AdminJson> {
  const doc = await Admin.findById(id).lean<AdminDocument | null>();
  if (!doc) throw ApiError.notFound('Admin');
  return serialize<AdminJson>(doc);
}

/**
 * Creates an admin account, hashing the password before it is stored.
 *
 * @param values - Validated form values.
 * @returns The created admin, without its password hash.
 * @throws {ApiError} 409 when the email is already registered.
 */
export async function createAdmin(values: AdminCreateValues): Promise<AdminJson> {
  const { password, ...rest } = values;
  const created = await Admin.create({ ...rest, passwordHash: await hashPassword(password) });

  const { passwordHash: _omitted, ...safe } = created.toObject();
  return serialize<AdminJson>(safe);
}

/**
 * Updates an admin account. The password is only rewritten when supplied.
 *
 * @param id - The admin's ObjectId.
 * @param values - Validated form values.
 * @param actor - The session performing the update.
 * @returns The updated admin.
 * @throws {ApiError} 404 when missing, 403 when an owner would lock themselves out.
 */
export async function updateAdmin(
  id: string,
  values: AdminUpdateValues,
  actor: SessionPayload,
): Promise<AdminJson> {
  const doc = await Admin.findById(id);
  if (!doc) throw ApiError.notFound('Admin');

  // Guard against the last owner demoting or disabling themselves and locking
  // everyone out of the dashboard.
  const losesOwnership = doc.role === 'owner' && (values.role !== 'owner' || !values.isActive);
  if (losesOwnership) {
    const otherOwners = await Admin.countDocuments({
      _id: { $ne: id },
      role: 'owner',
      isActive: true,
    });
    if (otherOwners === 0) {
      throw ApiError.forbidden('There must always be at least one active owner');
    }
    if (actor.sub === id) {
      throw ApiError.forbidden('You cannot remove your own owner access');
    }
  }

  const { password, ...rest } = values;
  doc.set(rest);
  if (password) doc.set('passwordHash', await hashPassword(password));
  await doc.save();

  const { passwordHash: _omitted, ...safe } = doc.toObject();
  return serialize<AdminJson>(safe);
}

/**
 * Deletes an admin account and unassigns any orders that pointed at it.
 *
 * @param id - The admin's ObjectId.
 * @param actor - The session performing the deletion.
 * @throws {ApiError} 404 when missing, 403 when deleting yourself or the last owner.
 */
export async function deleteAdmin(id: string, actor: SessionPayload): Promise<void> {
  if (actor.sub === id) throw ApiError.forbidden('You cannot delete your own account');

  const doc = await Admin.findById(id).lean<AdminDocument | null>();
  if (!doc) throw ApiError.notFound('Admin');

  if (doc.role === 'owner') {
    const otherOwners = await Admin.countDocuments({ _id: { $ne: id }, role: 'owner', isActive: true });
    if (otherOwners === 0) throw ApiError.forbidden('There must always be at least one active owner');
  }

  await Admin.findByIdAndDelete(id);
  await Order.updateMany({ assignedTo: id }, { assignedTo: null });
}
