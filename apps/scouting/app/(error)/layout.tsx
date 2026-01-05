import { Button } from "@repo/ui/components/button";
import Link from "next/link";

export default function ErrorPageLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<main className="prose dark:prose-invert">
			<section className="flex h-screen w-screen items-center justify-center text-center">
				<div>
					{children}
					<Link href="/">
						<Button variant="link" className="mt-4">
							Go Home
						</Button>
					</Link>
				</div>
			</section>
		</main>
	);
}
