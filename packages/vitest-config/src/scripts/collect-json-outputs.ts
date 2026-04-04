import { access, cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { glob } from "glob";

const RAW_DIR = "coverage/raw";

function replaceDotPatterns(path: string): string {
  return path.replaceAll("../", "").replaceAll("./", "");
}

async function collectJsonOutputs(): Promise<void> {
  await rm(RAW_DIR, { recursive: true, force: true });
  await mkdir(RAW_DIR, { recursive: true });

  const entries = await glob(["../../apps/*", "../../packages/*"], {
    withFileTypes: true,
  });

  const withCoverage: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const coverageFile = join(entry.fullpath(), "coverage.json");

    try {
      await access(coverageFile);
      await cp(coverageFile, join(RAW_DIR, `${entry.name}.json`));
      withCoverage.push(replaceDotPatterns(entry.relative()));
    } catch {
      // No coverage.json in this directory — skip
    }
  }

  if (withCoverage.length === 0) {
    console.log("No coverage.json files found. Run tests first (pnpm test).");
    process.exit(1);
  }

  console.log(`Coverage found in: ${withCoverage.join(", ")}`);
  console.log(`Collected to ./${RAW_DIR}`);
}

collectJsonOutputs();
