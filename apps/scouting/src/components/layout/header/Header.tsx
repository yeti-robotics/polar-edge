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
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";
import { routes } from "@/lib/routes";
import { isScoutLeadOrAbove } from "@/lib/server/auth/require-member";
import { DropdownMenuItemLink } from "./DropdownMenuItemLink";
import { HeaderNav } from "./HeaderNav";
import { LoginButton } from "./LoginButton";
import { LogoutButton } from "./LogoutButton";
import { OrganizationSelector } from "./OrganizationSelector";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  {
    label: "Pit Form",
    href: routes.forms.pit,
  },
  {
    label: "Stand Form",
    href: routes.forms.stand,
  },
  {
    label: "Analysis",
    href: routes.analysis.root,
  },
  {
    label: "Picklist",
    href: routes.picklist.root,
  },
  {
    label: "Scouting Schedule",
    href: routes.shiftSchedule.root,
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
    <Suspense>
      <HeaderContent />
    </Suspense>
  );
}

async function HeaderContent() {
  const session = await auth.api.getSession({ headers: await headers() });
  const isAuthenticated = !!session?.user;

  if (!isAuthenticated) {
    return (
      <header className="sticky top-0 z-50 min-w-0 border-b bg-background flex items-center h-12">
        <div className="flex items-center justify-between w-full px-6">
          <span className="uppercase font-mono text-sm">Polar Edge</span>
          <LoginButton />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 py-2 min-w-0 border-b bg-background h-(--header-height) flex flex-col justify-between">
      <div className="flex items-center justify-between w-full px-6">
        <div className="flex items-center gap-4">
          <span className="hidden md:block uppercase font-mono text-sm">Polar Edge</span>
          <Suspense fallback={<OrganizationSelectorFallback />}>
            <OrganizationSelectorWrapper />
          </Suspense>
        </div>
        <Suspense fallback={<UserAvatarFallback />}>
          <UserAvatar />
        </Suspense>
      </div>
      <nav className="gap-6 text-sm inline-flex overflow-x-auto ml-6 no-scrollbar">
        <Suspense>
          <HeaderNav items={navItems} />
        </Suspense>
        <Suspense fallback={null}>
          <ConditionalNavItems />
        </Suspense>
      </nav>
    </header>
  );
}

async function ConditionalNavItems() {
  let activeMember = null;
  try {
<<<<<<< HEAD
    const activeMember = await auth.api.getActiveMember({
      headers: await headers(),
    });
=======
    activeMember = await auth.api.getActiveMember({ headers: await headers() });
>>>>>>> ca64f9b58416ac931615efec8654dbf8e75aa4a0
    if (!activeMember) return null;
  } catch {
    return null;
  }

  const items = [
    ...(isScoutLeadOrAbove(activeMember.role)
      ? [
          { label: "Workability", href: routes.forms.workability },
          { label: "Drive Ranking", href: routes.forms.driveRanking },
        ]
      : []),
    { label: "Leaderboard", href: routes.leaderboard },
  ];

  return <HeaderNav items={items} />;
}

async function OrganizationSelectorWrapper() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return null;
  }

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

  let isAdminOrOwner = false;
  try {
    const activeMember = await auth.api.getActiveMember({
      headers: await headers(),
    });
    isAdminOrOwner = activeMember?.role === "admin" || activeMember?.role === "owner";
  } catch {
    // No active organization — still render the dropdown so the user can sign out
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {session.user.image ? (
          <img
            src={session.user.image}
            alt={session.user.name ?? ""}
            className="size-8 rounded-full select-none object-cover"
          />
        ) : (
          <span className="flex size-8 items-center justify-center rounded-full bg-muted select-none text-sm font-medium">
            {session.user.name?.charAt(0) ?? ""}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className="min-w-36">
        <DropdownMenuGroup>
          <DropdownMenuItemLink href={routes.analysis.root}>
            <HomeIcon className="size-4 text-current" />
            <span>Home</span>
          </DropdownMenuItemLink>
          <DropdownMenuItemLink href={routes.profile}>
            <UserIcon className="size-4 text-current" />
            <span>Profile</span>
          </DropdownMenuItemLink>
          {isAdminOrOwner && (
            <DropdownMenuItemLink href={routes.admin.root}>
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
}
