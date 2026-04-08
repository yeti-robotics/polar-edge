"use client";

import { Button } from "@repo/ui/components/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { toast } from "@repo/ui/components/sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitStandForm } from "../actions";
import { useActionState } from "../contexts/ActionStateContext";
import { useFormData } from "../contexts/FormDataContext";
import { useMatchTimer } from "../contexts/MatchTimerContext";
import { useNavigation } from "../contexts/NavigationContext";

export function SubmitDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state: formData, dispatch: dispatchFormData } = useFormData();
  const { state: actionState, dispatch: dispatchActionState } = useActionState();
  const { dispatch: dispatchNavigation } = useNavigation();
  const { dispatch: dispatchTimer } = useMatchTimer();
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
        canShuttle: formData.canShuttle,
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
        dispatchFormData({ type: "reset" });
        dispatchActionState({ type: "reset" });
        dispatchNavigation({ type: "reset" });
        dispatchTimer({ type: "reset" });
        onClose();
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
    onClose();
  };

  const cycleCount = formData.completedCycles.length;
  const climbCount = formData.completedClimbs.length;
  const commentsPreview =
    formData.comments.length > 120 ? `${formData.comments.slice(0, 120)}…` : formData.comments;

  return (
    <Dialog open={open}>
      <DialogContent className="p-0 gap-0 overflow-hidden max-w-sm">
        {/* Header band */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-base font-medium font-mono tracking-wide uppercase text-muted-foreground">
            Confirm Submission
          </DialogTitle>
        </DialogHeader>

        {/* Hero: team + match */}
        <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
          <div className="px-6 py-5">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1.5">
              Team
            </p>
            <p className="text-4xl font-medium tabular-nums text-foreground leading-none">
              {formData.teamNumber}
            </p>
          </div>
          <div className="px-6 py-5">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1.5">
              Match
            </p>
            <p className="text-4xl font-medium tabular-nums text-foreground leading-none">
              {formData.matchNumber}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
          <StatCell label="Cycles" value={cycleCount} />
          <StatCell label="Climbs" value={climbCount} />
          <StatCell
            label="Oof"
            value={
              actionState.oofCumulativeSeconds > 0 ? `${actionState.oofCumulativeSeconds}s` : "—"
            }
            dim={actionState.oofCumulativeSeconds === 0}
          />
        </div>

        {/* Comments */}
        {commentsPreview && (
          <div className="px-6 py-4 border-b border-border">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
              Comments
            </p>
            <p className="text-sm text-foreground/80 leading-relaxed">{commentsPreview}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="px-6 pt-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-4 flex gap-2">
          <Button variant="secondary" onClick={handleCancel} disabled={loading} className="flex-1">
            Cancel
          </Button>
          <Button variant="default" onClick={handleSubmit} disabled={loading} className="flex-1">
            {loading ? "Submitting…" : "Submit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatCell({
  label,
  value,
  dim = false,
}: {
  label: string;
  value: string | number;
  dim?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-4 gap-0.5">
      <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span
        className={`text-2xl font-normal tabular-nums leading-none ${dim ? "text-muted-foreground/40" : "text-foreground"}`}
      >
        {value}
      </span>
    </div>
  );
}
