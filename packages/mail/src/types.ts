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

export interface WelcomeEmailOptions {
  to: string;
  userName: string;
  loginUrl: string;
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
   * Send a welcome email to new users
   */
  sendWelcomeEmail(options: WelcomeEmailOptions): Promise<{ success: boolean; error?: string }>;
}
