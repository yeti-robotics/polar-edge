// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createContext, type InputHTMLAttributes, type ReactNode, useContext } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkabilityForm } from "./WorkabilityForm";

const mockSubmitWorkabilityForm = vi.fn();

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);

const ComboboxContext = createContext<{
  itemToStringLabel?: (value: string) => string;
  items: unknown[];
  onValueChange?: (value: string) => void;
  value: string;
} | null>(null);

vi.mock("../actions", () => ({
  submitWorkabilityForm: (...args: unknown[]) => mockSubmitWorkabilityForm(...args),
}));

vi.mock("@repo/ui/components/sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@repo/ui/components/combobox", () => ({
  Combobox: ({
    children,
    itemToStringLabel,
    items,
    onValueChange,
    value,
  }: {
    children: ReactNode;
    itemToStringLabel?: (value: string) => string;
    items: unknown[];
    onValueChange?: (value: string) => void;
    value?: string;
  }) => (
    <ComboboxContext.Provider
      value={{
        itemToStringLabel,
        items,
        onValueChange,
        value: value ?? "",
      }}
    >
      <div>{children}</div>
    </ComboboxContext.Provider>
  ),
  ComboboxContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  ComboboxEmpty: ({ children }: { children: ReactNode }) => {
    const context = useContext(ComboboxContext);

    if ((context?.items.length ?? 0) > 0) {
      return null;
    }

    return <div>{children}</div>;
  },
  ComboboxInput: ({
    disabled,
    placeholder,
    ...props
  }: InputHTMLAttributes<HTMLInputElement>) => {
    const context = useContext(ComboboxContext);
    const displayValue = context?.value
      ? (context.itemToStringLabel?.(context.value) ?? context.value)
      : "";

    return (
      <input
        {...props}
        disabled={disabled}
        placeholder={placeholder}
        readOnly
        value={displayValue}
      />
    );
  },
  ComboboxItem: ({ children, value }: { children: ReactNode; value: string }) => {
    const context = useContext(ComboboxContext);

    return (
      <button type="button" onClick={() => context?.onValueChange?.(value)}>
        {children}
      </button>
    );
  },
  ComboboxList: ({
    children,
  }: {
    children: ((item: any) => ReactNode) | ReactNode;
  }) => {
    const context = useContext(ComboboxContext);

    if (typeof children !== "function") {
      return <div>{children}</div>;
    }

    return <div>{(context?.items ?? []).map((item) => children(item))}</div>;
  },
}));

const matchOptions = [
  {
    matchNumber: 12,
    teams: [
      { teamNumber: 111, teamName: "Alpha", alliance: "red" as const, position: 1 },
      { teamNumber: 222, teamName: "Beta", alliance: "red" as const, position: 2 },
    ],
  },
  {
    matchNumber: 13,
    teams: [
      { teamNumber: 333, teamName: "Gamma", alliance: "blue" as const, position: 1 },
      { teamNumber: 444, teamName: "Delta", alliance: "blue" as const, position: 2 },
    ],
  },
];

describe("WorkabilityForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("attack coverage", () => {
    it("selected match does not leave the dependent team picker stuck in its disabled pre-match state", async () => {
      render(<WorkabilityForm matchOptions={matchOptions} initialSubmissions={[]} />);
      const user = userEvent.setup();

      const teamInput = screen.getByLabelText("Team number");
      expect(teamInput).toBeDisabled();
      expect(teamInput).toHaveAttribute("placeholder", "Choose a match first");

      await user.click(screen.getByRole("button", { name: /match 12/i }));

      await waitFor(() => {
        expect(screen.getByLabelText("Team number")).toBeEnabled();
      });

      expect(screen.getByLabelText("Team number")).toHaveAttribute(
        "placeholder",
        "Select a team from the chosen match"
      );
      expect(screen.getByRole("button", { name: /111 - alpha/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /222 - beta/i })).toBeInTheDocument();
    });
  });

  describe("gap-closing coverage", () => {
    it("team selection hydrates the saved notes for that exact match-team-role combination", async () => {
      render(
        <WorkabilityForm
          matchOptions={matchOptions}
          initialSubmissions={[
            {
              id: "submission-1",
              matchNumber: 12,
              teamNumber: 222,
              role: "driver",
              rating: 5,
              notes: "Easy to coordinate cycles with",
              updatedAt: "2026-04-06T12:00:00.000Z",
            },
          ]}
        />
      );
      const user = userEvent.setup();

      await user.click(screen.getByRole("button", { name: /match 12/i }));
      await user.click(screen.getByRole("button", { name: /222 - beta/i }));

      await waitFor(() => {
        expect(screen.getByLabelText("Qualitative notes")).toHaveValue(
          "Easy to coordinate cycles with"
        );
      });

      expect(screen.getByText("5 / 5")).toBeInTheDocument();
    });
  });
});
