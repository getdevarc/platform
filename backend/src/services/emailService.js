const nodemailer = require("nodemailer");

// In-memory OTP cache: email -> { code, expiresAt }
const otpCache = new Map();

// Helper to generate a random 6-digit number string
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Returns a configured nodemailer transporter.
 */
function getTransporter() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    const missing = [];
    if (!smtpHost) missing.push("SMTP_HOST");
    if (!smtpUser) missing.push("SMTP_USER");
    if (!smtpPass) missing.push("SMTP_PASS");
    throw new Error(`SMTP configuration is incomplete. Missing: ${missing.join(", ")}`);
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort, 10),
    secure: parseInt(smtpPort, 10) === 465,
    requireTLS: true,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

/**
 * Wraps content in a premium light-mode layout.
 */
function getEmailLayoutHTML(title, contentHtml) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #27272a;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <!-- Top Accent Bar -->
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #4f46e5, #6366f1, #818cf8);"></td>
          </tr>
          
          <!-- Branded Header -->
          <tr>
            <td align="center" style="padding: 32px 24px 20px 24px;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color: rgba(99, 102, 241, 0.05); border: 1px solid rgba(99, 102, 241, 0.1); border-radius: 12px; padding: 12px 20px;">
                    <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 20px; font-weight: 800; color: #4f46e5; letter-spacing: -0.5px;">DevArc</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              ${contentHtml}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 24px; background-color: #fafafa; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0 0 4px 0; font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">DevArc Engine</p>
              <p style="margin: 0; font-size: 11px; color: #71717a;">Adaptive Profile Mapping & Skill Gap Audits</p>
              <p style="margin: 12px 0 0 0; font-size: 10px; color: #a1a1aa;">&copy; 2026 DevArc Tech, Inc. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
}

/**
 * Sends a signup OTP. (Sends from SMTP_FROM)
 */
async function sendSignupOTP(email) {
  const code = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

  otpCache.set(email.toLowerCase(), { code, expiresAt });

  console.log(`[EMAIL SERVICE] Generated Signup OTP for ${email}: ${code}`);

  const transporter = getTransporter();

  // Fallback if env parameters are not configured
  const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER;
  const smtpFromName = process.env.SMTP_FROM_NAME || "DevArc";

  const contentHtml = `
      <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #18181b; text-align: center; letter-spacing: -0.5px;">Verify your Email Address</h1>
      <p style="margin: 0 0 24px 0; font-size: 14.5px; color: #52525b; text-align: center; line-height: 1.5;">Welcome to DevArc! Enter the following code in the registration screen to verify your account.</p>
      
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 12px; table-layout: fixed; margin-bottom: 24px;">
        <tr>
          <td align="center" style="padding: 20px;">
            <div style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 38px; font-weight: 800; color: #4f46e5; letter-spacing: 8px; text-indent: 8px;">${code}</div>
          </td>
        </tr>
      </table>

      <div style="color: #71717a; font-size: 13px; line-height: 1.6; border-top: 1px dashed #e4e4e7; padding-top: 20px;">
        <p style="margin: 0 0 8px 0; color: #52525b;"><strong>Important Notes:</strong></p>
        <ul style="margin: 0; padding-left: 20px; color: #71717a;">
          <li style="margin-bottom: 4px;">This code is valid for <strong>10 minutes</strong>.</li>
          <li style="margin-bottom: 4px;">If you didn't request this email, please ignore or delete it.</li>
          <li>Never share this code with anyone.</li>
        </ul>
      </div>
    `;

  const mailOptions = {
    from: `"${smtpFromName}" <${smtpFrom}>`,
    to: email,
    subject: "DevArc Account Verification - OTP Code",
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
    html: getEmailLayoutHTML("Verify your Email Address", contentHtml),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SERVICE] Signup OTP email sent successfully to ${email}`);
  } catch (err) {
    console.error("[EMAIL SERVICE] Signup SMTP Error: ", err);
    throw new Error(`Email delivery failed: ${err.message}`);
  }
  return true;
}

/**
 * Sends a password reset OTP. (Sends from support@getdevarc.com)
 */
async function sendResetPasswordOTP(email) {
  const code = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

  otpCache.set(email.toLowerCase(), { code, expiresAt });

  console.log(`[EMAIL SERVICE] Generated Forgot Password OTP for ${email}: ${code}`);

  const transporter = getTransporter();

  // For password reset, send from support@getdevarc.com or SMTP_FROM_SUPPORT env
  const smtpFrom = process.env.SMTP_FROM_SUPPORT || "support@getdevarc.com";
  const smtpFromName = "DevArc Support";

  const contentHtml = `
      <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #18181b; text-align: center; letter-spacing: -0.5px;">Reset your Password</h1>
      <p style="margin: 0 0 24px 0; font-size: 14.5px; color: #52525b; text-align: center; line-height: 1.5;">We received a request to reset your DevArc account password. Use the code below to proceed.</p>
      
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 12px; table-layout: fixed; margin-bottom: 24px;">
        <tr>
          <td align="center" style="padding: 20px;">
            <div style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 38px; font-weight: 800; color: #4f46e5; letter-spacing: 8px; text-indent: 8px;">${code}</div>
          </td>
        </tr>
      </table>

      <div style="color: #71717a; font-size: 13px; line-height: 1.6; border-top: 1px dashed #e4e4e7; padding-top: 20px;">
        <p style="margin: 0 0 8px 0; color: #52525b;"><strong>Important Notes:</strong></p>
        <ul style="margin: 0; padding-left: 20px; color: #71717a;">
          <li style="margin-bottom: 4px;">This code is valid for <strong>10 minutes</strong>.</li>
          <li style="margin-bottom: 4px;">If you did not request this password reset, please change your credentials immediately or contact support.</li>
        </ul>
      </div>
    `;

  const mailOptions = {
    from: `"${smtpFromName}" <${smtpFrom}>`,
    to: email,
    subject: "DevArc Account - Password Reset OTP",
    text: `Your password reset code is ${code}. It expires in 10 minutes.`,
    html: getEmailLayoutHTML("Reset your Password", contentHtml),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SERVICE] Forgot Password OTP email sent successfully to ${email}`);
  } catch (err) {
    console.error("[EMAIL SERVICE] Reset Password OTP SMTP Error: ", err);
    throw new Error(`Email delivery failed: ${err.message}`);
  }
  return true;
}

