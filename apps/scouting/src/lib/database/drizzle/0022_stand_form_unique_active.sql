-- Soft-delete older duplicates, keeping the most recently updated form per (team_match_id, scout_member_id)
UPDATE stand_form SET deleted_at = NOW()
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY team_match_id, scout_member_id
      ORDER BY updated_at DESC, created_at DESC
    ) AS rn
    FROM stand_form
    WHERE deleted_at IS NULL
  ) ranked
  WHERE rn > 1
);

-- Prevent future duplicate active submissions per scout per team-match
CREATE UNIQUE INDEX "uniq_stand_form_active_submission"
  ON "stand_form" ("team_match_id", "scout_member_id")
  WHERE "deleted_at" IS NULL;
