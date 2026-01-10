export function isSuperAdmin(userName: string) {
  return process.env.ADMIN_USERS?.split(",").includes(userName) || false;
}
