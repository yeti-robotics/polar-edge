export async function register() {
	// eslint-disable-next-line turbo/no-undeclared-env-vars
	if (process.env.NEXT_RUNTIME === "nodejs") {
		console.log("running migration...");
		await import("./instrumentation.node");
	}
}
