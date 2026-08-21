/**
 * TODO(security): add functional tests covering the auth flows:
 * - signup creates a user and returns a token
 * - login with correct credentials succeeds
 * - login with wrong credentials fails (401)
 * - duplicate email signup is rejected (422)
 * - logout revokes the token and subsequent requests are 401
 * - profile endpoint requires authentication (401 without token)
 *
 * Without regression tests, security-critical behavior can silently break
 * on refactor. See tests/bootstrap.ts for the Japa + AdonisJS setup.
 */
export {}
