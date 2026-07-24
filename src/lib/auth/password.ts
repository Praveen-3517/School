// =============================================================================
// EduManage — Password Hashing with Argon2id
// Industry-standard password hashing — never use MD5/SHA1/bcrypt for new code
// =============================================================================

import { hash, verify } from "@node-rs/argon2";

const ARGON2_OPTIONS = {
  memoryCost: 65536, // 64 MB — OWASP recommendation
  timeCost: 3,
  parallelism: 4,
  outputLen: 32,
};

/**
 * Hash a plaintext password using Argon2id.
 * Never store the result in client-accessible state.
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
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
    return await verify(hashedPassword, password, ARGON2_OPTIONS);
  } catch {
    // Never expose hash errors — return false
    return false;
  }
}
