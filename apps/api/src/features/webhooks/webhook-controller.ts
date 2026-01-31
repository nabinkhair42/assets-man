import type { Request, Response } from "express";
import { config } from "@/config/env.js";
import { verifyResendWebhook, type ResendWebhookEvent } from "@repo/mail";
import { handleResendWebhook } from "./webhook-services.js";

export async function resendWebhook(
  req: Request,
  res: Response
): Promise<void> {
  const secret = config.RESEND_WEBHOOK_SECRET;

  if (!secret) {
    console.error("RESEND_WEBHOOK_SECRET not configured");
    res.status(500).json({ error: "Webhook not configured" });
    return;
  }

  // Verify signature
  const svixId = req.headers["svix-id"] as string;
  const svixTimestamp = req.headers["svix-timestamp"] as string;
  const svixSignature = req.headers["svix-signature"] as string;

  if (!svixId || !svixTimestamp || !svixSignature) {
    res.status(400).json({ error: "Missing webhook signature headers" });
    return;
  }

  const rawBody =
    typeof req.body === "string" ? req.body : JSON.stringify(req.body);

  const isValid = verifyResendWebhook(
    rawBody,
    {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    },
    secret
  );

  if (!isValid) {
    res.status(401).json({ error: "Invalid webhook signature" });
    return;
  }

  try {
    const event: ResendWebhookEvent =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const result = await handleResendWebhook(event);

    res.status(200).json({ received: true, ...result });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
}
