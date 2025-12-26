const nodemailer = require("nodemailer");

/**
 * Email Service - Handles all email sending functionality
 * Following Single Responsibility Principle
 */

// Create reusable transporter using Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

const emailService = {
  /**
   * Send email using configured transporter
   * @param {object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.html - HTML content
   * @param {string} options.text - Plain text content (fallback)
   */
  async sendEmail({ to, subject, html, text }) {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"PainPal" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML for plain text
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Email error:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Send password reset email
   * @param {string} email - User's email
   * @param {string} resetToken - Password reset token
   * @param {string} baseUrl - Base URL for reset link
   */
  async sendPasswordResetEmail(email, resetToken, baseUrl) {
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1b1b1b; color: #f1f1f1;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #fff; margin: 0;">Pain<span style="background-color: #a785eb; color: #292929; padding: 2px 6px; border-radius: 8px; margin-left: 4px;">Pal</span></h1>
        </div>
        
        <h2 style="color: #a785eb;">Password Reset Request</h2>
        
        <p>You requested to reset your password. Click the button below to set a new password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #a785eb; color: #292929; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #888; font-size: 14px;">This link will expire in 10 minutes.</p>
        
        <p style="color: #888; font-size: 14px;">If you didn't request this, please ignore this email or contact support if you have concerns.</p>
        
        <hr style="border: none; border-top: 1px solid #333; margin: 30px 0;">
        
        <p style="color: #666; font-size: 12px; text-align: center;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetUrl}" style="color: #a785eb;">${resetUrl}</a>
        </p>
      </div>
    `;

    return await this.sendEmail({
      to: email,
      subject: "Reset Your PainPal Password",
      html,
    });
  },

  /**
   * Send security alert email when account is locked
   * @param {string} email - User's email
   * @param {string} username - User's username
   * @param {array} attemptIps - List of IP addresses that attempted login
   */
  async sendSecurityAlertEmail(email, username, attemptIps = []) {
    const ipList = attemptIps
      .slice(-5)
      .map((a) => `<li>${a.ip} at ${new Date(a.timestamp).toLocaleString()}</li>`)
      .join("");

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1b1b1b; color: #f1f1f1;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #fff; margin: 0;">Pain<span style="background-color: #a785eb; color: #292929; padding: 2px 6px; border-radius: 8px; margin-left: 4px;">Pal</span></h1>
        </div>
        
        <div style="background-color: #ff4444; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0;">⚠️ Security Alert</h2>
        </div>
        
        <p>Hello <strong>${username}</strong>,</p>
        
        <p>Your account has been <strong>locked</strong> due to multiple failed login attempts. This is a security measure to protect your account.</p>
        
        <h3 style="color: #a785eb;">Recent Failed Login Attempts:</h3>
        <ul style="background-color: #292929; padding: 15px 30px; border-radius: 8px;">
          ${ipList || "<li>No IP information available</li>"}
        </ul>
        
        <p><strong>What should you do?</strong></p>
        <ul>
          <li>If this was you, please reset your password using the forgot password feature</li>
          <li>If this wasn't you, someone may be trying to access your account</li>
          <li>Consider changing your password immediately</li>
        </ul>
        
        <p style="color: #888; font-size: 14px;">
          To unlock your account, please use the "Forgot Password" feature on the login page.
        </p>
        
        <hr style="border: none; border-top: 1px solid #333; margin: 30px 0;">
        
        <p style="color: #666; font-size: 12px; text-align: center;">
          This is an automated security notification from PainPal.
        </p>
      </div>
    `;

    return await this.sendEmail({
      to: email,
      subject: "🔒 Security Alert: Your PainPal Account Has Been Locked",
      html,
    });
  },

  /**
   * Send welcome email after signup
   * @param {string} email - User's email
   * @param {string} username - User's username
   */
  async sendWelcomeEmail(email, username) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1b1b1b; color: #f1f1f1;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #fff; margin: 0;">Pain<span style="background-color: #a785eb; color: #292929; padding: 2px 6px; border-radius: 8px; margin-left: 4px;">Pal</span></h1>
        </div>
        
        <h2 style="color: #a785eb;">Welcome to PainPal! 🎉</h2>
        
        <p>Hello <strong>${username}</strong>,</p>
        
        <p>Thank you for joining PainPal. We're excited to have you here!</p>
        
        <p>You can now:</p>
        <ul>
          <li>Share your thoughts and connect with others</li>
          <li>Add friends and start conversations</li>
          <li>Explore and engage with the community</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #a785eb; font-style: italic;">"Write your pain, share your journey"</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #333; margin: 30px 0;">
        
        <p style="color: #666; font-size: 12px; text-align: center;">
          Welcome to the PainPal community!
        </p>
      </div>
    `;

    return await this.sendEmail({
      to: email,
      subject: "Welcome to PainPal! 🎉",
      html,
    });
  },
};

module.exports = emailService;

