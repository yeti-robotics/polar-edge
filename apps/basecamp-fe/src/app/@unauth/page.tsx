import { cookies } from "next/headers";
import { validateToken } from "@/lib/auth";
import { SignInForm } from "@/features/auth/components/SignInForm";

export default async function UnauthorizedPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("toofaToken")?.value;

  if (token && (await validateToken(token))) {
    return null;
  }

  return <SignInForm />;
}
