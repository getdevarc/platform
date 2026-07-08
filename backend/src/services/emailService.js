const nodemailer = require("nodemailer");

// In-memory OTP cache: email -> { code, expiresAt }
const otpCache = new Map();

// Helper to generate a random 6-digit number string
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Sends a signup OTP.
 */
async function sendSignupOTP(email) {
    const code = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    otpCache.set(email.toLowerCase(), { code, expiresAt });

    console.log(`[EMAIL SERVICE] Generated OTP for ${email}: ${code}`);

    // Try creating nodemailer transport if SMTP config is present
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass) {
        try {
            const transporter = nodemailer.createTransport({
                host: smtpHost,
                port: parseInt(smtpPort, 10),
                secure: parseInt(smtpPort, 10) === 465,
                auth: {
                    user: smtpUser,
                    pass: smtpPass,
                },
            });

            const mailOptions = {
                from: `"DevArc Team" <${smtpUser}>`,
                to: email,
                subject: "DevArc Account Verification - OTP Code",
                text: `Your verification code is ${code}. It expires in 10 minutes.`,
                html: `
          <div style="font-family: sans-serif; padding: 20px; background-color: #0b0b0a; color: #ffffff; border-radius: 10px; max-width: 500px;">
            <h2 style="color: #6366f1;">Verify your DevArc Account</h2>
            <p>Welcome to DevArc! Please use the following one-time passcode to verify your email address and continue setup:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 15px; background-color: #1c1c1a; border-radius: 5px; text-align: center; margin: 20px 0; color: #6366f1;">
              ${code}
            </div>
            <p style="font-size: 12px; color: #71717a;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
          </div>
        `,
            };

            await transporter.sendMail(mailOptions);
            console.log(`[EMAIL SERVICE] SMTP email sent successfully to ${email}`);
        } catch (err) {
            console.error("[EMAIL SERVICE] SMTP Error — falling back to console log: ", err);
        }
    } else {
        console.log("[EMAIL SERVICE] No SMTP credentials configured. OTP code is logged above.");
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
    verifyOTP,
};
