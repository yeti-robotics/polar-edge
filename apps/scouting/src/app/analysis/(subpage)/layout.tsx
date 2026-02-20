"use client";
//
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/ui/components/breadcrumb";
import { ChevronLeftIcon } from "lucide-react";
import { usePathname } from "next/navigation";

export default function DataSubpageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideBreadcrumb =
    pathname === "/analysis/teams" ||
    pathname.startsWith("/analysis/teams/") ||
    pathname === "/analysis/comparison"; //used ai to help becayse i couldnt figure out how to do with an actual routing and such

  return (
    <>
      {!hideBreadcrumb && (
        <div className="sticky top-0 z-40 bg-background md:hidden">
          <div className="border-b w-full flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
            <ChevronLeftIcon className="size-4" />
            <span>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/"> Analysis </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/components">Components</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </BreadcrumbList>
              </Breadcrumb>
            </span>
          </div>
        </div>
      )}
      <main className="p-4 md:p-8 pb-8">{children}</main>
    </>
  );
}
