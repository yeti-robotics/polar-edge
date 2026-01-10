import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
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
    <main className="flex h-screen flex-col items-center justify-center">
      <form className="flex flex-col gap-2" action={signIn}>
        <div className="flex flex-col gap-1">
          <Label htmlFor="password">Password</Label>
          <Input type="password" name="password" />
        </div>
        <Button type="submit">Sign in</Button>
      </form>
    </main>
  );
}
