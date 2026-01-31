import { Resend } from "resend";
import type {
  MailConfig,
  MailClient,
  SendEmailOptions,
  PasswordResetEmailOptions,
  EmailVerificationEmailOptions,
  WelcomeEmailOptions,
  OtpEmailOptions,
} from "./types";
import {
  getPasswordResetEmailHtml,
  getPasswordResetEmailText,
} from "./templates/password-reset";
import {
  getEmailVerificationHtml,
  getEmailVerificationText,
} from "./templates/email-verification";
import { getWelcomeEmailHtml, getWelcomeEmailText } from "./templates/welcome";
import {
  getOtpVerificationHtml,
  getOtpVerificationText,
} from "./templates/otp-verification";

const DEFAULT_RESET_EXPIRY_MINUTES = 60;
const DEFAULT_VERIFICATION_EXPIRY_HOURS = 24;
const DEFAULT_OTP_EXPIRY_MINUTES = 10;

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
        const { error } = await resend.emails.send({
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

    async sendEmailVerificationEmail(options: EmailVerificationEmailOptions) {
      const expiresInHours =
        options.expiresInHours ?? DEFAULT_VERIFICATION_EXPIRY_HOURS;

      const templateData = {
        verificationUrl: options.verificationUrl,
        userName: options.userName,
        expiresInHours,
      };

      try {
        const { error } = await resend.emails.send({
          from: fromAddress,
          to: options.to,
          subject: "Verify your email - Assets Man",
          html: getEmailVerificationHtml(templateData),
          text: getEmailVerificationText(templateData),
        });

        if (error) {
          console.error("Resend error:", error);
          return { success: false, error: error.message };
        }

        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Email verification email error:", message);
        return { success: false, error: message };
      }
    },

    async sendWelcomeEmail(options: WelcomeEmailOptions) {
      const templateData = {
        userName: options.userName,
        loginUrl: options.loginUrl,
      };

      try {
        const { error } = await resend.emails.send({
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

    async sendOtpEmail(options: OtpEmailOptions) {
      const expiresInMinutes =
        options.expiresInMinutes ?? DEFAULT_OTP_EXPIRY_MINUTES;

      const templateData = {
        otp: options.otp,
        userName: options.userName,
        expiresInMinutes,
      };

      try {
        const { data, error } = await resend.emails.send({
          from: fromAddress,
          to: options.to,
          subject: "Your verification code - Assets Man",
          html: getOtpVerificationHtml(templateData),
          text: getOtpVerificationText(templateData),
        });

        if (error) {
          console.error("Resend error:", error);
          return { success: false, error: error.message };
        }

        return { success: true, messageId: data?.id };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("OTP email error:", message);
        return { success: false, error: message };
      }
    },

    async getEmailStatus(emailId: string) {
      try {
        const response = await resend.emails.get(emailId);

        if (response.error) {
          console.error("[Mail] getEmailStatus error:", response.error);
          return { status: null, error: response.error.message };
        }

        const lastEvent = response.data?.last_event ?? null;
        console.log("[Mail] getEmailStatus:", { emailId, lastEvent, data: JSON.stringify(response.data) });
        return { status: lastEvent };
      } catch (err) {
        console.error("[Mail] getEmailStatus exception:", err);
        const message = err instanceof Error ? err.message : "Unknown error";
        return { status: null, error: message };
      }
    },
  };
}
