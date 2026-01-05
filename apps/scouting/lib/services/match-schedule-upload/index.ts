import "server-only";
import { insertMatchSchedule } from "./db";
import { ValidationError } from "./errors";
import { parseCsv } from "./parser";
import { csvRowToDbRow } from "./transformers";
import { UploadOptions, UploadResult } from "./types";

export async function uploadMatchSchedule(
	opts: UploadOptions
): Promise<UploadResult> {
	if (!opts.csvBuffer?.length) {
		throw new ValidationError("CSV file is empty");
	}
	if (!opts.eventCode?.trim()) {
		throw new ValidationError("Event code is required");
	}

	const recordsIter = (async function* () {
		for await (const row of parseCsv(opts.csvBuffer)) {
			yield csvRowToDbRow(row, opts.eventCode.trim());
		}
	})();

	return insertMatchSchedule(opts, recordsIter);
}
