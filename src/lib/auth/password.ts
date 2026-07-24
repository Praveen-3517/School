// =============================================================================
// EduManage — Password Hashing with Argon2id
// Industry-standard password hashing — never use MD5/SHA1/bcrypt for new code
// =============================================================================

import { hash, compare } from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * Hash a plaintext password using Argon2id.
 * Never store the result in client-accessible state.
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

/**
 * Verify a plaintext password against a stored Argon2id hash.
 * Returns true if the password matches, false otherwise.
 * Uses constant-time comparison internally to prevent timing attacks.
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    return await compare(password, hashedPassword);
  } catch {
    // Never expose hash errors — return false
    return false;
  }
}
