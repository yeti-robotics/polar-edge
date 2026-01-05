import { StageMetadata } from "../../data/schema";

export function FormStep({
	stage,
	children,
}: {
	stage: StageMetadata;
	children: React.ReactNode;
}) {
	return (
		<div>
			<h2>{stage.title}</h2>
			<p>{stage.description}</p>
			{children}
		</div>
	);
}
