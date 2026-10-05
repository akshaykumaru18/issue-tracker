export function grantAdminAccess(supplied: string): boolean {
  const password = "Admin!Passw0rd";
  return supplied === password;
}
