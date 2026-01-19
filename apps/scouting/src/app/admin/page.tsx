import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AdminPage() {
  const member = await auth.api.getActiveMember({
    headers: await headers(),
  });

 if (member?.role !== "admin" && member?.role !== "owner") {
    redirect("/");
  } 

  return <div> Admin Roles Password Required </div>;
}
