export type {
  MailConfig,
  MailClient,
  SendEmailOptions,
  PasswordResetEmailOptions,
  EmailVerificationEmailOptions,
  WelcomeEmailOptions,
} from "./types";

export { createResendClient } from "./resend-client";

// Re-export templates for customization if needed
export {
  getPasswordResetEmailHtml,
  getPasswordResetEmailText,
} from "./templates/password-reset";
export {
  getEmailVerificationHtml,
  getEmailVerificationText,
} from "./templates/email-verification";
export {
  getWelcomeEmailHtml,
  getWelcomeEmailText,
} from "./templates/welcome";

import type { MailConfig, MailClient } from "./types";
import { createResendClient } from "./resend-client";

/**
 * Create a mail client based on the provider configuration
 */
export function createMailClient(config: MailConfig): MailClient {
  switch (config.provider) {
    case "resend":
      return createResendClient(config);
    default:
      throw new Error(`Unsupported mail provider: ${config.provider}`);
  }
}
