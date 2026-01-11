"use client";

import { Button } from "@repo/ui/components/button";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useToast } from "@repo/ui/hooks/use-toast";

interface InviteLinkCopyProps {
  url: string;
  revoked?: boolean;
}

export function InviteLinkCopy({ url, revoked }: InviteLinkCopyProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    if (revoked) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ description: "Invite link copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      toast({ description: "Failed to copy link", variant: "destructive" });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className={`font-mono text-sm truncate max-w-[250px] sm:max-w-[400px] ${revoked ? "text-muted-foreground line-through" : ""}`}
      >
        {url}
      </span>
      {!revoked && (
        <Button variant="ghost" size="icon" onClick={handleCopy} className="h-6 w-6 shrink-0">
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3 text-muted-foreground" />
          )}
          <span className="sr-only">Copy link</span>
        </Button>
      )}
    </div>
  );
}
