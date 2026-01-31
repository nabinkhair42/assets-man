export interface OtpVerificationTemplateData {
  otp: string;
  userName?: string;
  expiresInMinutes: number;
}

export function getOtpVerificationHtml(data: OtpVerificationTemplateData): string {
  const { otp, userName, expiresInMinutes } = data;
  const greeting = userName ? `Hi ${userName},` : "Hi,";
  const digits = otp.split("");

  const digitCells = digits
    .map(
      (d) =>
        `<td style="width: 44px; height: 52px; text-align: center; font-size: 28px; font-weight: 700; font-family: 'Courier New', Courier, monospace; color: #18181b; background-color: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 8px; letter-spacing: 2px;">${d}</td>`
    )
    .join(`<td style="width: 8px;"></td>`);

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
                Use the following verification code to complete your registration:
              </p>

              <!-- OTP Code -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 24px;">
                <tr>
                  ${digitCells}
                </tr>
              </table>

              <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.5; color: #71717a;">
                This code will expire in <strong>${expiresInMinutes} minutes</strong>. If you didn't create an account, you can safely ignore this email.
              </p>

              <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #71717a;">
                Do not share this code with anyone.
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

export function getOtpVerificationText(data: OtpVerificationTemplateData): string {
  const { otp, userName, expiresInMinutes } = data;
  const greeting = userName ? `Hi ${userName},` : "Hi,";

  return `
${greeting}

Use the following verification code to complete your registration:

${otp}

This code will expire in ${expiresInMinutes} minutes.

If you didn't create an account, you can safely ignore this email.
Do not share this code with anyone.

---
Assets Man
  `.trim();
}
