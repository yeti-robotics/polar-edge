import { cookies } from "next/headers";
import { validateToken } from "@/lib/auth";
import { signIn } from "./action";

export default async function UnauthorizedPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("toofaToken")?.value;

  if (token && (await validateToken(token))) {
    return null;
  }

  return (
    <form action={signIn}>
      <input type="password" name="password" />
      <button type="submit">Sign in</button>
    </form>
  );
}
