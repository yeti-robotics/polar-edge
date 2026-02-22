import { db } from "@/lib/database";
import { pitForm, pitPhoto } from "@/lib/database/schema";

export async function insertPitForm(
  data: typeof pitForm.$inferInsert,
  photoKeys: string[]
) {
  const [insertedForm] = await db
    .insert(pitForm)
    .values(data)
    .returning({ id: pitForm.id });

  if (photoKeys.length > 0 && insertedForm) {
    await db.insert(pitPhoto).values(
      photoKeys.map((storageKey, index) => ({
        pitFormId: insertedForm.id,
        storageKey,
        index,
      }))
    );
  }

  return { success: true };
}
