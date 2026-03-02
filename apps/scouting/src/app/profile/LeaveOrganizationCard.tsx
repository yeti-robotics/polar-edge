"use client";

import { TypographyH1 } from "@repo/ui/components/typography";
import LeaveOrganizationDialogue from "./LeaveOrganizationDialog";
import TransferOwnershipDialogue from "./TransferOwnershipDialog";

type Check = {
  isOwner?: boolean;
  organizationId?: string;
};

export default function LeaveOrganizationCard({
  isOwner = false,
  organizationId = "",
}: Check) {
  return (
    <div className="border rounded-lg p-6">
      <TypographyH1 className="mb-3"> Organization Settiungs </TypographyH1>

      {isOwner ? (
        <TransferOwnershipDialogue organizationId={organizationId} />
      ) : (
        <LeaveOrganizationDialogue organizationId={organizationId} />
      )}
    </div>
  );
}
