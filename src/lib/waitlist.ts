import type { SupabaseClient } from "@supabase/supabase-js";
import type { Shift } from "@/lib/db";
import { deliver, loadParts } from "@/lib/emails/deliver";

/**
 * When a spot opens on a shift, move the people who have waited longest into
 * it, one per open spot, and email each of them. Safe to call any time; it
 * does nothing when the shift is full, over, or has nobody waiting.
 * Returns how many people were moved in.
 */
export async function promoteShift(admin: SupabaseClient, shiftId: string): Promise<number> {
  let moved = 0;
  try {
    const { data: sh } = await admin.from("shifts").select("*").eq("id", shiftId).maybeSingle();
    const shift = sh as Shift | null;
    if (!shift || new Date(shift.ends_at).getTime() < Date.now()) return 0;
    const { data: ev } = await admin.from("events").select("status").eq("id", shift.event_id).maybeSingle();
    if (!ev || ev.status === "cancelled") return 0;

    for (let guard = 0; guard < 50; guard++) {
      const { count } = await admin.from("signups").select("id", { count: "exact", head: true }).eq("shift_id", shiftId).eq("status", "confirmed");
      if ((count ?? 0) >= shift.capacity) break;
      const { data: next } = await admin.from("signups").select("id").eq("shift_id", shiftId).eq("status", "waitlist").order("created_at").limit(1);
      const id = next?.[0]?.id as string | undefined;
      if (!id) break;
      const { data: done } = await admin.from("signups").update({ status: "confirmed" }).eq("id", id).eq("status", "waitlist").select("id");
      if (!done || done.length === 0) continue; // someone else moved them first
      moved++;
      // Earlier emails were about waiting; clear the record so reminders follow as for any sign-up.
      await admin.from("messages").delete().eq("signup_id", id).in("kind", ["waitlist", "confirmation", "day_before", "morning_of"]);
      const parts = await loadParts(admin, id);
      if (parts) await deliver(admin, "promoted", parts);
    }
  } catch (err) {
    console.error("[waitlist] promote failed", err);
  }
  return moved;
}

/** Fill open spots from the waiting lists of every shift of an event. */
export async function promoteEvent(admin: SupabaseClient, eventId: string): Promise<number> {
  let moved = 0;
  try {
    const { data } = await admin.from("shifts").select("id").eq("event_id", eventId);
    for (const s of data ?? []) moved += await promoteShift(admin, s.id as string);
  } catch (err) {
    console.error("[waitlist] promote event failed", err);
  }
  return moved;
}
