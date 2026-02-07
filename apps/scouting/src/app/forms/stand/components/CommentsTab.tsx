"use client";

import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
import { Textarea } from "@repo/ui/components/textarea";
import { InfoIcon } from "lucide-react";
import { useFormData } from "../contexts/FormDataContext";

/**
 * Comments tab with textarea for additional notes.
 */
export function CommentsTab() {
  const { state, dispatch } = useFormData();

  return (
    <div className="flex flex-col gap-2 h-full">
      <h2 className="text-lg text-foreground">Comments</h2>
      <div className="flex-1 flex flex-col py-4 min-h-[280px] gap-4">
        <Alert>
          <AlertTitle className="flex items-center gap-2">
            <InfoIcon className="size-4" />
            What should I write here?
          </AlertTitle>
          <AlertDescription>
            Notes here provide context to the data you've entered. Helpful information includes:
            <ul className="list-disc list-inside">
              <li>Robot strengths and weaknesses</li>
              <li>Reliability and consistency of the robot</li>
              <li>If defense was successful or not</li>
            </ul>
          </AlertDescription>
        </Alert>
        <Textarea
          id="comments"
          name="comments"
          placeholder="Enter Comments"
          className="w-full flex-1 resize-none h-full"
          value={state.comments}
          onChange={(e) => dispatch({ type: "set_comments", payload: e.target.value })}
        />
      </div>
    </div>
  );
}
