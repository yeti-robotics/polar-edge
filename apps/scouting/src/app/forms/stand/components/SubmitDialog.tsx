"use client";

import { Button } from "@repo/ui/components/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { toast } from "@repo/ui/components/sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitStandForm } from "../actions";
import { useActionState } from "../contexts/ActionStateContext";
import { useFormData } from "../contexts/FormDataContext";
import { useNavigation } from "../contexts/NavigationContext";

/**
 * Final submission dialog with server action call.
 */
export function SubmitDialog() {
  const { state: formData, dispatch: dispatchFormData } = useFormData();
  const { state: actionState, dispatch: dispatchActionState } = useActionState();
  const { dispatch: dispatchNavigation } = useNavigation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!formData.teamMatchId) {
      setError("Team match ID is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await submitStandForm({
        teamMatchId: formData.teamMatchId,
        comments: formData.comments,
        oofTimeSeconds: actionState.oofCumulativeSeconds,
        cycles: formData.completedCycles,
        climbs: formData.completedClimbs,
      });

      if (result.error) {
        setError(result.error);
        toast.error(result.error, { position: "top-right" });
      } else {
        toast.success("Stand form submitted successfully!", { position: "top-right" });

        // Reset all contexts so the form is fresh for the next scout
        dispatchFormData({ type: "reset" });
        dispatchActionState({ type: "reset" });
        dispatchNavigation({ type: "reset" });

        router.refresh();
      }
    } catch (err) {
      const errorMessage = "Failed to submit form. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage, { position: "top-right" });
      console.error("Submit error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    dispatchNavigation({ type: "decrement_stage" });
  };

  const cycleCount = formData.completedCycles.length;
  const climbCount = formData.completedClimbs.length;
  const commentsPreview =
    formData.comments.length > 80
      ? `${formData.comments.slice(0, 80)}…`
      : formData.comments;

  return (
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-3xl font-semibold text-center">
            Submit Scouting Form
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground text-center">
            Review your scouting data before submitting.
          </p>

          <div className="rounded-md border bg-muted/40 p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Match</span>
              <span className="font-medium">#{formData.teamMatchId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cycles</span>
              <span className="font-medium">{cycleCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Climbs</span>
              <span className="font-medium">{climbCount}</span>
            </div>
            {actionState.oofCumulativeSeconds > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Oof time</span>
                <span className="font-medium">{actionState.oofCumulativeSeconds}s</span>
              </div>
            )}
            {commentsPreview && (
              <div className="pt-1 border-t">
                <p className="text-muted-foreground mb-0.5">Comments</p>
                <p className="italic text-xs leading-snug">{commentsPreview}</p>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
