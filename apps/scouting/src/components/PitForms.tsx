"use client";
import { Dice1 } from "lucide-react";
import { useState } from "react";

function PitForm() {
    const frontend = {
            1: "This is a frontend only form."
    }     
    return (
      <form className="space-y-6">
        <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-200">
          Robot Dimensions
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="width" className="text-sm text-muted-foreground">
              Width
            </label>
            <input
              type="number"
              id="width"
              name="width"
              placeholder="Enter width"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="length" className="text-sm text-muted-foreground">
              Length
            </label>
            <input
              type="number"
              id="length"
              name="length"
              placeholder="Enter length"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="height" className="text-sm text-muted-foreground">
              Height
            </label>
            <input
              type="number"
              id="height"
              name="height"
              placeholder="Enter height"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="weight" className="text-sm text-muted-foreground">
              Weight
            </label>
            <input
              type="number"
              id="weight"
              name="weight"
              placeholder="Enter weight"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-200">
          Scoring Capabilities
        </h2>

        <input
          type="text"
          id="scoring-capabilities"
          name="scoring-capabilities"
          placeholder="Enter scoring capabilities"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-200">
          Climb Level
        </h2>

        <div className="flex gap-6">
          {["L1", "L2", "L3"].map((level) => (
            <label key={level} className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" name="climb" value={level} />
              {level}
            </label>
          ))}
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-200">
          Robot Build
        </h2>

        <div className="flex gap-6">
          {["Bump", "Trench"].map((type) => (
            <label key={type} className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" name="build" value={type} />
              {type}
            </label>
          ))}
        </div>
      </section>
    </form>
    );
}

export default PitForm;