// @vitest-environment jsdom

import { toast } from "@repo/ui/components/sonner";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createContext, type ReactNode, useContext } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { lookupAllianceTeams, submitDriveRanking } from "../actions";
import { DriveRankingForm } from "./DriveRankingForm";

const mockLookupAllianceTeams = vi.mocked(lookupAllianceTeams);
const mockSubmitDriveRanking = vi.mocked(submitDriveRanking);
const mockToastSuccess = vi.mocked(toast.success);
const mockToastError = vi.mocked(toast.error);

const teams = [
  { teamNumber: 111, teamName: "Alpha" },
  { teamNumber: 222, teamName: "Beta" },
  { teamNumber: 333, teamName: "Gamma" },
];

vi.mock("../actions", () => ({
  lookupAllianceTeams: vi.fn(),
  submitDriveRanking: vi.fn(),
}));

vi.mock("@repo/ui/components/sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("./SortableRankingList", () => ({
  SortableRankingList: ({
    teams,
    alliance,
    onReorder,
  }: {
    teams: { teamNumber: number; teamName: string }[];
    alliance: "red" | "blue";
    onReorder: (teams: { teamNumber: number; teamName: string }[]) => void;
  }) => (
    <div>
      <div data-testid="ranking-list" data-alliance={alliance}>
        {teams.map((team) => (
          <div key={team.teamNumber}>
            {team.teamNumber} - {team.teamName}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          const [firstTeam, secondTeam, thirdTeam] = teams;
          if (!firstTeam || !secondTeam || !thirdTeam) {
            return;
          }

          onReorder([thirdTeam, firstTeam, secondTeam]);
        }}
      >
        Reorder teams
      </button>
    </div>
  ),
}));

vi.mock("@repo/ui/components/radio-group", () => {
  const RadioGroupContext = createContext<{
    value?: string;
    onValueChange?: (value: string) => void;
  } | null>(null);

  return {
    RadioGroup: ({
      value,
      onValueChange,
      children,
      ...props
    }: {
      value?: string;
      onValueChange?: (value: string) => void;
      children: ReactNode;
    }) => (
      <div role="radiogroup" {...props}>
        <RadioGroupContext.Provider value={{ value, onValueChange }}>
          {children}
        </RadioGroupContext.Provider>
      </div>
    ),
    RadioGroupItem: ({ id, value, ...props }: { id?: string; value: string }) => {
      const group = useContext(RadioGroupContext);

      return (
        <input
          {...props}
          id={id}
          type="radio"
          checked={group?.value === value}
          onChange={() => group?.onValueChange?.(value)}
          value={value}
        />
      );
    },
  };
});

function renderForm() {
  return render(<DriveRankingForm />);
}

async function findTeams(matchNumber: number) {
  const user = userEvent.setup();
  const matchNumberInput = screen.getByLabelText("Match Number");

  await user.clear(matchNumberInput);
  await user.type(matchNumberInput, String(matchNumber));
  await user.click(screen.getByRole("button", { name: "Find Teams" }));

  return user;
}

describe("DriveRankingForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("attack coverage", () => {
    it("lookup rejection keeps the user out of ranking stage", async () => {
      mockLookupAllianceTeams.mockResolvedValue({ error: "Match 9 not found in active event" });

      renderForm();

      await findTeams(9);

      expect(await screen.findByText("Match 9 not found in active event")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Submit Ranking" })).not.toBeInTheDocument();
      expect(mockLookupAllianceTeams).toHaveBeenCalledWith(9, "red");
    });

    it("reordered teams are submitted in the scout's chosen order", async () => {
      mockLookupAllianceTeams.mockResolvedValue({
        matchId: "match-7",
        teams,
        alreadyRanked: false,
      });
      mockSubmitDriveRanking.mockResolvedValue({ success: true });

      renderForm();
      const user = await findTeams(7);

      await screen.findByRole("button", { name: "Submit Ranking" });
      await user.click(screen.getByRole("button", { name: "Reorder teams" }));
      await user.click(screen.getByRole("button", { name: "Submit Ranking" }));

      await waitFor(() => {
        expect(mockSubmitDriveRanking).toHaveBeenCalledWith({
          matchNumber: 7,
          alliance: "red",
          rankings: [333, 111, 222],
        });
      });
    });

    it("failed submit preserves the in-progress ranking instead of wiping the scout's work", async () => {
      mockLookupAllianceTeams.mockResolvedValue({
        matchId: "match-8",
        teams,
        alreadyRanked: true,
      });
      mockSubmitDriveRanking.mockResolvedValue({ error: "Submission failed" });

      renderForm();
      const user = await findTeams(8);

      await screen.findByText(/overwriting/i);
      await user.click(screen.getByRole("button", { name: "Submit Ranking" }));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Submission failed");
      });

      expect(screen.getByRole("button", { name: "Submit Ranking" })).toBeInTheDocument();
      expect(screen.getByText(/overwriting/i)).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Find Teams" })).not.toBeInTheDocument();
      expect(mockToastSuccess).not.toHaveBeenCalled();
    });
  });

  describe("gap-closing coverage", () => {
    it("selected alliance is forwarded to lookup instead of silently defaulting to red", async () => {
      mockLookupAllianceTeams.mockResolvedValue({
        matchId: "match-4",
        teams,
        alreadyRanked: false,
      });

      renderForm();
      const user = userEvent.setup();

      await user.type(screen.getByLabelText("Match Number"), "4");
      await user.click(screen.getByLabelText("Blue Alliance"));
      await user.click(screen.getByRole("button", { name: "Find Teams" }));

      await screen.findByRole("button", { name: "Submit Ranking" });

      expect(mockLookupAllianceTeams).toHaveBeenCalledWith(4, "blue");
      expect(screen.getByTestId("ranking-list")).toHaveAttribute("data-alliance", "blue");
    });

    it("lookup exceptions surface the generic failure message", async () => {
      mockLookupAllianceTeams.mockRejectedValue(new Error("network down"));

      renderForm();

      await findTeams(10);

      expect(await screen.findByText("Failed to lookup match")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Submit Ranking" })).not.toBeInTheDocument();
    });

    it("successful submit resets the flow so the next ranking starts clean", async () => {
      mockLookupAllianceTeams.mockResolvedValue({
        matchId: "match-12",
        teams,
        alreadyRanked: true,
      });
      mockSubmitDriveRanking.mockResolvedValue({ success: true });

      renderForm();
      const user = await findTeams(12);

      await screen.findByText(/overwriting/i);
      await user.click(screen.getByRole("button", { name: "Submit Ranking" }));

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith("Drive team ranking submitted");
      });

      expect(screen.getByRole("button", { name: "Find Teams" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Submit Ranking" })).not.toBeInTheDocument();
      expect(screen.queryByText(/overwriting/i)).not.toBeInTheDocument();
      expect(screen.getByLabelText("Match Number")).toHaveValue(null);
    });
  });
});
