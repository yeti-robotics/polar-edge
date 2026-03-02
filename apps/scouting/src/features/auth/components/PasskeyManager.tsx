"use client";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Separator } from "@repo/ui/components/separator";
import { Skeleton } from "@repo/ui/components/skeleton";
import { TypographyMuted } from "@repo/ui/components/typography";
import { cn } from "@repo/ui/lib/utils";
import {
  Check,
  Fingerprint,
  KeyRound,
  KeySquare,
  LockKeyhole,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { usePasskey } from "../hooks/usePasskey";

export default function PasskeyManager() {
  const [newPasskeyName, setNewPasskeyName] = useState("");

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNewPasskeyName(e.target.value);
  }

  const { passkeys, createPasskey, renamePasskey, deletePasskey, fetchPasskeys, loading, error } =
    usePasskey();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  // 2. Helper functions to manage the edit mode
  const startEditing = (pk: { id: string; name?: string | null }) => {
    setEditingId(pk.id);
    setEditName(pk.name || "");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return; // Don't save empty names
    await renamePasskey(id, editName);
    setEditingId(null);
  };

  return (
    <Card className=" shadow-sm transition-all duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl text-primary">
              <LockKeyhole className="size-5 shrink-0" />
              Passkey Manager
            </CardTitle>
            <CardDescription className="max-w-[90%]">
              Manage your biometric credentials and security keys.
            </CardDescription>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={fetchPasskeys}
            className="shrink-0 text-muted-foreground hover:text-primary"
            disabled={loading}
            aria-label="Refresh passkeys"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="space-y-6 pt-6">
        {/* Create Section */}
        <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
          <div className="relative flex-1">
            <KeySquare className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={newPasskeyName}
              onChange={handleInputChange}
              placeholder="e.g. Apple Passkey"
              className="pl-9"
              onKeyDown={(e) => e.key === "Enter" && createPasskey(newPasskeyName.trim())}
            />
          </div>
          <Button
            onClick={() => createPasskey(newPasskeyName)}
            className="w-full sm:w-auto font-medium shadow-sm transition-transform"
            disabled={!newPasskeyName}
          >
            <Plus className="mr-0.5 size-4" />
            Add Passkey
          </Button>
        </div>

        {/* Error State */}
        {error.length > 0 && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center justify-center text-center">
            Error: {error}
          </div>
        )}

        {/* List Section */}
        <div className="space-y-2">
          <TypographyMuted className="font-medium px-1">Your Passkeys</TypographyMuted>

          {loading && passkeys.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : passkeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center animate-in fade-in-50">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 mb-3">
                <KeyRound className="size-6 text-muted-foreground/50" />
              </div>
              <h4 className="text-sm font-medium text-foreground">No passkeys found</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-[12rem]">
                Create a new passkey above to secure your account.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {passkeys.map((pk) => (
                <li
                  key={pk.id}
                  className={cn(
                    "group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border bg-card p-4 transition-colors",
                    // Add a border highlight if editing
                    editingId === pk.id
                      ? "border-primary ring-1 ring-primary/20 bg-muted/10"
                      : "hover:bg-muted/30"
                  )}
                >
                  <div className="flex items-start gap-3 overflow-hidden">
                    <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <KeyRound className="size-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      {editingId === pk.id ? (
                        /* EDIT MODE: Show Input */
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8 text-sm my-2 mx-2"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(pk.id);
                            if (e.key === "Escape") cancelEditing();
                          }}
                        />
                      ) : (
                        /* VIEW MODE: Show Text */
                        <span className="truncate font-medium leading-none text-foreground mb-1.5 pt-1">
                          {pk.name || "Unnamed Device"}
                        </span>
                      )}
                      <code className="flex items-center space-x-1 relative w-fit rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs text-muted-foreground">
                        <Fingerprint className="size-2" />
                        <span className="text-ellipsis overflow-hidden flex items-center space-x-4">
                          {pk.id}
                        </span>
                      </code>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    {editingId === pk.id ? (
                      <>
                        {/* SAVE Button */}
                        <Button
                          size="icon"
                          className="size-8 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => saveEdit(pk.id)}
                          title="Save"
                        >
                          <Check className="size-4" />
                        </Button>
                        {/* CANCEL Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={cancelEditing}
                          title="Cancel"
                        >
                          <X className="size-4" />
                        </Button>
                      </>
                    ) : (
                      <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        {/* EDIT Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-foreground"
                          onClick={() => startEditing(pk)}
                          title="Rename"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        {/* DELETE Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deletePasskey(pk.id)}
                          title="Delete"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>

      <CardFooter className="bg-muted/30 py-3 border-t">
        <p className="text-[10px] text-muted-foreground w-full text-center flex items-center justify-center gap-1.5">
          <ShieldCheck className="size-4" />
          Passkeys are stored securely on your device's hardware enclave.
        </p>
      </CardFooter>
    </Card>
  );
}
