"use client";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { Field } from "@tanstack/react-form-nextjs";
import { admin } from "better-auth/plugins";

const isAdmin = () => {
  if (admin) {
    return (
      <div>
        <Card>Noti</Card>
      </div>
    );
  }
};
export default function AdminEditing() {
  return (
    <div>
      <Button onClick={isAdmin}>Edit Schedule</Button>
    </div>
  );
}
