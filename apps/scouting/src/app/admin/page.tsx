import { requireAdminMember } from "@/lib/server/auth/require-member";

export default async function AdminPage() {
  await requireAdminMember();

  return <div>hi there</div>;
}
