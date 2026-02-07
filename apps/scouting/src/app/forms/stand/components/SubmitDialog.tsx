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
  const { state: formData } = useFormData();
  const { state: actionState } = useActionState();
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
        // Success!
        toast.success("Stand form submitted successfully!", { position: "top-right" });

        // Redirect to stand form page (will reset form)
        router.push("/forms/stand");
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

  return (
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-3xl font-semibold text-center">
            Submit Scouting Form
          </DialogTitle>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 pt-4">
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
