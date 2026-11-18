const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Cache Base64 Logo strings for fast email embedding
let cachedLogoBase64 = null;
const getLogoBase64 = () => {
    if (cachedLogoBase64) return cachedLogoBase64;
    try {
        const logoPath = path.resolve(__dirname, '../assets/logo-transparent.png');
        if (fs.existsSync(logoPath)) {
            const buf = fs.readFileSync(logoPath);
            cachedLogoBase64 = `data:image/png;base64,${buf.toString('base64')}`;
            return cachedLogoBase64;
        }
        const fallbackPath = path.resolve(__dirname, '../../frontend/public/logo-transparent.png');
        if (fs.existsSync(fallbackPath)) {
            const buf = fs.readFileSync(fallbackPath);
            cachedLogoBase64 = `data:image/png;base64,${buf.toString('base64')}`;
            return cachedLogoBase64;
        }
    } catch (e) {
        console.warn('[Email Logo Warning] Could not read logo file:', e.message);
    }
    return '';
};

/**
 * 1. Branded 6-digit OTP Verification Email Template
 * Matching SerbisYou brand specifications & ITE11 standards with high-contrast OTP container.
 */
const renderOtpEmailHtml = (otp, title = 'Verification Code', subtitle = 'Use this code to verify your action on SerbisYou', name = 'Student') => {
    const logoSrc = getLogoBase64();
    const logoHtml = logoSrc
        ? `<img src="${logoSrc}" alt="SerbisYou" style="height: 52px; max-width: 220px; object-fit: contain; display: block; border: 0;" />`
        : `<span style="font-size: 26px; font-weight: 800; color: #1e40af; letter-spacing: -0.5px;">Serbis<span style="color: #2563eb;">You</span></span>`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - SerbisYou</title>
</head>
<body style="margin: 0; padding: 0; background-color: #dce8f3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #dce8f3; padding: 40px 15px;">
        <tr>
            <td align="center">
                <!-- Main Email Card -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(10, 25, 47, 0.08); border: 1px solid #c8d3e0;">
                    <!-- Header with Logo -->
                    <tr>
                        <td style="padding: 30px 40px 15px 40px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td>
                                        ${logoHtml}
                                    </td>
                                    <td align="right">
                                        <span style="display: inline-block; padding: 6px 14px; background-color: rgba(37, 99, 235, 0.12); color: #1e40af; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                                            2FA Security
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Title & Accent Line -->
                    <tr>
                        <td style="padding: 28px 40px 0 40px;">
                            <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #1d4ed8; line-height: 1.25;">
                                ${title}
                            </h1>
                            <div style="width: 48px; height: 4px; background-color: #2563eb; border-radius: 2px; margin-top: 12px;"></div>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 22px 40px 20px 40px; font-size: 15px; line-height: 1.7; color: #334155;">
                            <p style="margin: 0 0 14px 0;">
                                Dear <strong>${name}</strong>,
                            </p>
                            <p style="margin: 0 0 18px 0;">
                                ${subtitle}. Please use the 6-digit confirmation code below to complete your authentication on <strong>SerbisYou</strong>.
                            </p>

                            <!-- High-Contrast OTP Code Card -->
                            <div style="background-color: #f8fafc; border: 2px dashed #2563eb; border-radius: 12px; padding: 22px; text-align: center; margin: 22px 0;">
                                <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                                    Your 6-Digit One-Time Password
                                </div>
                                <div style="font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #1e40af; font-family: 'Courier New', Courier, monospace; margin: 8px 0; margin-left: 10px;">
                                    ${otp}
                                </div>
                                <div style="font-size: 13px; color: #ef4444; font-weight: 600; margin-top: 6px;">
                                    ⏱️ Valid for 10 minutes only
                                </div>
                            </div>

                            <!-- Security Warning -->
                            <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px 16px; margin: 18px 0;">
                                <p style="margin: 0; color: #92400e; font-size: 12px; line-height: 1.5;">
                                    🔒 <strong>Security Notice:</strong> Never share this code with anyone. SerbisYou campus staff and administrators will never ask for your verification code or password.
                                </p>
                            </div>

                            <p style="margin: 0 0 14px 0; font-size: 13px; color: #64748b;">
                                If you did not initiate this request, you can safely disregard this email. Your account remains protected.
                            </p>

                            <p style="margin: 22px 0 0 0; font-size: 14px; color: #1e293b;">
                                Warm regards,<br />
                                <strong style="color: #1e40af;">The SerbisYou Campus Team</strong>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 40px 25px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; line-height: 1.5;">
                            <div style="font-weight: 600; color: #475569;">SerbisYou • Student Services Platform</div>
                            <div style="margin-top: 4px; font-size: 11px;">Connecting student talent with campus service opportunities.</div>
                            <div style="margin-top: 4px; font-size: 11px; color: #94a3b8;">&copy; ${new Date().getFullYear()} SerbisYou. All rights reserved.</div>
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
 * 2. Waiting for Approval Email Template
 * Sent to student immediately after email OTP verification while awaiting admin review.
 */
const renderPendingValidationEmailHtml = (user = {}) => {
    const logoSrc = getLogoBase64();
    const logoHtml = logoSrc
        ? `<img src="${logoSrc}" alt="SerbisYou" style="height: 52px; max-width: 220px; object-fit: contain; display: block; border: 0;" />`
        : `<span style="font-size: 26px; font-weight: 800; color: #1e40af; letter-spacing: -0.5px;">Serbis<span style="color: #2563eb;">You</span></span>`;

    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Student';
    const location = [user.barangay, user.city, user.province].filter(Boolean).join(', ') || 'Mindoro State University';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registration Received - Awaiting Approval - SerbisYou</title>
</head>
<body style="margin: 0; padding: 0; background-color: #dce8f3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #dce8f3; padding: 40px 15px;">
        <tr>
            <td align="center">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(10, 25, 47, 0.08); border: 1px solid #c8d3e0;">
                    <!-- Header with Logo -->
                    <tr>
                        <td style="padding: 30px 40px 15px 40px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td>
                                        ${logoHtml}
                                    </td>
                                    <td align="right">
                                        <span style="display: inline-block; padding: 6px 14px; background-color: rgba(234, 179, 8, 0.18); color: #854d0e; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                                            Pending Validation
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Title & Accent Line -->
                    <tr>
                        <td style="padding: 28px 40px 0 40px;">
                            <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #1d4ed8; line-height: 1.25;">
                                Welcome to SerbisYou!
                            </h1>
                            <div style="width: 48px; height: 4px; background-color: #eab308; border-radius: 2px; margin-top: 12px;"></div>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 22px 40px 20px 40px; font-size: 15px; line-height: 1.7; color: #334155;">
                            <p style="margin: 0 0 14px 0;">
                                Dear <strong>${fullName}</strong>,
                            </p>
                            <p style="margin: 0 0 18px 0;">
                                Thank you for creating an account on <strong>SerbisYou</strong>! Your email address has been successfully verified, and your student application has been submitted to the campus administrator for validation.
                            </p>

                            <!-- Application Overview Box -->
                            <div style="background-color: #f8fafc; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; margin: 20px 0;">
                                <div style="font-size: 12px; font-weight: 700; color: #1e40af; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
                                    Registration Summary
                                </div>
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px;">
                                    <tr>
                                        <td style="padding: 5px 0; color: #64748b; width: 40%;">User ID:</td>
                                        <td style="padding: 5px 0; font-weight: 600; color: #0f172a;">${user.user_id || 'Auto-assigned'}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 5px 0; color: #64748b;">Campus Location:</td>
                                        <td style="padding: 5px 0; font-weight: 600; color: #0f172a;">${location}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 5px 0; color: #64748b;">Account Type:</td>
                                        <td style="padding: 5px 0; font-weight: 600; color: #0f172a;">${user.user_type || 'Student'}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 5px 0; color: #64748b;">Status:</td>
                                        <td style="padding: 5px 0; font-weight: 700; color: #d97706;">Awaiting Administrator Approval</td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Timeline Progress Box -->
                            <div style="background-color: rgba(37, 99, 235, 0.04); border: 1px dashed #93c5fd; border-radius: 12px; padding: 18px; margin: 18px 0;">
                                <div style="font-size: 14px; font-weight: 700; color: #1e40af; margin-bottom: 10px;">What happens next?</div>
                                <div style="font-size: 13px; color: #334155; margin-bottom: 8px;">
                                    1. <strong>Verification in progress:</strong> A campus administrator is reviewing your submitted credentials to maintain a trusted campus community.
                                </div>
                                <div style="font-size: 13px; color: #334155;">
                                    2. <strong>Instant Confirmation:</strong> As soon as your account is approved, you will receive an email confirmation and can immediately log in to publish services or book campus peers!
                                </div>
                            </div>

                            <p style="margin: 22px 0 0 0; font-size: 14px; color: #1e293b;">
                                Warm regards,<br />
                                <strong style="color: #1e40af;">The SerbisYou Campus Team</strong>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 40px 25px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; line-height: 1.5;">
                            <div style="font-weight: 600; color: #475569;">SerbisYou • Student Services Platform</div>
                            <div style="margin-top: 4px; font-size: 11px;">Connecting student talent with campus service opportunities.</div>
                            <div style="margin-top: 4px; font-size: 11px; color: #94a3b8;">&copy; ${new Date().getFullYear()} SerbisYou. All rights reserved.</div>
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
 * 3. Approved Account Notification Email Template
 * Sent to student as soon as their account status is marked 'active' / approved by admin.
 */
const renderAccountApprovedEmailHtml = (user = {}) => {
    const logoSrc = getLogoBase64();
    const logoHtml = logoSrc
        ? `<img src="${logoSrc}" alt="SerbisYou" style="height: 52px; max-width: 220px; object-fit: contain; display: block; border: 0;" />`
        : `<span style="font-size: 26px; font-weight: 800; color: #1e40af; letter-spacing: -0.5px;">Serbis<span style="color: #2563eb;">You</span></span>`;

    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Student';
    const loginUrl = process.env.CLIENT_ORIGIN ? `${process.env.CLIENT_ORIGIN}/sign-in` : 'http://localhost:5173/sign-in';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your SerbisYou Account Has Been Approved! - SerbisYou</title>
</head>
<body style="margin: 0; padding: 0; background-color: #dce8f3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #dce8f3; padding: 40px 15px;">
        <tr>
            <td align="center">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(10, 25, 47, 0.08); border: 1px solid #c8d3e0;">
                    <!-- Header with Logo -->
                    <tr>
                        <td style="padding: 30px 40px 15px 40px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td>
                                        ${logoHtml}
                                    </td>
                                    <td align="right">
                                        <span style="display: inline-block; padding: 6px 14px; background-color: rgba(22, 163, 74, 0.15); color: #15803d; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                                            Approved
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Title & Accent Line -->
                    <tr>
                        <td style="padding: 28px 40px 0 40px;">
                            <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #1d4ed8; line-height: 1.25;">
                                Account Approved! 🎉
                            </h1>
                            <div style="width: 48px; height: 4px; background-color: #22c55e; border-radius: 2px; margin-top: 12px;"></div>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 22px 40px 20px 40px; font-size: 15px; line-height: 1.7; color: #334155;">
                            <p style="margin: 0 0 14px 0;">
                                Hello <strong>${fullName}</strong>,
                            </p>
                            <p style="margin: 0 0 18px 0;">
                                Congratulations! Your student account registration on <strong>SerbisYou</strong> has been reviewed and <strong style="color: #16a34a;">APPROVED</strong> by the campus administrator.
                            </p>

                            <!-- Call to Action Box -->
                            <div style="background-color: #f8fafc; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; text-align: center; margin: 22px 0;">
                                <div style="font-size: 14px; color: #475569; margin-bottom: 16px;">
                                    Your account is now fully active. You can sign in to SerbisYou to browse campus services or publish your offers!
                                </div>
                                <a href="${loginUrl}" target="_blank" style="display: inline-block; padding: 12px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 9999px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">
                                    Sign In to SerbisYou ↗
                                </a>
                            </div>

                            <p style="margin: 22px 0 0 0; font-size: 14px; color: #1e293b;">
                                Warm regards,<br />
                                <strong style="color: #1e40af;">The SerbisYou Campus Administration</strong>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 40px 25px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; line-height: 1.5;">
                            <div style="font-weight: 600; color: #475569;">SerbisYou • Student Services Platform</div>
                            <div style="margin-top: 4px; font-size: 11px;">Connecting student talent with campus service opportunities.</div>
                            <div style="margin-top: 4px; font-size: 11px; color: #94a3b8;">&copy; ${new Date().getFullYear()} SerbisYou. All rights reserved.</div>
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
        secure: port === 465,
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
 * and logs cleanly if credentials are not configured yet.
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

    // 3. Fallback / Dev Mode Logger
    console.log('\n==================================================');
    console.log('[EMAIL NOTICE] Sent in dev mode:');
    console.log(`Target:  ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('==================================================\n');

    return { devMode: true };
};

/**
 * Specialized helper for 6-digit OTP codes (Registration, 2FA Sign-In, Password Reset)
 */
const sendOtpEmail = async (email, otp, subject = 'Your SerbisYou Verification Code', subtitle = 'Use this code to verify your action on SerbisYou', name = 'Student') => {
    const html = renderOtpEmailHtml(otp, subject, subtitle, name);
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

/**
 * Helper to dispatch "Waiting for Approval" notification email
 */
const sendPendingValidationEmail = async (user) => {
    if (!user || !user.email) return;
    const html = renderPendingValidationEmailHtml(user);
    const text = `Dear ${user.first_name || 'Student'},\n\nThank you for registering on SerbisYou! Your email has been verified and your account is currently pending administrator validation.\n\nYou will receive another notification once approved.\n\nWarm regards,\nSerbisYou Campus Team`;

    return sendEmail({
        to: user.email,
        subject: 'Welcome to SerbisYou! Student Registration Received (Pending Approval)',
        html,
        text
    });
};

/**
 * Helper to dispatch "Account Approved" notification email
 */
const sendAccountApprovedEmail = async (user) => {
    if (!user || !user.email) return;
    const html = renderAccountApprovedEmailHtml(user);
    const text = `Dear ${user.first_name || 'Student'},\n\nCongratulations! Your SerbisYou account has been reviewed and APPROVED by the campus administrator.\n\nYou can now log in at http://localhost:5173/sign-in.\n\nWarm regards,\nSerbisYou Campus Administration`;

    return sendEmail({
        to: user.email,
        subject: 'Your SerbisYou Account Has Been Approved! 🎉',
        html,
        text
    });
};

module.exports = {
    sendEmail,
    sendOtpEmail,
    sendPendingValidationEmail,
    sendAccountApprovedEmail,
    renderOtpEmailHtml,
    renderPendingValidationEmailHtml,
    renderAccountApprovedEmailHtml
};
