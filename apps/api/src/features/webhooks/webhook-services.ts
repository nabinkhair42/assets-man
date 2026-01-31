import { config } from "@/config/env.js";
import { createDb, pendingRegistrations } from "@repo/database";
import { parseBounceEvent, type ResendWebhookEvent } from "@repo/mail";
import { eq } from "drizzle-orm";

const db = createDb(config.DATABASE_URL);

export async function handleResendWebhook(
  event: ResendWebhookEvent
): Promise<{ handled: boolean; action?: string }> {
  const bounceData = parseBounceEvent(event);

  if (!bounceData) {
    return { handled: false };
  }

  // For each bounced recipient, clean up any pending registrations
  for (const email of bounceData.to) {
    const pending = await db.query.pendingRegistrations.findFirst({
      where: eq(pendingRegistrations.email, email),
    });

    if (pending) {
      await db
        .delete(pendingRegistrations)
        .where(eq(pendingRegistrations.id, pending.id));
      console.log(
        `Deleted pending registration for bounced email: ${email} (${bounceData.bounceType}/${bounceData.bounceSubType})`
      );
    }
  }

  return {
    handled: true,
    action: `Processed bounce for: ${bounceData.to.join(", ")}`,
  };
}
