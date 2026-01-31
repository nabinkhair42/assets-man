export interface MailConfig {
  provider: "resend";
  apiKey: string;
  fromEmail: string;
  fromName?: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface PasswordResetEmailOptions {
  to: string;
  resetUrl: string;
  userName?: string;
  expiresInMinutes?: number;
}

export interface EmailVerificationEmailOptions {
  to: string;
  verificationUrl: string;
  userName?: string;
  expiresInHours?: number;
}

export interface WelcomeEmailOptions {
  to: string;
  userName: string;
  loginUrl: string;
}

export interface OtpEmailOptions {
  to: string;
  otp: string;
  userName?: string;
  expiresInMinutes?: number;
}

export interface MailClient {
  /**
   * Send a raw email with custom content
   */
  sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }>;

  /**
   * Send a password reset email
   */
  sendPasswordResetEmail(options: PasswordResetEmailOptions): Promise<{ success: boolean; error?: string }>;

  /**
   * Send an email verification email
   */
  sendEmailVerificationEmail(options: EmailVerificationEmailOptions): Promise<{ success: boolean; error?: string }>;

  /**
   * Send a welcome email to new users
   */
  sendWelcomeEmail(options: WelcomeEmailOptions): Promise<{ success: boolean; error?: string }>;

  /**
   * Send an OTP verification email for registration
   */
  sendOtpEmail(options: OtpEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }>;

  /**
   * Check the delivery status of a sent email.
   * Returns the last event (e.g. 'delivered', 'bounced', 'sent', 'queued').
   */
  getEmailStatus(emailId: string): Promise<{ status: string | null; error?: string }>;
}
