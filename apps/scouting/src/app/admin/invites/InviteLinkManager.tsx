"use client";

import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { useToast } from "@repo/ui/hooks/use-toast";
import { CheckCircle2Icon, CopyIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { generateInviteLink } from "./actions";

export function InviteLinkManager() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);
    setInviteLink(null);

    try {
      const result = await generateInviteLink();

      if (result.error) {
        setError(result.error);
        setIsGenerating(false);
        return;
      }

      if (result.data) {
        setInviteLink(result.data.url);
        setIsGenerating(false);
        startTransition(() => {
          router.refresh();
        });
      }
    } catch (_) {
      setError("An unexpected error occurred. Please try again.");
      setIsGenerating(false);
    }
  }

  async function handleCopy() {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast({ description: "Invite link copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      setError("Failed to copy link to clipboard");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Invite Link</CardTitle>
        <CardDescription>
          Create a shareable invite link. Anyone with the link can join your organization as a
          member.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
        )}

        {inviteLink && (
          <div className="space-y-2 rounded-md border bg-muted/50 p-4">
            <Label>Invite Link</Label>
            <div className="flex items-center gap-2">
              <Input value={inviteLink} readOnly className="font-mono text-sm" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <CheckCircle2Icon className="size-4 text-green-600" />
                ) : (
                  <CopyIcon className="size-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Share this link with anyone you want to invite. They can use it to join the
              organization.
            </p>
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || isPending}
          className="w-full sm:w-auto"
        >
          {isGenerating ? "Generating..." : "Generate Invite Link"}
        </Button>
      </CardContent>
    </Card>
  );
}
