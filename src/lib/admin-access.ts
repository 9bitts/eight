export function isAdminAppPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/** Guard de middleware (edge): usa claim JWT, sem consulta ao banco. */
export function shouldDenyAdminPathToNonAdmin(
  pathname: string,
  opts: { isLoggedIn: boolean; jwtIsAdmin: boolean | undefined }
): boolean {
  return isAdminAppPath(pathname) && opts.isLoggedIn && !opts.jwtIsAdmin;
}
