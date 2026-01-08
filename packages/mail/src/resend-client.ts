import { Resend } from "resend";
import type {
  MailConfig,
  MailClient,
  SendEmailOptions,
  PasswordResetEmailOptions,
  WelcomeEmailOptions,
} from "./types";
import {
  getPasswordResetEmailHtml,
  getPasswordResetEmailText,
} from "./templates/password-reset";
import { getWelcomeEmailHtml, getWelcomeEmailText } from "./templates/welcome";

const DEFAULT_RESET_EXPIRY_MINUTES = 60;

export function createResendClient(config: MailConfig): MailClient {
  const resend = new Resend(config.apiKey);
  const fromAddress = config.fromName
    ? `${config.fromName} <${config.fromEmail}>`
    : config.fromEmail;

  return {
    async sendEmail(options: SendEmailOptions) {
      try {
        const { data, error } = await resend.emails.send({
          from: fromAddress,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        });

        if (error) {
          console.error("Resend error:", error);
          return { success: false, error: error.message };
        }

        return { success: true, messageId: data?.id };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Mail send error:", message);
        return { success: false, error: message };
      }
    },

    async sendPasswordResetEmail(options: PasswordResetEmailOptions) {
      const expiresInMinutes =
        options.expiresInMinutes ?? DEFAULT_RESET_EXPIRY_MINUTES;

      const templateData = {
        resetUrl: options.resetUrl,
        userName: options.userName,
        expiresInMinutes,
      };

      try {
        const { data, error } = await resend.emails.send({
          from: fromAddress,
          to: options.to,
          subject: "Reset your password - Assets Man",
          html: getPasswordResetEmailHtml(templateData),
          text: getPasswordResetEmailText(templateData),
        });

        if (error) {
          console.error("Resend error:", error);
          return { success: false, error: error.message };
        }

        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Password reset email error:", message);
        return { success: false, error: message };
      }
    },

    async sendWelcomeEmail(options: WelcomeEmailOptions) {
      const templateData = {
        userName: options.userName,
        loginUrl: options.loginUrl,
      };

      try {
        const { data, error } = await resend.emails.send({
          from: fromAddress,
          to: options.to,
          subject: "Welcome to Assets Man",
          html: getWelcomeEmailHtml(templateData),
          text: getWelcomeEmailText(templateData),
        });

        if (error) {
          console.error("Resend error:", error);
          return { success: false, error: error.message };
        }

        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Welcome email error:", message);
        return { success: false, error: message };
      }
    },
  };
}
