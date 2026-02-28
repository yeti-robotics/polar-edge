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
import { TypographyH3, TypographyMuted } from "@repo/ui/components/typography";
import { BuildingIcon, CheckCircle2Icon, Loader2Icon, PlusIcon, SparklesIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function CreateOrganizationForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    setError(null);
    // Auto-generate slug from name
    setSlug(
      value
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
    );
  }

  function handleSlugChange(value: string) {
    setError(null);
    setSlug(
      value
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !slug.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Check if slug is available
      const slugCheck = await authClient.organization.checkSlug({ slug });
      if (slugCheck.data?.status === false) {
        setError("This URL slug is already taken. Please choose another.");
        setIsCreating(false);
        return;
      }

      const result = await authClient.organization.create({
        name: name.trim(),
        slug: slug.trim(),
      });

      if (result.error) {
        setError(result.error.message ?? "Failed to create organization");
        setIsCreating(false);
        return;
      }

      if (result.data) {
        setSuccess(true);
        // Redirect to the new organization after a brief success animation
        setTimeout(() => {
          router.push(`/${result.data.slug}`);
          router.refresh();
        }, 1000);
      }
    } catch (_err) {
      setError("An unexpected error occurred. Please try again.");
      setIsCreating(false);
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md animate-in fade-in-0 zoom-in-95 duration-300">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-green-400/30" />
            <CheckCircle2Icon className="relative size-16 text-green-500" />
          </div>
          <TypographyH3 className="mt-6">Organization Created!</TypographyH3>
          <TypographyMuted className="mt-2">Redirecting you now...</TypographyMuted>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-linear-to-br from-yeti-400 to-yeti-600">
          <BuildingIcon className="size-7 text-white" />
        </div>
        <CardTitle className="text-2xl">Create Organization</CardTitle>
        <CardDescription>
          Set up a new organization to manage teams and scouting data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="org-name" className="text-sm font-medium">
              Organization Name
            </Label>
            <Input
              id="org-name"
              placeholder="e.g., FRC Team 1234"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              disabled={isCreating}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-slug" className="text-sm font-medium">
              URL Slug
            </Label>
            <div className="relative">
              <Input
                id="org-slug"
                placeholder="frc-team-1234"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                disabled={isCreating}
                className="h-11 pl-4.5"
              />
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                /
              </span>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <SparklesIcon className="size-3" />
              Auto-generated from name. You can customize it.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={!name.trim() || !slug.trim() || isCreating}
            className="h-11 w-full font-semibold"
          >
            {isCreating ? (
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" />
                Creating...
              </>
            ) : (
              <span>
                <PlusIcon className="size-4" /> Create Organization
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
