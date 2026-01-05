import { errorExplanations } from "@/lib/auth/utils";

export default async function ErrorPage(props: {
	searchParams: Promise<Record<string, string>>;
}) {
	const searchParams = await props.searchParams;
	const errorMessage = searchParams["error"] ?? "UNKNOWN_ERROR";

	return (
		<div>
			<div className="text-xl">Error: {errorMessage}</div>
			{errorExplanations[errorMessage] && (
				<div className="mx-8 mt-4 text-wrap">
					{errorExplanations[errorMessage]}
				</div>
			)}
		</div>
	);
}
