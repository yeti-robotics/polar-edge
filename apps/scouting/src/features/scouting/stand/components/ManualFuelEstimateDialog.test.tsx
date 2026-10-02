// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ManualFuelEstimateDialog } from "./ManualFuelEstimateDialog";

describe("ManualFuelEstimateDialog", () => {
  it("requires a bucket and submits bucket zero correctly", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();

    render(<ManualFuelEstimateDialog onComplete={onComplete} />);

    await user.click(screen.getByRole("button", { name: "End Shoot" }));
    const confirm = screen.getByRole("button", { name: "Confirm" });
    expect(confirm).toBeDisabled();

    await user.click(screen.getByLabelText("No shot (0 balls/sec)"));
    expect(confirm).toBeEnabled();
    await user.click(confirm);

    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete).toHaveBeenCalledWith(0);
  });

  it("clears the selection and reports cancellation", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(<ManualFuelEstimateDialog onComplete={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: "End Shoot" }));
    await user.click(screen.getByLabelText("Fast (5–7 balls/sec)"));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "End Shoot" }));
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
  });
});
