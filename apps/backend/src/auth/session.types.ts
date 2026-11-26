/**
 * Shape of a user as attached to an authenticated session. Shared across
 * `AuthGuard` (where it is read off `request.user`), `AuthService` (where it
 * is part of the session returned from login/refresh), and `AuthController`
 * (where it is returned to the client) so the three don't each redeclare an
 * identical interface.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
}

/**
 * The pair of session tokens plus the user they belong to, as returned by
 * `AuthService.login`/`refresh` and consumed by `AuthController` to set
 * cookies and shape the HTTP response.
 */
export interface Session {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
}
