"use client";

import { cn } from "@repo/ui/lib/utils";
import * as React from "react";

type SliderProps = Omit<
  React.ComponentProps<"input">,
  "defaultValue" | "onChange" | "type" | "value"
> & {
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
  value?: number[];
};

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  (
    { className, defaultValue, max = 100, min = 0, onValueChange, step = 1, value, ...props },
    ref
  ) => {
    const currentValue = value?.[0] ?? defaultValue?.[0] ?? min;

    return (
      <input
        ref={ref}
        type="range"
        data-slot="slider"
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={(event) => onValueChange?.([Number(event.currentTarget.value)])}
        className={cn(
          "h-2 w-full cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);

Slider.displayName = "Slider";

export { Slider };
