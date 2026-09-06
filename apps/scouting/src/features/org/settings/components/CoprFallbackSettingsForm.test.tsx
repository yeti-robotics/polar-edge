// @vitest-environment jsdom

import { toast } from "@repo/ui/components/sonner";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateCoprFallbackAction } from "../actions";
import { CoprFallbackSettingsForm } from "./CoprFallbackSettingsForm";

vi.mock("../actions", () => ({
  updateCoprFallbackAction: vi.fn(),
}));

vi.mock("@repo/ui/components/sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockUpdate = vi.mocked(updateCoprFallbackAction);

describe("CoprFallbackSettingsForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue({ data: { success: true }, error: null });
  });

  it("shows the persisted state and saves immediately when toggled", async () => {
    const user = userEvent.setup();
    render(<CoprFallbackSettingsForm organizationId="org-123" enabled={false} />);

    expect(screen.getByText("Off")).toBeInTheDocument();
    await user.click(screen.getByRole("switch"));

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledOnce());
    const submitted = mockUpdate.mock.calls[0]?.[1];
    expect(submitted?.get("organizationId")).toBe("org-123");
    expect(submitted?.get("coprFallbackEnabled")).toBe("true");
    expect(await screen.findByText("On")).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("Manual shooting-rate fallback enabled");
  });

  it("rolls the switch back when saving fails", async () => {
    const user = userEvent.setup();
    mockUpdate.mockResolvedValue({ data: null, error: "Could not save" });
    render(<CoprFallbackSettingsForm organizationId="org-123" enabled={false} />);

    await user.click(screen.getByRole("switch"));

    expect(await screen.findByText("Off")).toBeInTheDocument();
    expect(screen.getByRole("switch")).not.toBeChecked();
    expect(toast.error).toHaveBeenCalledWith("Could not save");
  });
});