/**
 * Sends a welcome email after successful registration. (Sends from SMTP_FROM)
 */
async function sendWelcomeEmail(email, name) {
  console.log(`[EMAIL SERVICE] Sending Welcome Email to ${email} (Name: ${name})`);

  const transporter = getTransporter();

  const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER;
  const smtpFromName = process.env.SMTP_FROM_NAME || "DevArc";

  const contentHtml = `
      <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #18181b; text-align: center; letter-spacing: -0.5px;">Welcome to DevArc, ${name || "Dev"}!</h1>
      <p style="margin: 0 0 24px 0; font-size: 14.5px; color: #52525b; text-align: center; line-height: 1.5;">We are thrilled to welcome you to DevArc. Your adaptive career journey starts here. Here is what you can do on our platform now:</p>
      
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 12px; background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; margin-bottom: 12px; display: block;">
            <h3 style="margin: 0 0 4px 0; font-size: 14px; color: #4f46e5;">💻 AI Biography Mapping</h3>
            <p style="margin: 0; font-size: 12.5px; color: #52525b; line-height: 1.45;">Capture and persist your career path targets. Our AI mapping engine optimizes path selection against your personal benchmarks.</p>
          </td>
        </tr>
        <tr>
          <td height="10"></td>
        </tr>
        <tr>
          <td style="padding: 12px; background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; margin-bottom: 12px; display: block;">
            <h3 style="margin: 0 0 4px 0; font-size: 14px; color: #4f46e5;">🔍 Skill Gap Audits</h3>
            <p style="margin: 0; font-size: 12.5px; color: #52525b; line-height: 1.45;">Upload your resume and immediately diagnose technical gaps against top-tier tech roles at companies like Google and Stripe.</p>
          </td>
        </tr>
        <tr>
          <td height="10"></td>
        </tr>
        <tr>
          <td style="padding: 12px; background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; display: block;">
            <h3 style="margin: 0 0 4px 0; font-size: 14px; color: #4f46e5;">📈 Adaptive Training Paths</h3>
            <p style="margin: 0; font-size: 12.5px; color: #52525b; line-height: 1.45;">Unlock hand-crafted algorithmic challenges matching your timeline, background, and specific domain targets.</p>
          </td>
        </tr>
      </table>

      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding-top: 10px;">
            <a href="http://localhost:3000/dashboard" style="background-color: #4f46e5; border: 1px solid #4f46e5; border-radius: 10px; color: #ffffff; display: inline-block; font-size: 14px; font-weight: 700; line-height: 48px; text-align: center; text-decoration: none; width: 200px; -webkit-text-size-adjust: none; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.15);">Explore Your Dashboard</a>
          </td>
        </tr>
      </table>
    `;

  const mailOptions = {
    from: `"${smtpFromName}" <${smtpFrom}>`,
    to: email,
    subject: "Welcome to DevArc!",
    text: `Welcome to DevArc, ${name || "Dev"}! Access your dashboard at http://localhost:3000/dashboard`,
    html: getEmailLayoutHTML(`Welcome to DevArc!`, contentHtml),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SERVICE] Welcome email sent successfully to ${email}`);
  } catch (err) {
    console.error("[EMAIL SERVICE] Welcome Email SMTP Error: ", err);
  }
  return true;
}

/**
 * Sends a password reset confirmation email. (Sends from support@getdevarc.com)
 */
async function sendPasswordResetConfirmation(email) {
  console.log(`[EMAIL SERVICE] Sending Password Reset Confirmation to ${email}`);

  const transporter = getTransporter();

  const smtpFrom = process.env.SMTP_FROM_SUPPORT || "support@getdevarc.com";
  const smtpFromName = "DevArc Support";

  const contentHtml = `
      <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #18181b; text-align: center; letter-spacing: -0.5px;">Password Reset Successful</h1>
      <p style="margin: 0 0 24px 0; font-size: 14.5px; color: #52525b; text-align: center; line-height: 1.5;">This email confirms that your DevArc password has been successfully reset. You can now login to your account using your new credentials.</p>
      
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding-top: 10px;">
            <a href="http://localhost:3000/login" style="background-color: #4f46e5; border: 1px solid #4f46e5; border-radius: 10px; color: #ffffff; display: inline-block; font-size: 14px; font-weight: 700; line-height: 48px; text-align: center; text-decoration: none; width: 200px; -webkit-text-size-adjust: none; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.15);">Login to Account</a>
          </td>
        </tr>
      </table>

      <div style="color: #71717a; font-size: 13px; line-height: 1.6; border-top: 1px dashed #e4e4e7; padding-top: 24px; margin-top: 24px;">
        <p style="margin: 0 0 4px 0; color: #ea580c;"><strong>Did not perform this action?</strong></p>
        <p style="margin: 0; color: #71717a;">If you did not request or make this change, please reset your password immediately or contact our support team at <a href="mailto:support@getdevarc.com" style="color: #4f46e5; text-decoration: none;">support@getdevarc.com</a> to secure your account.</p>
      </div>
    `;

  const mailOptions = {
    from: `"${smtpFromName}" <${smtpFrom}>`,
    to: email,
    subject: "DevArc Account - Password Changed",
    text: `Your DevArc password was successfully changed. If this wasn't you, contact support.`,
    html: getEmailLayoutHTML("Password Reset Successful", contentHtml),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SERVICE] Password reset confirmation sent successfully to ${email}`);
  } catch (err) {
    console.error("[EMAIL SERVICE] Password Reset Confirmation SMTP Error: ", err);
  }
  return true;
}

/**
 * Validates an OTP.
 */
function verifyOTP(email, code) {
  const record = otpCache.get(email.toLowerCase());
  if (!record) return false;

  if (Date.now() > record.expiresAt) {
    otpCache.delete(email.toLowerCase());
    return false;
  }

  if (record.code !== code) {
    return false;
  }

  // OTP verified! Delete it so it cannot be reused
  otpCache.delete(email.toLowerCase());
  return true;
}

module.exports = {
  sendSignupOTP,
  sendResetPasswordOTP,
  sendWelcomeEmail,
  sendPasswordResetConfirmation,
  verifyOTP,
};
