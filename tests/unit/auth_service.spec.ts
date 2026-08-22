/**
 * add unit tests for AuthService:
 * - register stores a hashed (not plaintext) password
 * - register normalizes email (trim + lowercase) before persisting
 * - login rejects unknown email
 * - login rejects wrong password
 * - login normalizes email (trim + lowercase) before verifying credentials
 * - tokens expire after 7 days (expiresAt is set)
 * - logout revokes the token
 *
 * See tests/bootstrap.ts for the Japa + AdonisJS setup.
 */
export {}
