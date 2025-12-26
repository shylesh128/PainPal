/**
 * @fileoverview Email configuration using Nodemailer with Gmail
 * @module config/email
 */

const nodemailer = require('nodemailer');

/**
 * Create reusable transporter object using Gmail SMTP
 * @type {nodemailer.Transporter}
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

/**
 * Email templates configuration
 */
const emailTemplates = {
  /**
   * Verification email template
   * @param {string} name - User's name
   * @param {string} verificationUrl - URL to verify email
   * @returns {Object} Email content
   */
  verification: (name, verificationUrl) => ({
    subject: 'Welcome to PainPal - Verify Your Email',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #2a2a2a; color: #f1f1f1; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #1c1c1c; border-radius: 12px; padding: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 32px; color: #a785eb; font-weight: bold; }
          .content { line-height: 1.6; }
          .button { display: inline-block; background-color: #a785eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #575757; font-size: 12px; color: #999; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🩹 PainPal</div>
          </div>
          <div class="content">
            <h2>Welcome, ${name}!</h2>
            <p>Thank you for joining PainPal - a safe space where you can share your thoughts and find support.</p>
            <p>Please verify your email address to get started:</p>
            <center>
              <a href="${verificationUrl}" class="button">Verify Email</a>
            </center>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create this account, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} PainPal. All rights reserved.</p>
            <p>You're receiving this because you signed up for PainPal.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Welcome to PainPal, ${name}! Please verify your email by visiting: ${verificationUrl}`,
  }),

  /**
   * Password reset email template
   * @param {string} name - User's name
   * @param {string} resetUrl - URL to reset password
   * @returns {Object} Email content
   */
  passwordReset: (name, resetUrl) => ({
    subject: 'PainPal - Reset Your Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #2a2a2a; color: #f1f1f1; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #1c1c1c; border-radius: 12px; padding: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 32px; color: #a785eb; font-weight: bold; }
          .content { line-height: 1.6; }
          .button { display: inline-block; background-color: #a785eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
          .warning { background-color: #3d2a2a; border-left: 4px solid #e74c3c; padding: 12px; margin: 20px 0; border-radius: 4px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #575757; font-size: 12px; color: #999; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🩹 PainPal</div>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hi ${name},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <center>
              <a href="${resetUrl}" class="button">Reset Password</a>
            </center>
            <p>This link will expire in 1 hour.</p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} PainPal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${name}, You requested to reset your password. Visit this link to reset it: ${resetUrl}. This link expires in 1 hour.`,
  }),

  /**
   * Password changed notification template
   * @param {string} name - User's name
   * @returns {Object} Email content
   */
  passwordChanged: (name) => ({
    subject: 'PainPal - Password Changed Successfully',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #2a2a2a; color: #f1f1f1; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #1c1c1c; border-radius: 12px; padding: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 32px; color: #a785eb; font-weight: bold; }
          .content { line-height: 1.6; }
          .success { background-color: #2a3d2a; border-left: 4px solid #27ae60; padding: 12px; margin: 20px 0; border-radius: 4px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #575757; font-size: 12px; color: #999; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🩹 PainPal</div>
          </div>
          <div class="content">
            <h2>Password Changed</h2>
            <p>Hi ${name},</p>
            <div class="success">
              <strong>✅ Success:</strong> Your password has been changed successfully.
            </div>
            <p>If you made this change, no further action is needed.</p>
            <p>If you didn't change your password, please contact our support immediately to secure your account.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} PainPal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${name}, Your password has been changed successfully. If you didn't make this change, please contact support immediately.`,
  }),

  /**
   * Welcome email after verification
   * @param {string} name - User's name
   * @returns {Object} Email content
   */
  welcome: (name) => ({
    subject: 'Welcome to PainPal! 🩹',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #2a2a2a; color: #f1f1f1; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #1c1c1c; border-radius: 12px; padding: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 32px; color: #a785eb; font-weight: bold; }
          .content { line-height: 1.6; }
          .feature { background-color: #2a2a3d; padding: 15px; margin: 10px 0; border-radius: 8px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #575757; font-size: 12px; color: #999; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🩹 PainPal</div>
          </div>
          <div class="content">
            <h2>You're all set, ${name}! 🎉</h2>
            <p>Your email has been verified. Welcome to our community!</p>
            <p>Here's what you can do on PainPal:</p>
            <div class="feature">💭 <strong>Share Your Thoughts</strong> - Post what's on your mind</div>
            <div class="feature">🤝 <strong>Connect</strong> - Find others who understand</div>
            <div class="feature">💬 <strong>Join Servers</strong> - Engage in topic-based communities</div>
            <div class="feature">🔒 <strong>Stay Anonymous</strong> - Share freely with privacy controls</div>
            <p>Remember: You're not alone. We're here for you.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} PainPal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Welcome to PainPal, ${name}! Your email has been verified. Start connecting with our community today.`,
  }),
};

module.exports = {
  createTransporter,
  emailTemplates,
};

