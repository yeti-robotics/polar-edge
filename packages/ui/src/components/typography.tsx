import { cn } from "@repo/ui/lib/utils";
import type * as React from "react";

export function TypographyH1({ className, ...props }: React.ComponentProps<"h1">) {
  return <h1 className={cn("scroll-m-20 text-3xl tracking-tight", className)} {...props} />;
}

export function TypographyH2({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 className={cn("scroll-m-20 text-2xl tracking-tight", className)} {...props} />;
}

export function TypographyH3({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 className={cn("scroll-m-20 text-xl tracking-tight", className)} {...props} />;
}

export function TypographyH4({ className, ...props }: React.ComponentProps<"h4">) {
  return <h4 className={cn("scroll-m-20 text-lg tracking-tight", className)} {...props} />;
}

export function TypographyP({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("leading-7 not-first:mt-2", className)} {...props} />;
}

export function TypographyLead({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-xl text-muted-foreground", className)} {...props} />;
}

export function TypographyLarge({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-lg", className)} {...props} />;
}

export function TypographySmall({ className, ...props }: React.ComponentProps<"small">) {
  return <small className={cn("text-sm leading-none", className)} {...props} />;
}

export function TypographyMuted({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function TypographyLabel({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-xs font-mono uppercase tracking-widest text-muted-foreground", className)}
      {...props}
    />
  );
}

export function TypographyInlineCode({ className, ...props }: React.ComponentProps<"code">) {
  return (
    <code
      className={cn(
        "bg-muted relative rounded px-2 py-1 font-mono text-sm font-semibold",
        className
      )}
      {...props}
    />
  );
}
