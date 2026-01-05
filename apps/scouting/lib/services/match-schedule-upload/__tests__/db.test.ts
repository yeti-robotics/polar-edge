import { insertMatchSchedule } from "../db";
import { UploadOptions } from "../types";

import { db } from "@/lib/database";
import { Alliance } from "@/lib/database/schema";
import * as schema from "@/lib/database/schema";

// Mock the database module
jest.mock("@/lib/database", () => ({
	db: {
		transaction: jest.fn(),
	},
}));

// Mock the schema module
jest.mock("@/lib/database/schema", () => ({
	team: "team_table",
	match: "match_table",
	teamMatch: "team_match_table",
	tournament: "tournament_table",
	Alliance: {
		RED: "red",
		BLUE: "blue",
		EMPTY: "",
	},
}));

const mockDb = db as jest.Mocked<typeof db>;

// Define proper types for the mock transaction
type MockTransaction = {
	insert: jest.MockedFunction<() => MockTransaction>;
	values: jest.MockedFunction<(values: unknown) => MockTransaction>;
	onConflictDoNothing: jest.MockedFunction<() => MockTransaction>;
	execute: jest.MockedFunction<() => Promise<{ rowCount: number | null }>>;
};

// Define the type for the async generator
type DbRow = {
	matchRecord: {
		id: string;
		compLevel: string;
		setNumber: number;
		matchNumber: number;
		eventKey: string;
		winningAlliance: Alliance;
	};
	teamMatchRecords: Array<{
		matchId: string;
		teamNumber: number;
		alliance: Alliance;
		alliancePosition: number;
	}>;
	teamRecords: Array<{
		teamNumber: number;
		teamName: string;
	}>;
};

