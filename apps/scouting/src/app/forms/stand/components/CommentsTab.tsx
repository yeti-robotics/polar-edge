"use client";

import { Textarea } from "@repo/ui/components/textarea";
import { useFormData } from "../contexts/FormDataContext";

/**
 * Comments tab with textarea for additional notes.
 */
export function CommentsTab() {
  const { state, dispatch } = useFormData();

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-2xl text-center">Comments</h2>
      <Textarea
        id="comments"
        name="comments"
        placeholder="Enter Comments"
        value={state.comments}
        onChange={(e) => dispatch({ type: "set_comments", payload: e.target.value })}
        rows={6}
      />
    </div>
  );
}
