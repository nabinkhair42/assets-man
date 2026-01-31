import crypto from "crypto";

export interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    bounce?: {
      message: string;
      type: string;
      subType: string;
    };
    [key: string]: unknown;
  };
}

export interface ResendBounceData {
  emailId: string;
  to: string[];
  bounceType: string;
  bounceSubType: string;
  bounceMessage: string;
}

/**
 * Verify a Resend webhook signature using the svix standard.
 * Resend signs webhooks with svix — this is a simplified HMAC verification.
 * For production, consider using the `svix` npm package for full verification.
 *
 * @param payload - The raw request body as a string
 * @param headers - Object containing svix-id, svix-timestamp, svix-signature headers
 * @param secret - The webhook signing secret from Resend dashboard (starts with "whsec_")
 * @returns true if the signature is valid
 */
export function verifyResendWebhook(
  payload: string,
  headers: {
    "svix-id": string;
    "svix-timestamp": string;
    "svix-signature": string;
  },
  secret: string
): boolean {
  const msgId = headers["svix-id"];
  const timestamp = headers["svix-timestamp"];
  const signatures = headers["svix-signature"];

  if (!msgId || !timestamp || !signatures) {
    return false;
  }

  // Check timestamp is not too old (5 minutes tolerance)
  const now = Math.floor(Date.now() / 1000);
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Math.abs(now - ts) > 300) {
    return false;
  }

  // Remove "whsec_" prefix and decode base64 secret
  const secretBytes = Buffer.from(
    secret.startsWith("whsec_") ? secret.slice(6) : secret,
    "base64"
  );

  // Create the signature content
  const toSign = `${msgId}.${timestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac("sha256", secretBytes)
    .update(toSign)
    .digest("base64");

  // Compare against each provided signature (comma-separated, each prefixed with "v1,")
  const sigList = signatures.split(" ");
  for (const sig of sigList) {
    const [version, signature] = sig.split(",");
    if (version === "v1" && signature) {
      try {
        const sigBuffer = Buffer.from(signature, "base64");
        const expectedBuffer = Buffer.from(expectedSignature, "base64");
        if (
          sigBuffer.length === expectedBuffer.length &&
          crypto.timingSafeEqual(sigBuffer, expectedBuffer)
        ) {
          return true;
        }
      } catch {
        continue;
      }
    }
  }

  return false;
}

/**
 * Parse a Resend bounce webhook event and extract relevant data.
 * Returns null if the event is not a bounce event.
 */
export function parseBounceEvent(
  event: ResendWebhookEvent
): ResendBounceData | null {
  if (event.type !== "email.bounced") {
    return null;
  }

  return {
    emailId: event.data.email_id,
    to: event.data.to,
    bounceType: event.data.bounce?.type ?? "unknown",
    bounceSubType: event.data.bounce?.subType ?? "unknown",
    bounceMessage: event.data.bounce?.message ?? "Unknown bounce reason",
  };
}
