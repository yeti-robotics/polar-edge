import { MemoryCache } from "../../../cache/memoryCache";
import { Match, Alliance } from "../../../schemas/match";
import { Cage } from "../../../schemas/match-breakdowns/reefscape-2025";
import { YETIBlueClient } from "../../yetiBlue";

import axios, { AxiosInstance } from "axios";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("Modules - Matches", () => {
	let client: YETIBlueClient;
	let cache: MemoryCache<unknown>;
	let mockAxiosInstance: jest.Mocked<AxiosInstance>;

	const mockMatch: Omit<Match, "year"> = {
		key: "2025test_qm1",
		comp_level: "qm",
		set_number: 1,
		match_number: 1,
		alliances: {
			red: {
				score: 100,
				team_keys: ["frc3506", "frc3507", "frc3508"],
				surrogate_team_keys: [],
				dq_team_keys: [],
			},
			blue: {
				score: 95,
				team_keys: ["frc3509", "frc3510", "frc3511"],
				surrogate_team_keys: [],
				dq_team_keys: [],
			},
		},
		winning_alliance: Alliance.RED,
		event_key: "2025test",
		time: 1234567890,
		actual_time: 1234567890,
		predicted_time: 1234567890,
		post_result_time: 1234567890,
		score_breakdown: {
			red: {
				adjustPoints: 0,
				algaePoints: 10,
				autoBonusAchieved: true,
				autoCoralCount: 5,
				autoCoralPoints: 25,
				autoLineRobot1: "Yes",
				autoLineRobot2: "Yes",
				autoLineRobot3: "Yes",
				autoMobilityPoints: 15,
				autoPoints: 40,
				autoReef: {
					topRow: {
						nodeA: true,
						nodeB: false,
						nodeC: true,
						nodeD: false,
						nodeE: true,
						nodeF: false,
						nodeG: true,
						nodeH: false,
						nodeI: true,
						nodeJ: false,
						nodeK: true,
						nodeL: false,
					},
					midRow: {
						nodeA: false,
						nodeB: true,
						nodeC: false,
						nodeD: true,
						nodeE: false,
						nodeF: true,
						nodeG: false,
						nodeH: true,
						nodeI: false,
						nodeJ: true,
						nodeK: false,
						nodeL: true,
					},
					botRow: {
						nodeA: true,
						nodeB: false,
						nodeC: true,
						nodeD: false,
						nodeE: true,
						nodeF: false,
						nodeG: true,
						nodeH: false,
						nodeI: true,
						nodeJ: false,
						nodeK: true,
						nodeL: false,
					},
					trough: 3,
				},
				bargeBonusAchieved: true,
				coopertitionCriteriaMet: true,
				coralBonusAchieved: true,
				endGameBargePoints: 10,
				endGameRobot1: Cage.DEEP,
				endGameRobot2: Cage.SHALLOW,
				endGameRobot3: Cage.PARK,
				foulCount: 0,
				foulPoints: 0,
				g206Penalty: false,
				g408Penalty: false,
				g424Penalty: false,
				netAlgaeCount: 5,
				rp: 2,
				techFoulCount: 0,
				teleopCoralCount: 8,
				teleopCoralPoints: 40,
				teleopPoints: 50,
				totalPoints: 100,
				teleopReef: {
					topRow: {
						nodeA: true,
						nodeB: false,
						nodeC: true,
						nodeD: false,
						nodeE: true,
						nodeF: false,
						nodeG: true,
						nodeH: false,
						nodeI: true,
						nodeJ: false,
						nodeK: true,
						nodeL: false,
					},
					midRow: {
						nodeA: false,
						nodeB: true,
						nodeC: false,
						nodeD: true,
						nodeE: false,
						nodeF: true,
						nodeG: false,
						nodeH: true,
						nodeI: false,
						nodeJ: true,
						nodeK: false,
						nodeL: true,
					},
					botRow: {
						nodeA: true,
						nodeB: false,
						nodeC: true,
						nodeD: false,
						nodeE: true,
						nodeF: false,
						nodeG: true,
						nodeH: false,
						nodeI: true,
						nodeJ: false,
						nodeK: true,
						nodeL: false,
					},
					trough: 4,
				},
				wallAlgaeCount: 3,
			},
			blue: {
				adjustPoints: 0,
				algaePoints: 8,
				autoBonusAchieved: true,
				autoCoralCount: 4,
				autoCoralPoints: 20,
				autoLineRobot1: "Yes",
				autoLineRobot2: "Yes",
				autoLineRobot3: "Yes",
				autoMobilityPoints: 15,
				autoPoints: 35,
				autoReef: {
					topRow: {
						nodeA: true,
						nodeB: false,
						nodeC: true,
						nodeD: false,
						nodeE: true,
						nodeF: false,
						nodeG: true,
						nodeH: false,
						nodeI: true,
						nodeJ: false,
						nodeK: true,
						nodeL: false,
					},
					midRow: {
						nodeA: false,
						nodeB: true,
						nodeC: false,
						nodeD: true,
						nodeE: false,
						nodeF: true,
						nodeG: false,
						nodeH: true,
						nodeI: false,
						nodeJ: true,
						nodeK: false,
						nodeL: true,
					},
					botRow: {
						nodeA: true,
						nodeB: false,
						nodeC: true,
						nodeD: false,
						nodeE: true,
						nodeF: false,
						nodeG: true,
						nodeH: false,
						nodeI: true,
						nodeJ: false,
						nodeK: true,
						nodeL: false,
					},
					trough: 2,
				},
				bargeBonusAchieved: true,
				coopertitionCriteriaMet: true,
				coralBonusAchieved: true,
				endGameBargePoints: 10,
				endGameRobot1: Cage.DEEP,
				endGameRobot2: Cage.SHALLOW,
				endGameRobot3: Cage.PARK,
				foulCount: 0,
				foulPoints: 0,
				g206Penalty: false,
				g408Penalty: false,
				g424Penalty: false,
				netAlgaeCount: 4,
				rp: 2,
				techFoulCount: 0,
				teleopCoralCount: 7,
				teleopCoralPoints: 35,
				teleopPoints: 45,
				totalPoints: 95,
				teleopReef: {
					topRow: {
						nodeA: true,
						nodeB: false,
						nodeC: true,
						nodeD: false,
						nodeE: true,
						nodeF: false,
						nodeG: true,
						nodeH: false,
						nodeI: true,
						nodeJ: false,
						nodeK: true,
						nodeL: false,
					},
					midRow: {
						nodeA: false,
						nodeB: true,
						nodeC: false,
						nodeD: true,
						nodeE: false,
						nodeF: true,
						nodeG: false,
						nodeH: true,
						nodeI: false,
						nodeJ: true,
						nodeK: false,
						nodeL: true,
					},
					botRow: {
						nodeA: true,
						nodeB: false,
						nodeC: true,
						nodeD: false,
						nodeE: true,
						nodeF: false,
						nodeG: true,
						nodeH: false,
						nodeI: true,
						nodeJ: false,
						nodeK: true,
						nodeL: false,
					},
					trough: 3,
				},
				wallAlgaeCount: 2,
			},
		},
		videos: [],
	};

	beforeEach(() => {
		cache = new MemoryCache<unknown>();
		mockAxiosInstance = {
			get: jest.fn(),
		} as unknown as jest.Mocked<AxiosInstance>;
		mockedAxios.create.mockReturnValue(mockAxiosInstance);
		client = new YETIBlueClient({
			apiKey: "test",
			baseUrl: "",
			cache,
			defaultCache: true,
		});
	});

	it("gets event matches", async () => {
		mockAxiosInstance.get.mockResolvedValue({
			headers: {
				"Cache-Control": "max-age=3600",
				ETag: "1234567890",
			},
			data: [mockMatch],
		});

		const result = await client.matches.getEventMatchesSimple("2025test");
		expect(result).toBeDefined();
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({ ...mockMatch, year: 2025 });
	});

	it("checks cache before making API call for event matches", async () => {
		// Setup cache spy
		const cacheSpy = jest.spyOn(cache, "get");
		cache.set("/event/2025test/matches", {
			value: [mockMatch],
			metadata: {
				etag: "1234567890",
				timestamp: Date.now(),
				maxAge: 3600,
			},
		});

		mockAxiosInstance.get.mockResolvedValue({
			data: [mockMatch],
			status: 200,
			headers: {
				"Cache-Control": "max-age=3600",
				etag: "1234567890",
			},
		});

		const result = await client.matches.getEventMatchesSimple("2025test", {
			cache: true,
		});

		expect(cacheSpy).toHaveBeenCalledWith("/event/2025test/matches");
		expect(result).toEqual([{ ...mockMatch, year: 2025 }]);
	});

	it("stores event matches response in cache", async () => {
		mockAxiosInstance.get.mockResolvedValue({
			data: [mockMatch],
			status: 200,
			headers: {
				"Cache-Control": "max-age=3600",
				etag: "1234567890",
			},
		});

		const cacheSpy = jest.spyOn(cache, "set");

		await client.matches.getEventMatchesSimple("2025test", { cache: true });

		expect(cacheSpy).toHaveBeenCalledWith("/event/2025test/matches", {
			value: [mockMatch],
			metadata: {
				etag: "1234567890",
				maxAge: 3600,
				timestamp: expect.any(Number),
			},
		});
	});

	it("validates match data structure", async () => {
		const invalidMatch = {
			...mockMatch,
			comp_level: "invalid_level", // Invalid comp_level
		};

		mockAxiosInstance.get.mockResolvedValue({
			data: [invalidMatch],
			status: 200,
			headers: {
				"Cache-Control": "max-age=3600",
				etag: "1234567890",
			},
		});

		await expect(
			client.matches.getEventMatchesSimple("2025test")
		).rejects.toThrow();
	});

	it("gets match by key", async () => {
		mockAxiosInstance.get.mockResolvedValue({
			data: mockMatch,
			status: 200,
			headers: {
				"Cache-Control": "max-age=3600",
				etag: "1234567890",
			},
		});

		const result = await client.matches.getMatchByKey("2025test_qm1");
		expect(result).toEqual({ ...mockMatch, year: 2025 });
	});
});
