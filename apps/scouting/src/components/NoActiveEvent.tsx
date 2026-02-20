import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
import { CalendarXIcon } from "lucide-react";

export function NoActiveEvent() {
  return (
    <Alert>
      <CalendarXIcon />
      <AlertTitle>No active event</AlertTitle>
      <AlertDescription>
        Your organization does not have an active event set. Ask an admin to configure one in
        organization settings.
      </AlertDescription>
    </Alert>
  );
}
