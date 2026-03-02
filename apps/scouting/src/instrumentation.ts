export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("running migration...");
    await import("./instrumentation.node");
  }
}
