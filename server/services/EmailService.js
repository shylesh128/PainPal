/**
 * @fileoverview Email service for sending various notification emails
 * @module services/EmailService
 */

const nodemailer = require("nodemailer");

/**
 * Email Service class for handling all email communications
 * Uses nodemailer with Gmail SMTP
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.from = process.env.EMAIL_FROM || "PainPal <noreply@painpal.com>";
    this.baseUrl = process.env.FRONTEND_URL || "http://localhost:4008";
    this.isConfigured = false;

    this._initialize();
  }

  /**
   * Initialize the email transporter
   * @private
   */
  _initialize() {
    // Check if email configuration exists
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn(
        "⚠️ Email service not configured. Set EMAIL_USER and EMAIL_PASS environment variables."
      );
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      this.isConfigured = true;
      console.log("✅ Email service initialized");
    } catch (error) {
      console.error("❌ Failed to initialize email service:", error.message);
    }
  }

  /**
   * Send an email
   * @private
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.html - Email HTML content
   * @returns {Promise<void>}
   */
  async _send({ to, subject, html }) {
    if (!this.isConfigured) {
      console.log(
        `📧 [Email skipped - not configured] To: ${to}, Subject: ${subject}`
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
      });
      console.log(`📧 Email sent to ${to}: ${subject}`);
    } catch (error) {
      console.error(`❌ Failed to send email to ${to}:`, error.message);
      throw error;
    }
  }

  /**
   * Generate email template wrapper
   * @private
   * @param {string} content - Email content
   * @returns {string} HTML email template
   */
  _template(content) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              line-height: 1.6;
              color: #1a1a1a;
              background-color: #f5f5f5;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #8b0000, #dc143c);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .header p {
              margin: 10px 0 0;
              opacity: 0.9;
            }
            .content {
              padding: 40px 30px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #8b0000, #dc143c);
              color: white !important;
              text-decoration: none;
              padding: 14px 32px;
              border-radius: 8px;
              font-weight: 600;
              margin: 20px 0;
            }
            .button:hover {
              opacity: 0.9;
            }
            .footer {
              background: #f8f8f8;
              padding: 20px 30px;
              text-align: center;
              font-size: 14px;
              color: #666;
            }
            .footer a {
              color: #8b0000;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🩹 PainPal</h1>
              <p>Share your pain, find your community</p>
            </div>
            <div class="content">
              ${content}
            </div>
            <div class="footer">
              <p>This email was sent by PainPal. If you didn't request this, you can safely ignore it.</p>
              <p><a href="${this.baseUrl}">Visit PainPal</a></p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Send verification email
   * @param {Object} user - User object
   * @param {string} token - Verification token (unhashed)
   * @returns {Promise<void>}
   */
  async sendVerificationEmail(user, token) {
    const verifyUrl = `${this.baseUrl}/verify-email?token=${token}`;

    const content = `
      <h2>Welcome to PainPal, ${user.name}! 👋</h2>
      <p>We're excited to have you join our community. Before you can start sharing and connecting, please verify your email address.</p>
      <p style="text-align: center;">
        <a href="${verifyUrl}" class="button">Verify Email Address</a>
      </p>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${verifyUrl}</p>
      <p><strong>This link expires in 24 hours.</strong></p>
    `;

    await this._send({
      to: user.email,
      subject: "🩹 Verify your PainPal email",
      html: this._template(content),
    });
  }

  /**
   * Send welcome email after verification
   * @param {Object} user - User object
   * @returns {Promise<void>}
   */
  async sendWelcomeEmail(user) {
    const content = `
      <h2>You're all set, ${user.name}! 🎉</h2>
      <p>Your email has been verified and your PainPal account is now active.</p>
      <p>Here's what you can do now:</p>
      <ul>
        <li>Share your thoughts and experiences</li>
        <li>Join servers and connect with others</li>
        <li>Chat globally or privately</li>
        <li>Customize your profile and mood</li>
      </ul>
      <p style="text-align: center;">
        <a href="${this.baseUrl}" class="button">Start Exploring</a>
      </p>
      <p>Remember, this is a safe space. We're here to listen and support each other. 💜</p>
    `;

    await this._send({
      to: user.email,
      subject: "🎉 Welcome to PainPal!",
      html: this._template(content),
    });
  }

  /**
   * Send password reset email
   * @param {Object} user - User object
   * @param {string} token - Reset token (unhashed)
   * @returns {Promise<void>}
   */
  async sendPasswordResetEmail(user, token) {
    const resetUrl = `${this.baseUrl}/reset-password?token=${token}`;

    const content = `
      <h2>Password Reset Request</h2>
      <p>Hi ${user.name},</p>
      <p>We received a request to reset your password. Click the button below to set a new password:</p>
      <p style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </p>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${resetUrl}</p>
      <p><strong>This link expires in 1 hour.</strong></p>
      <p>If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
    `;

    await this._send({
      to: user.email,
      subject: "🔐 Reset your PainPal password",
      html: this._template(content),
    });
  }

  /**
   * Send password changed notification
   * @param {Object} user - User object
   * @returns {Promise<void>}
   */
  async sendPasswordChangedEmail(user) {
    const content = `
      <h2>Password Changed</h2>
      <p>Hi ${user.name},</p>
      <p>Your PainPal password was successfully changed.</p>
      <p>If you made this change, you can safely ignore this email.</p>
      <p><strong>If you didn't change your password,</strong> please contact us immediately or reset your password:</p>
      <p style="text-align: center;">
        <a href="${this.baseUrl}/forgot-password" class="button">Reset Password</a>
      </p>
    `;

    await this._send({
      to: user.email,
      subject: "🔒 Your PainPal password was changed",
      html: this._template(content),
    });
  }

  /**
   * Send login alert for new device/location
   * @param {Object} user - User object
   * @param {Object} deviceInfo - Device information
   * @returns {Promise<void>}
   */
  async sendLoginAlertEmail(user, deviceInfo) {
    const content = `
      <h2>New Login Detected</h2>
      <p>Hi ${user.name},</p>
      <p>We noticed a new login to your PainPal account:</p>
      <ul>
        <li><strong>Device:</strong> ${deviceInfo.device || "Unknown"}</li>
        <li><strong>Browser:</strong> ${deviceInfo.browser || "Unknown"}</li>
        <li><strong>Location:</strong> ${deviceInfo.location || "Unknown"}</li>
        <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
      </ul>
      <p>If this was you, no action is needed.</p>
      <p><strong>If this wasn't you,</strong> please change your password immediately:</p>
      <p style="text-align: center;">
        <a href="${
          this.baseUrl
        }/forgot-password" class="button">Secure My Account</a>
      </p>
    `;

    await this._send({
      to: user.email,
      subject: "🔔 New login to your PainPal account",
      html: this._template(content),
    });
  }
}

// Export singleton instance
module.exports = new EmailService();

