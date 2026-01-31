import dns from "dns/promises";

export interface EmailValidationResult {
  valid: boolean;
  reason?: "invalid_format" | "no_mx_records" | "dns_error";
}

/**
 * Validate that an email address has a domain with valid MX records.
 * This catches completely fake domains (e.g. user@fakesite.xyz)
 * but won't catch invalid mailboxes on valid domains (e.g. fake@gmail.com).
 */
export async function validateEmailDomain(
  email: string
): Promise<EmailValidationResult> {
  const parts = email.split("@");
  if (parts.length !== 2 || !parts[1]) {
    return { valid: false, reason: "invalid_format" };
  }

  const domain = parts[1];

  try {
    const mxRecords = await dns.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return { valid: false, reason: "no_mx_records" };
    }
    return { valid: true };
  } catch (error) {
    // ENODATA or ENOTFOUND means no MX records exist for the domain
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENODATA" || code === "ENOTFOUND") {
      return { valid: false, reason: "no_mx_records" };
    }
    // Other DNS errors (timeout, network issues) — don't block the user
    console.error("DNS MX lookup error:", error);
    return { valid: false, reason: "dns_error" };
  }
}
