"use client";

import { cn } from "@repo/ui/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

type ActiveLinkProps = React.ComponentProps<typeof Link>;

export const ActiveLink = ({
	href,
	className,
	children,
	...props
}: ActiveLinkProps) => {
	const pathname = usePathname();

	return (
		<Link
			className={cn(
				"flex items-center space-x-2 rounded-md p-1.5",
				pathname === href ? "bg-accent" : "",
				className
			)}
			href={href}
			{...props}
		>
			{children}
		</Link>
	);
};
