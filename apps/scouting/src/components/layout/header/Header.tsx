import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Skeleton } from "@repo/ui/components/skeleton";
import { HomeIcon, ShieldCheckIcon, UserIcon } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";
import { setDefaultOrganizationIfNeeded } from "@/lib/server/organization/default-organization";
import { DropdownMenuItemLink } from "./DropdownMenuItemLink";
import { LogoutButton } from "./LogoutButton";
import { OrganizationSelector } from "./OrganizationSelector";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  {
    label: "Pit Form",
    href: "/forms/pit",
  },
  {
    label: "Stand Form",
    href: "/forms/stand",
  },
  {
    label: "Analysis",
    href: "/analysis",
  },
  {
    label: "Picklist",
    href: "/picklist",
  },
];

function OrganizationSelectorFallback() {
  return (
    <>
      <div className="hidden md:block w-px h-6 bg-muted-foreground rotate-15" />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="size-6 rounded" />
      </div>
    </>
  );
}

function UserAvatarFallback() {
  return <Skeleton className="size-8 rounded-full" />;
}

export function Header() {
  return (
    <header className="sticky top-0 z-50 py-2 overflow-x-hidden border-b bg-background h-(--header-height) flex flex-col justify-between">
      <div className="flex items-center justify-between w-full px-6">
        <div className="flex items-center gap-4">
          <span className="hidden md:block uppercase font-mono text-sm">
            Polar Edge
          </span>
          <Suspense fallback={<OrganizationSelectorFallback />}>
            <OrganizationSelectorWrapper />
          </Suspense>
        </div>
        <Suspense fallback={<UserAvatarFallback />}>
          <UserAvatar />
        </Suspense>
      </div>
      <nav className="gap-6 text-sm inline-flex overflow-x-auto ml-6 no-scrollbar">
        {navItems.map((item) => (
          <Link
            key={item.href}
            className="hover:text-foreground text-muted-foreground whitespace-nowrap"
            href={item.href}
          >
            {item.label}
          </Link>
        ))}
        <nav />
      </nav>
    </header>
  );
}

async function OrganizationSelectorWrapper() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return null;
  }

  await setDefaultOrganizationIfNeeded();

  const isUserSuperAdmin = isSuperAdmin(session.user.email);
  return (
    <>
      <div className="hidden md:block w-px h-6 bg-muted-foreground rotate-15"></div>
      <OrganizationSelector isSuperAdmin={isUserSuperAdmin} />
    </>
  );
}

async function UserAvatar() {
  const headerList = await headers();
  const session = await auth.api.getSession({ headers: headerList });

  if (!session?.user) {
    return null;
  }

  try {
    const activeMember = await auth.api.getActiveMember({
      headers: await headers(),
    });
    const isAdminOrOwner =
      activeMember?.role === "admin" || activeMember?.role === "owner";

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="size-8 select-none">
            <AvatarImage
              src={session.user.image ?? ""}
              alt={session.user.name ?? ""}
            ></AvatarImage>
            <AvatarFallback>
              {session.user.name?.charAt(0) ?? ""}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end" className="min-w-36">
          <DropdownMenuGroup>
            <DropdownMenuItemLink href="/">
              <HomeIcon className="size-4 text-current" />
              <span>Home</span>
            </DropdownMenuItemLink>
            <DropdownMenuItemLink href="/profile">
              <UserIcon className="size-4 text-current" />
              <span>Profile</span>
            </DropdownMenuItemLink>
            {isAdminOrOwner && (
              <DropdownMenuItemLink href="/admin">
                <ShieldCheckIcon className="size-4 text-current" />
                <span>Admin</span>
              </DropdownMenuItemLink>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <ThemeToggle />
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <LogoutButton />
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  } catch (err) {
    console.warn("Unauthorized organization access attempted: ", err);
    return null;
  }
}
