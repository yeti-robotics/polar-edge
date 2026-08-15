import { Button } from "@repo/ui/components/button";
import Link from "next/link";
import { routes } from "@/lib/routes";

export function LoginButton() {
  return (
    <Button asChild variant="ghost" size="sm">
      <Link href={routes.login}>Log in</Link>
    </Button>
  );
}
