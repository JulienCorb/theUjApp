/**
 * add functional tests for authorization (Bouncer):
 * - self-scoped endpoints (profile, logout) succeed for the authenticated user
 * - resource-scoped endpoints return 403 when bouncer denies access
 * - unauthenticated requests to protected routes return 401
 *
 * See tests/bootstrap.ts for the Japa + AdonisJS setup.
 */
export {}
