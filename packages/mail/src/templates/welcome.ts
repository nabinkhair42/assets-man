export interface WelcomeTemplateData {
  userName: string;
  loginUrl: string;
}

export function getWelcomeEmailHtml(data: WelcomeTemplateData): string {
  const { userName, loginUrl } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Assets Man</title>
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
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #18181b;">
                Welcome, ${userName}!
              </h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.5; color: #3f3f46;">
                Thanks for signing up for Assets Man. Your account is ready to use.
              </p>

              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.5; color: #3f3f46;">
                With Assets Man, you can:
              </p>
              <ul style="margin: 0 0 24px; padding-left: 20px; font-size: 15px; line-height: 1.8; color: #3f3f46;">
                <li>Upload and organize your files</li>
                <li>Share files securely with anyone</li>
                <li>Access your assets from anywhere</li>
              </ul>

              <!-- Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="${loginUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; background-color: #18181b; text-decoration: none; border-radius: 8px;">
                      Go to Dashboard
                    </a>
                  </td>
                </tr>
              </table>
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

export function getWelcomeEmailText(data: WelcomeTemplateData): string {
  const { userName, loginUrl } = data;

  return `
Welcome, ${userName}!

Thanks for signing up for Assets Man. Your account is ready to use.

With Assets Man, you can:
- Upload and organize your files
- Share files securely with anyone
- Access your assets from anywhere

Get started: ${loginUrl}

---
Assets Man
  `.trim();
}
