// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ShootingActiveLayout } from "./ShootingActiveLayout";

const mocks = vi.hoisted(() => ({
  cancelAction: vi.fn(),
  completeShootingCycle: vi.fn(),
  requiresManualFuelEstimate: false,
  useElapsedTime: vi.fn(() => 4),
}));

vi.mock("../contexts/ActionStateContext", () => ({
  useActionState: () => ({
    state: { activeAction: { type: "shooting", phase: "teleop", startedAt: 1_000 } },
  }),
}));

vi.mock("../contexts/FormDataContext", () => ({
  useFormData: () => ({
    state: { requiresManualFuelEstimate: mocks.requiresManualFuelEstimate },
  }),
}));

vi.mock("../hooks/useElapsedTime", () => ({
  useElapsedTime: mocks.useElapsedTime,
}));

vi.mock("../hooks/useStandFormActions", () => ({
  useStandFormActions: () => ({
    cancelAction: mocks.cancelAction,
    completeShootingCycle: mocks.completeShootingCycle,
  }),
}));

describe("ShootingActiveLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requiresManualFuelEstimate = false;
  });

  it("ends immediately without a manual estimate when COPR exists", async () => {
    const user = userEvent.setup();
    render(<ShootingActiveLayout />);

    await user.click(screen.getByRole("button", { name: "End Shoot" }));

    expect(mocks.completeShootingCycle).toHaveBeenCalledOnce();
    expect(mocks.completeShootingCycle).toHaveBeenCalledWith();
  });

  it("freezes the timer while collecting a required manual estimate", async () => {
    const user = userEvent.setup();
    mocks.requiresManualFuelEstimate = true;
    vi.spyOn(Date, "now").mockReturnValue(5_000);
    render(<ShootingActiveLayout />);

    await user.click(screen.getByRole("button", { name: "End Shoot" }));
    expect(mocks.useElapsedTime).toHaveBeenLastCalledWith(1_000, 5_000);

    await user.click(screen.getByLabelText("Medium (3–5 balls/sec)"));
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(mocks.completeShootingCycle).toHaveBeenCalledWith(3, 5_000);
  });
});
