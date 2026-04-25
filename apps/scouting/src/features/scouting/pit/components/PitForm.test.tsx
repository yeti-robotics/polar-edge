// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createContext,
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
  useContext,
  useImperativeHandle,
} from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PitForm } from "./PitForm";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);
vi.stubGlobal("scrollTo", vi.fn());

const mockUploadPhotos = vi.fn();
const mockResetPhotoUpload = vi.fn();

const ComboboxContext = createContext<{
  itemToStringLabel?: (value: string) => string;
  items: unknown[];
  onValueChange?: (value: string) => void;
  value: string;
} | null>(null);

vi.mock("../actions", () => ({
  submitPitForm: vi.fn(),
}));

vi.mock("../hooks/use-photo-upload", () => ({
  usePhotoUpload: () => ({
    state: {
      status: "idle",
      error: null,
      compressionProgress: 0,
      uploadProgress: null,
    },
    uploadPhotos: mockUploadPhotos,
    reset: mockResetPhotoUpload,
  }),
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
  ComboboxInput: ({ disabled, placeholder, ...props }: InputHTMLAttributes<HTMLInputElement>) => {
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
  ComboboxList: ({ children }: { children: ((item: unknown) => ReactNode) | ReactNode }) => {
    const context = useContext(ComboboxContext);

    if (typeof children !== "function") {
      return <div>{children}</div>;
    }

    return <div>{(context?.items ?? []).map((item) => children(item))}</div>;
  },
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

vi.mock("./PitPhotoUpload", () => ({
  PitPhotoUpload: forwardRef(function MockPitPhotoUpload(
    { children }: { children: ReactNode },
    ref: Ref<{ clearPhotos: () => void; getPendingFiles: () => File[] }>
  ) {
    useImperativeHandle(ref, () => ({
      clearPhotos: vi.fn(),
      getPendingFiles: () => [],
    }));

    return <div>{children}</div>;
  }),
  PhotoCompressionProgress: () => null,
  PhotoUploadError: () => null,
  PhotoUploadProgress: () => null,
}));

const teams = [{ teamNumber: 254, teamName: "The Cheesy Poofs" }];

describe("PitForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("attack coverage", () => {
    it("other drivetrain detail field stays hidden until Other is selected", async () => {
      render(<PitForm teams={teams} />);
      const user = userEvent.setup();

      expect(screen.queryByLabelText("Custom drivetrain type")).not.toBeInTheDocument();

      await user.click(screen.getByLabelText("Other"));

      expect(screen.getByLabelText("Custom drivetrain type")).toBeInTheDocument();

      await user.click(screen.getByLabelText("Tank"));

      expect(screen.queryByLabelText("Custom drivetrain type")).not.toBeInTheDocument();
    });
  });

  describe("gap-closing coverage", () => {
    it("freeform archetype and comments fields remain available for robot-specific notes", () => {
      render(<PitForm teams={teams} />);

      expect(screen.getByLabelText("Robot archetype")).toBeInTheDocument();
      expect(screen.getByLabelText("Additional information")).toBeInTheDocument();
      expect(screen.getByText("What should I write here?")).toBeInTheDocument();
    });
  });
});
