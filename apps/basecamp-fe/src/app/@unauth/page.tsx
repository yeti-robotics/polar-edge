import { cookies } from "next/headers";
import { SignInForm } from "@/features/auth/components/SignInForm";
import { refreshToken, validateToken } from "@/lib/auth";

export default async function UnauthorizedPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("toofaToken")?.value;

  if (token && (await validateToken(token))) {
    return null;
  }

  if (await refreshToken()) {
    return null;
  }

  return <SignInForm />;
}
