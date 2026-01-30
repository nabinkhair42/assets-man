export interface EmailVerificationTemplateData {
  verificationUrl: string;
  userName?: string;
  expiresInHours: number;
}

export function getEmailVerificationHtml(data: EmailVerificationTemplateData): string {
  const { verificationUrl, userName, expiresInHours } = data;
  const greeting = userName ? `Hi ${userName},` : "Hi,";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #e4e4e7;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #18181b;">
                Assets Man
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.5; color: #3f3f46;">
                ${greeting}
              </p>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.5; color: #3f3f46;">
                Thanks for signing up! Please verify your email address by clicking the button below.
              </p>

              <!-- Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="${verificationUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; background-color: #18181b; text-decoration: none; border-radius: 8px;">
                      Verify Email
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.5; color: #71717a;">
                This link will expire in <strong>${expiresInHours} hours</strong>. If you didn't create an account, you can safely ignore this email.
              </p>

              <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #71717a;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; line-height: 1.5; color: #a1a1aa; word-break: break-all;">
                ${verificationUrl}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; text-align: center; border-top: 1px solid #e4e4e7; background-color: #fafafa; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                &copy; ${new Date().getFullYear()} Assets Man. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function getEmailVerificationText(data: EmailVerificationTemplateData): string {
  const { verificationUrl, userName, expiresInHours } = data;
  const greeting = userName ? `Hi ${userName},` : "Hi,";

  return `
${greeting}

Thanks for signing up! Please verify your email address by clicking the link below.

Verify your email:
${verificationUrl}

This link will expire in ${expiresInHours} hours.

If you didn't create an account, you can safely ignore this email.

---
Assets Man
  `.trim();
}
