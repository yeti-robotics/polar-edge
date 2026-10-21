import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import coverageLibrary from "istanbul-lib-coverage";
import reportLibrary from "istanbul-lib-report";
import reports from "istanbul-reports";

const { createCoverageMap } = coverageLibrary;
const { createContext } = reportLibrary;

const rawDirectory = "coverage/raw";
const mergedDirectory = "coverage/merged";
const mergedFile = join(mergedDirectory, "merged-coverage.json");

if (process.argv[2] === "merge") {
  const coverage = createCoverageMap({});

  for (const file of (await readdir(rawDirectory)).filter((name) => name.endsWith(".json"))) {
    coverage.merge(JSON.parse(await readFile(join(rawDirectory, file), "utf8")));
  }

  await mkdir(mergedDirectory, { recursive: true });
  await writeFile(mergedFile, JSON.stringify(coverage.toJSON()));
} else if (process.argv[2] === "report") {
  const coverage = createCoverageMap(JSON.parse(await readFile(mergedFile, "utf8")));
  const context = createContext({ dir: "coverage/report", coverageMap: coverage });
  reports.create("html").execute(context);
} else {
  throw new Error("Expected merge or report");
}
