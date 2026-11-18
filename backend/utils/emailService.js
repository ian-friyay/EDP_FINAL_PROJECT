const nodemailer = require('nodemailer');

/**
 * Renders an accessible, responsive HTML email template for SerbisYou.
 */
const renderOtpEmailHtml = (otp, title = 'SerbisYou Verification Code', subtitle = 'Use this code to verify your action on SerbisYou') => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SerbisYou Security Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #eef2f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #eef2f6; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(10, 25, 47, 0.08); border: 1px solid #e2e8f0;" border="0" cellspacing="0" cellpadding="0">
          <!-- Branded Navy Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0A192F 0%, #063a8f 100%); padding: 32px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: 0.5px;">SerbisYou</h1>
              <p style="margin: 6px 0 0 0; color: #cbd5e1; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px;">Mindoro State University Marketplace</p>
            </td>
          </tr>
          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px 28px 32px; text-align: center;">
              <h2 style="margin: 0 0 10px 0; color: #0f172a; font-size: 20px; font-weight: 700;">${title}</h2>
              <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px; line-height: 1.5;">${subtitle}</p>
              
              <!-- Prominent OTP Code Container -->
              <div style="background-color: #f8fafc; border: 2px dashed #063a8f; border-radius: 12px; padding: 18px 24px; margin: 0 auto 24px auto; display: inline-block;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; color: #063a8f; letter-spacing: 10px; display: block; margin-left: 10px;">
                  ${otp}
                </span>
              </div>

              <!-- Expiry Note -->
              <p style="margin: 0 0 20px 0; color: #475569; font-size: 13px;">
                ⏱️ This verification code is valid for <strong>10 minutes</strong>.
              </p>

              <!-- Security Notice -->
              <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px 16px; text-align: left; margin-bottom: 24px;">
                <p style="margin: 0; color: #92400e; font-size: 12px; line-height: 1.5;">
                  🔒 <strong>Security Notice:</strong> Never share this code with anyone. SerbisYou campus staff and administrators will never ask for your verification code or password.
                </p>
              </div>

              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                If you did not attempt to sign in or verify your account, please secure your password immediately.
              </p>
            </td>
          </tr>
          <!-- University Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                Mindoro State University (MinSU) • Student Services Platform
              </p>
              <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 11px;">
                &copy; ${new Date().getFullYear()} SerbisYou. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
};

/**
 * Sends an email via Brevo REST API (HTTPS port 443 - immune to port blocking)
 */
const sendViaBrevoApi = async ({ to, subject, html, text }) => {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
        throw new Error('BREVO_API_KEY is not defined.');
    }

    const senderEmail = process.env.EMAIL_FROM || process.env.BREVO_SENDER_EMAIL || process.env.BREVO_SMTP_USER || process.env.EMAIL_USER;
    if (!senderEmail) {
        throw new Error('EMAIL_FROM or BREVO_SENDER_EMAIL must be set with your Brevo-verified sender address.');
    }

    const senderName = process.env.EMAIL_FROM_NAME || 'SerbisYou MinSU';

    const payload = {
        sender: {
            name: senderName,
            email: senderEmail
        },
        to: [
            { email: to }
        ],
        subject,
        htmlContent: html,
        textContent: text || 'Please view this email in an HTML-compatible client.'
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': apiKey.trim(),
            'content-type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const errorMsg = data.message || `Brevo API HTTP status ${response.status}`;
        throw new Error(`Brevo API delivery failed: ${errorMsg}`);
    }

    return {
        success: true,
        messageId: data.messageId,
        provider: 'brevo-api'
    };
};

/**
 * Sends an email via Brevo SMTP Relay (Nodemailer)
 */
const sendViaSmtp = async ({ to, subject, html, text }) => {
    const host = process.env.EMAIL_HOST || 'smtp-relay.brevo.com';
    const port = Number(process.env.EMAIL_PORT || 587);
    const user = process.env.BREVO_SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.BREVO_SMTP_KEY || process.env.EMAIL_PASS || process.env.BREVO_API_KEY;

    if (!user || !pass) {
        throw new Error('SMTP user and pass/key are not configured.');
    }

    const senderEmail = process.env.EMAIL_FROM || user;
    const senderName = process.env.EMAIL_FROM_NAME || 'SerbisYou MinSU';

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // 587 uses STARTTLS (secure: false)
        auth: {
            user: user.trim(),
            pass: pass.trim()
        }
    });

    const info = await transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to,
        subject,
        text: text || 'Please view this email in an HTML-compatible client.',
        html
    });

    return {
        success: true,
        messageId: info.messageId,
        provider: 'brevo-smtp'
    };
};

/**
 * Master email dispatcher that prioritizes Brevo API, falls back to Brevo SMTP,
 * and logs to console if credentials are not configured yet.
 */
const sendEmail = async ({ to, subject, html, text }) => {
    const hasBrevoApiKey = Boolean(process.env.BREVO_API_KEY);
    const hasSmtpConfig = Boolean((process.env.BREVO_SMTP_USER || process.env.EMAIL_USER) && (process.env.BREVO_SMTP_KEY || process.env.EMAIL_PASS));

    // 1. Try Brevo REST API first (recommended, no SMTP port blockage)
    if (hasBrevoApiKey) {
        try {
            const result = await sendViaBrevoApi({ to, subject, html, text });
            console.log(`[Brevo API Success] Email sent to ${to} (MessageId: ${result.messageId})`);
            return { devMode: false, provider: 'brevo-api' };
        } catch (apiError) {
            console.warn(`[Brevo API Warning] ${apiError.message}`);
            // Fall through to SMTP if configured
        }
    }

    // 2. Try Brevo / Custom SMTP
    if (hasSmtpConfig) {
        try {
            const result = await sendViaSmtp({ to, subject, html, text });
            console.log(`[SMTP Success] Email sent to ${to} (MessageId: ${result.messageId})`);
            return { devMode: false, provider: 'brevo-smtp' };
        } catch (smtpError) {
            console.warn(`[SMTP Warning] ${smtpError.message}`);
        }
    }

    // 3. Fallback / Dev Mode Logger if Brevo is not configured or fails
    console.log('\n==================================================');
    console.log('[BREVO SETUP NOTICE] Email could not be sent via live Brevo.');
    console.log('To send live emails, add the following to backend/.env:');
    console.log('  BREVO_API_KEY=your_brevo_v3_api_key_here');
    console.log('  EMAIL_FROM=your_verified_brevo_sender_email@domain.com');
    console.log('--------------------------------------------------');
    console.log(`Target Recipient: ${to}`);
    console.log(`Subject:          ${subject}`);
    console.log('==================================================\n');

    return { devMode: true };
};

/**
 * Specialized helper for 6-digit OTP codes (Registration, 2FA Sign-In, Password Reset)
 */
const sendOtpEmail = async (email, otp, subject = 'Your SerbisYou Verification Code', subtitle = 'Use this code to verify your action on SerbisYou') => {
    const html = renderOtpEmailHtml(otp, subject, subtitle);
    const text = `Your SerbisYou 6-digit verification code is: ${otp}. It will expire in 10 minutes.`;

    const result = await sendEmail({
        to: email,
        subject,
        html,
        text
    });

    if (result.devMode) {
        console.log(`[OTP CONSOLE LOG] Code for ${email}: ${otp}`);
    }

    return result;
};

module.exports = {
    sendEmail,
    sendOtpEmail,
    renderOtpEmailHtml
};