describe("insertMatchSchedule", () => {
	const mockUploadOptions: UploadOptions = {
		eventCode: "test",
		eventName: "Test Event",
		startDate: new Date("2024-01-01"),
		endDate: new Date("2024-01-02"),
		csvBuffer: Buffer.from("test"),
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should insert single match successfully", async () => {
		// Mock transaction
		const mockTx: MockTransaction = {
			insert: jest.fn().mockReturnThis(),
			values: jest.fn().mockReturnThis(),
			onConflictDoNothing: jest.fn().mockReturnThis(),
			execute: jest.fn().mockResolvedValue({ rowCount: 1 }),
		};

		mockDb.transaction.mockImplementation(async (callback) => {
			return await callback(
				mockTx as unknown as Parameters<typeof callback>[0]
			);
		});

		// Create test data
		const testRows: DbRow[] = [
			{
				matchRecord: {
					id: "test_qm1_1",
					compLevel: "qm",
					setNumber: 1,
					matchNumber: 1,
					eventKey: "test",
					winningAlliance: Alliance.EMPTY,
				},
				teamMatchRecords: [
					{
						matchId: "test_qm1_1",
						teamNumber: 1,
						alliance: Alliance.BLUE,
						alliancePosition: 1,
					},
					{
						matchId: "test_qm1_1",
						teamNumber: 2,
						alliance: Alliance.RED,
						alliancePosition: 1,
					},
				],
				teamRecords: [
					{ teamNumber: 1, teamName: "" },
					{ teamNumber: 2, teamName: "" },
				],
			},
		];

		// Create async generator for test data
		async function* generateRows(): AsyncIterable<DbRow> {
			for (const row of testRows) {
				yield row;
			}
		}

		const result = await insertMatchSchedule(
			mockUploadOptions,
			generateRows()
		);

		// Verify transaction was called
		expect(mockDb.transaction).toHaveBeenCalledTimes(1);

		// Verify tournament insertion
		expect(mockTx.insert).toHaveBeenCalledWith(schema.tournament);
		expect(mockTx.values).toHaveBeenCalledWith({
			id: mockUploadOptions.eventCode,
			eventName: mockUploadOptions.eventName,
			startDate: mockUploadOptions.startDate.toISOString(),
			endDate: mockUploadOptions.endDate.toISOString(),
		});

		// Verify team insertions
		expect(mockTx.insert).toHaveBeenCalledWith(schema.team);
		expect(mockTx.values).toHaveBeenCalledWith(testRows[0]!.teamRecords);
		expect(mockTx.onConflictDoNothing).toHaveBeenCalled();
		expect(mockTx.execute).toHaveBeenCalled();

		// Verify match insertions
		expect(mockTx.insert).toHaveBeenCalledWith(schema.match);
		expect(mockTx.values).toHaveBeenCalledWith(testRows[0]!.matchRecord);

		// Verify team match insertions
		expect(mockTx.insert).toHaveBeenCalledWith(schema.teamMatch);
		expect(mockTx.values).toHaveBeenCalledWith(
			testRows[0]!.teamMatchRecords
		);

		// Verify result - includes tournament insertion
		expect(result).toEqual({
			tournamentInserted: 1,
			teamsInserted: 1,
			matchesInserted: 1,
			teamMatchesInserted: 1,
		});
	});

	it("should insert multiple matches successfully", async () => {
		// Mock transaction
		const mockTx: MockTransaction = {
			insert: jest.fn().mockReturnThis(),
			values: jest.fn().mockReturnThis(),
			onConflictDoNothing: jest.fn().mockReturnThis(),
			execute: jest.fn().mockResolvedValue({ rowCount: 1 }),
		};

		mockDb.transaction.mockImplementation(async (callback) => {
			return await callback(
				mockTx as unknown as Parameters<typeof callback>[0]
			);
		});

		// Create test data for multiple matches
		const testRows: DbRow[] = [
			{
				matchRecord: {
					id: "test_qm1_1",
					compLevel: "qm",
					setNumber: 1,
					matchNumber: 1,
					eventKey: "test",
					winningAlliance: Alliance.EMPTY,
				},
				teamMatchRecords: [
					{
						matchId: "test_qm1_1",
						teamNumber: 1,
						alliance: Alliance.BLUE,
						alliancePosition: 1,
					},
					{
						matchId: "test_qm1_1",
						teamNumber: 2,
						alliance: Alliance.RED,
						alliancePosition: 1,
					},
				],
				teamRecords: [
					{ teamNumber: 1, teamName: "" },
					{ teamNumber: 2, teamName: "" },
				],
			},
			{
				matchRecord: {
					id: "test_qm1_2",
					compLevel: "qm",
					setNumber: 1,
					matchNumber: 2,
					eventKey: "test",
					winningAlliance: Alliance.EMPTY,
				},
				teamMatchRecords: [
					{
						matchId: "test_qm1_2",
						teamNumber: 3,
						alliance: Alliance.BLUE,
						alliancePosition: 1,
					},
					{
						matchId: "test_qm1_2",
						teamNumber: 4,
						alliance: Alliance.RED,
						alliancePosition: 1,
					},
				],
				teamRecords: [
					{ teamNumber: 3, teamName: "" },
					{ teamNumber: 4, teamName: "" },
				],
			},
		];

		// Create async generator for test data
		async function* generateRows(): AsyncIterable<DbRow> {
			for (const row of testRows) {
				yield row;
			}
		}

		const result = await insertMatchSchedule(
			mockUploadOptions,
			generateRows()
		);

		// Verify transaction was called
		expect(mockDb.transaction).toHaveBeenCalledTimes(1);

		// Verify execute was called for each match (1 tournament + 3 insertions per match)
		expect(mockTx.execute).toHaveBeenCalledTimes(7);

		// Verify result - includes tournament insertion
		expect(result).toEqual({
			tournamentInserted: 1,
			teamsInserted: 2,
			matchesInserted: 2,
			teamMatchesInserted: 2,
		});
	});

	it("should handle empty rows gracefully", async () => {
		// Mock transaction
		const mockTx: MockTransaction = {
			insert: jest.fn().mockReturnThis(),
			values: jest.fn().mockReturnThis(),
			onConflictDoNothing: jest.fn().mockReturnThis(),
			execute: jest.fn().mockResolvedValue({ rowCount: 1 }), // Tournament should be inserted
		};

		mockDb.transaction.mockImplementation(async (callback) => {
			return await callback(
				mockTx as unknown as Parameters<typeof callback>[0]
			);
		});

		// Create empty async generator
		async function* generateEmptyRows(): AsyncIterable<DbRow> {
			// No rows to yield
		}

		const result = await insertMatchSchedule(
			mockUploadOptions,
			generateEmptyRows()
		);

		// Verify transaction was called
		expect(mockDb.transaction).toHaveBeenCalledTimes(1);

		// Verify tournament was inserted but no other operations
		expect(mockTx.insert).toHaveBeenCalledWith(schema.tournament);
		expect(mockTx.execute).toHaveBeenCalledTimes(1);

		// Verify result
		expect(result).toEqual({
			tournamentInserted: 1,
			teamsInserted: 0,
			matchesInserted: 0,
			teamMatchesInserted: 0,
		});
	});

	it("should handle database conflicts with onConflictDoNothing", async () => {
		// Mock transaction with different row counts to simulate conflicts
		const mockTx: MockTransaction = {
			insert: jest.fn().mockReturnThis(),
			values: jest.fn().mockReturnThis(),
			onConflictDoNothing: jest.fn().mockReturnThis(),
			execute: jest
				.fn()
				.mockResolvedValueOnce({ rowCount: 0 }) // Tournament already exists
				.mockResolvedValueOnce({ rowCount: 0 }) // Team already exists
				.mockResolvedValueOnce({ rowCount: 1 }) // Match inserted
				.mockResolvedValueOnce({ rowCount: 0 }) // Team match already exists
				.mockResolvedValueOnce({ rowCount: 1 }) // Team inserted
				.mockResolvedValueOnce({ rowCount: 1 }) // Match inserted
				.mockResolvedValueOnce({ rowCount: 0 }), // Team match already exists
		};

		mockDb.transaction.mockImplementation(async (callback) => {
			return await callback(
				mockTx as unknown as Parameters<typeof callback>[0]
			);
		});

		// Create test data
		const testRows: DbRow[] = [
			{
				matchRecord: {
					id: "test_qm1_1",
					compLevel: "qm",
					setNumber: 1,
					matchNumber: 1,
					eventKey: "test",
					winningAlliance: Alliance.EMPTY,
				},
				teamMatchRecords: [
					{
						matchId: "test_qm1_1",
						teamNumber: 1,
						alliance: Alliance.BLUE,
						alliancePosition: 1,
					},
				],
				teamRecords: [{ teamNumber: 1, teamName: "" }],
			},
			{
				matchRecord: {
					id: "test_qm1_2",
					compLevel: "qm",
					setNumber: 1,
					matchNumber: 2,
					eventKey: "test",
					winningAlliance: Alliance.EMPTY,
				},
				teamMatchRecords: [
					{
						matchId: "test_qm1_2",
						teamNumber: 2,
						alliance: Alliance.BLUE,
						alliancePosition: 1,
					},
				],
				teamRecords: [{ teamNumber: 2, teamName: "" }],
			},
		];

		// Create async generator for test data
		async function* generateRows(): AsyncIterable<DbRow> {
			for (const row of testRows) {
				yield row;
			}
		}

		const result = await insertMatchSchedule(
			mockUploadOptions,
			generateRows()
		);

		// Verify result reflects actual insertions (not conflicts)
		expect(result).toEqual({
			tournamentInserted: 0, // Tournament already existed
			teamsInserted: 1, // Only 1 team was actually inserted
			matchesInserted: 2, // Both matches were inserted
			teamMatchesInserted: 0, // No team matches were inserted due to conflicts
		});
	});

	it("should handle null rowCount from database", async () => {
		// Mock transaction with null rowCount
		const mockTx: MockTransaction = {
			insert: jest.fn().mockReturnThis(),
			values: jest.fn().mockReturnThis(),
			onConflictDoNothing: jest.fn().mockReturnThis(),
			execute: jest.fn().mockResolvedValue({ rowCount: null }),
		};

		mockDb.transaction.mockImplementation(async (callback) => {
			return await callback(
				mockTx as unknown as Parameters<typeof callback>[0]
			);
		});

		// Create test data
		const testRows: DbRow[] = [
			{
				matchRecord: {
					id: "test_qm1_1",
					compLevel: "qm",
					setNumber: 1,
					matchNumber: 1,
					eventKey: "test",
					winningAlliance: Alliance.EMPTY,
				},
				teamMatchRecords: [],
				teamRecords: [],
			},
		];

		// Create async generator for test data
		async function* generateRows(): AsyncIterable<DbRow> {
			for (const row of testRows) {
				yield row;
			}
		}

		const result = await insertMatchSchedule(
			mockUploadOptions,
			generateRows()
		);

		// Verify result handles null rowCount correctly
		expect(result).toEqual({
			tournamentInserted: 0,
			teamsInserted: 0,
			matchesInserted: 0,
			teamMatchesInserted: 0,
		});
	});

	it("should propagate database transaction errors", async () => {
		// Mock transaction to throw an error
		const dbError = new Error("Database connection failed");
		mockDb.transaction.mockRejectedValue(dbError);

		// Create test data
		const testRows: DbRow[] = [
			{
				matchRecord: {
					id: "test_qm1_1",
					compLevel: "qm",
					setNumber: 1,
					matchNumber: 1,
					eventKey: "test",
					winningAlliance: Alliance.EMPTY,
				},
				teamMatchRecords: [],
				teamRecords: [],
			},
		];

		// Create async generator for test data
		async function* generateRows(): AsyncIterable<DbRow> {
			for (const row of testRows) {
				yield row;
			}
		}

		await expect(
			insertMatchSchedule(mockUploadOptions, generateRows())
		).rejects.toThrow("Database connection failed");
	});

	it("should propagate database execution errors", async () => {
		// Mock transaction with execution error
		const mockTx: MockTransaction = {
			insert: jest.fn().mockReturnThis(),
			values: jest.fn().mockReturnThis(),
			onConflictDoNothing: jest.fn().mockReturnThis(),
			execute: jest.fn().mockRejectedValue(new Error("Insert failed")),
		};

		mockDb.transaction.mockImplementation(async (callback) => {
			return await callback(
				mockTx as unknown as Parameters<typeof callback>[0]
			);
		});

		// Create test data
		const testRows: DbRow[] = [
			{
				matchRecord: {
					id: "test_qm1_1",
					compLevel: "qm",
					setNumber: 1,
					matchNumber: 1,
					eventKey: "test",
					winningAlliance: Alliance.EMPTY,
				},
				teamMatchRecords: [],
				teamRecords: [],
			},
		];

		// Create async generator for test data
		async function* generateRows(): AsyncIterable<DbRow> {
			for (const row of testRows) {
				yield row;
			}
		}

		await expect(
			insertMatchSchedule(mockUploadOptions, generateRows())
		).rejects.toThrow("Insert failed");
	});

	it("should handle large datasets efficiently", async () => {
		// Mock transaction
		const mockTx: MockTransaction = {
			insert: jest.fn().mockReturnThis(),
			values: jest.fn().mockReturnThis(),
			onConflictDoNothing: jest.fn().mockReturnThis(),
			execute: jest.fn().mockResolvedValue({ rowCount: 1 }),
		};

		mockDb.transaction.mockImplementation(async (callback) => {
			return await callback(
				mockTx as unknown as Parameters<typeof callback>[0]
			);
		});

		// Create large dataset (100 matches)
		const testRows: DbRow[] = Array.from({ length: 100 }, (_, i) => ({
			matchRecord: {
				id: `test_qm1_${i + 1}`,
				compLevel: "qm",
				setNumber: 1,
				matchNumber: i + 1,
				eventKey: "test",
				winningAlliance: Alliance.EMPTY,
			},
			teamMatchRecords: [
				{
					matchId: `test_qm1_${i + 1}`,
					teamNumber: i * 2 + 1,
					alliance: Alliance.BLUE,
					alliancePosition: 1,
				},
				{
					matchId: `test_qm1_${i + 1}`,
					teamNumber: i * 2 + 2,
					alliance: Alliance.RED,
					alliancePosition: 1,
				},
			],
			teamRecords: [
				{ teamNumber: i * 2 + 1, teamName: "" },
				{ teamNumber: i * 2 + 2, teamName: "" },
			],
		}));

		// Create async generator for test data
		async function* generateRows(): AsyncIterable<DbRow> {
			for (const row of testRows) {
				yield row;
			}
		}

		const result = await insertMatchSchedule(
			mockUploadOptions,
			generateRows()
		);

		// Verify transaction was called
		expect(mockDb.transaction).toHaveBeenCalledTimes(1);

		// Verify execute was called for each match (1 tournament + 3 insertions per match)
		expect(mockTx.execute).toHaveBeenCalledTimes(301);

		// Verify result - includes tournament insertion
		expect(result).toEqual({
			tournamentInserted: 1,
			teamsInserted: 100,
			matchesInserted: 100,
			teamMatchesInserted: 100,
		});
	});
});
