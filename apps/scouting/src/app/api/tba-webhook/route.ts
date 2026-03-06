import { NextRequest, NextResponse } from "next/server";
import { MatchScorePayloadSchema, ScheduleUpdatedPayloadSchema } from "@/features/events/webhook-schemas";
import { processMatchScore, processScheduleUpdated, verifyTbaHmac } from "@/features/events/webhook";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const secret = process.env.TBA_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[tba-webhook] TBA_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const hmacHeader = request.headers.get("X-TBA-HMAC");
  if (!hmacHeader) {
    return NextResponse.json({ error: "Missing X-TBA-HMAC" }, { status: 400 });
  }

  if (!verifyTbaHmac(rawBody, hmacHeader, secret)) {
    console.warn("[tba-webhook] HMAC verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.warn("[tba-webhook] received non-JSON body");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messageType = (payload as Record<string, unknown>)?.message_type;
  console.info(`[tba-webhook] received message_type="${messageType}"`);

  switch (messageType) {
    case "ping":
      return NextResponse.json({ ok: true });

    case "verification": {
      const key = (payload as Record<string, unknown>)?.message_data;
      console.info(`[tba-webhook] verification key: ${key}`);
      return NextResponse.json({ ok: true });
    }

    case "match_score": {
      const parsed = MatchScorePayloadSchema.safeParse(payload);
      if (!parsed.success) {
        console.warn("[tba-webhook] invalid match_score payload", parsed.error.flatten());
        return NextResponse.json({ ok: true, ignored: true });
      }
      const { event_key, match: m } = parsed.data.message_data;
      console.info(`[tba-webhook] match_score: event=${event_key} match=${m.comp_level}${m.match_number}`);
      const result = await processMatchScore(parsed.data);
      if (result.updated) {
        console.info(`[tba-webhook] match_score applied: ${event_key} ${m.comp_level}${m.match_number} red=${m.alliances.red.score} blue=${m.alliances.blue.score}`);
      } else {
        console.warn(`[tba-webhook] match_score not applied: ${result.reason}`);
      }
      return NextResponse.json({ ok: true, ...result });
    }

    case "schedule_updated": {
      const parsed = ScheduleUpdatedPayloadSchema.safeParse(payload);
      if (!parsed.success) {
        console.warn("[tba-webhook] invalid schedule_updated payload", parsed.error.flatten());
        return NextResponse.json({ ok: true, ignored: true });
      }
      const { event_key, event_name } = parsed.data.message_data;
      console.info(`[tba-webhook] schedule_updated: event=${event_key} (${event_name})`);
      const result = await processScheduleUpdated(parsed.data);
      if (result.updated) {
        console.info(`[tba-webhook] schedule_updated applied: ${event_key}`);
      } else {
        console.warn(`[tba-webhook] schedule_updated not applied: ${result.reason}`);
      }
      return NextResponse.json({ ok: true, ...result });
    }

    default:
      console.info(`[tba-webhook] ignoring unhandled message_type="${messageType}"`);
      return NextResponse.json({ ok: true, ignored: true });
  }
}
