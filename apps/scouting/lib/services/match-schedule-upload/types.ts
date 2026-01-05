export interface RawCsvRow {
	matchNumber: number;
	blue: [number, number, number];
	red: [number, number, number];
}

export interface UploadResult {
	tournamentInserted: number;
	teamsInserted: number;
	matchesInserted: number;
	teamMatchesInserted: number;
}

export interface UploadOptions {
	eventCode: string;
	eventName: string;
	startDate: Date;
	endDate: Date;
	csvBuffer: Buffer;
}
