import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { TypographyLabel } from "@repo/ui/components/typography";
import type { LucideIcon } from "lucide-react";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";

export interface NavCardItem {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

export function NavCardGrid({ items }: { items: NavCardItem[] }) {
  return (
    <div>
      <TypographyLabel className="mb-3">Quick Access</TypographyLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map(({ href, icon: Icon, title, description }) => (
          <Link key={href} href={href} className="group">
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-muted-foreground" />
                    <CardTitle className="text-base">{title}</CardTitle>
                  </div>
                  <ChevronRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
