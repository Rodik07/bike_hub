import nodemailer from 'nodemailer';

// Create transporter (configure based on your email service)
const createTransporter = () => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    return null; // Return null if credentials are not configured
  }

  // For development, you can use Gmail or other services
  // For production, use a proper email service like SendGrid, AWS SES, etc.

  // Gmail configuration (requires app password)
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD // App password, not regular password
      }
    });
  }

  // SMTP configuration (for other email services)
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

export const sendDealerWelcomeEmail = async (email, name, temporaryPassword, dealerName) => {
  try {
    const transporter = createTransporter();

    // If transporter is null, email is not configured
    if (!transporter) {
      console.warn('⚠️ Email service not configured. Skipping email send.');
      console.log(`📧 Would send welcome email to ${email} with temporary password: ${temporaryPassword}`);
      return false;
    }

    const mailOptions = {
      from: `"BikeHub" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to BikeHub - Your Dealer Account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .password-box { background: white; border: 2px solid #dc2626; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; }
            .password { font-size: 24px; font-weight: bold; color: #dc2626; letter-spacing: 2px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏍️ Welcome to BikeHub!</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Your dealer account has been created for <strong>${dealerName}</strong>.</p>
              
              <p>You can now access your dealer dashboard to manage bikes, bookings, and more.</p>
              
              <div class="password-box">
                <p style="margin: 0 0 10px 0; font-weight: bold;">Your Temporary Password:</p>
                <div class="password">${temporaryPassword}</div>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important:</strong> You must change this password within 3 days of first login. 
                Your account will be locked if you don't change it in time.
              </div>
              
              <p><strong>Login Details:</strong></p>
              <ul>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Temporary Password:</strong> ${temporaryPassword}</li>
              </ul>
              
              <p style="text-align: center;">
                <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/login" class="button">Login to Dashboard</a>
              </p>
              
              <p>If you have any questions, please contact our support team.</p>
              
              <div class="footer">
                <p>This is an automated email. Please do not reply.</p>
                <p>&copy; ${new Date().getFullYear()} BikeHub. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    // Don't throw error - email failure shouldn't break dealer creation
    return false;
  }
};

export const sendPasswordChangeReminder = async (email, name, daysRemaining) => {
  try {
    const transporter = createTransporter();

    // If transporter is null, email is not configured
    if (!transporter) {
      console.warn('⚠️ Email service not configured. Skipping reminder email.');
      return false;
    }

    const mailOptions = {
      from: `"BikeHub" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `⚠️ Action Required: Change Your Password (${daysRemaining} days remaining)`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Password Change Reminder</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>This is a reminder that you need to change your temporary password.</p>
              
              <div class="warning">
                <strong>You have ${daysRemaining} day(s) remaining</strong> to change your password. 
                Your account will be locked if you don't change it in time.
              </div>
              
              <p style="text-align: center;">
                <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/login" class="button">Change Password Now</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending reminder email:', error);
    return false;
  }
};

export const sendPasswordResetEmail = async (email, name, resetUrl) => {
  try {
    const transporter = createTransporter();

    // If transporter is null, email is not configured
    if (!transporter) {
      console.warn('⚠️ Email service not configured. Skipping password reset email.');
      console.log(`📧 Would send password reset email to ${email} with reset URL: ${resetUrl}`);
      return false;
    }

    const mailOptions = {
      from: `"BikeHub" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Reset Your BikeHub Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>We received a request to reset your password for your BikeHub account.</p>
              
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #6b7280; font-size: 12px;">${resetUrl}</p>
              
              <div class="warning">
                <strong>⚠️ Important:</strong> This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.
              </div>
              
              <p>If you have any questions, please contact our support team.</p>
              
              <div class="footer">
                <p>This is an automated email. Please do not reply.</p>
                <p>&copy; ${new Date().getFullYear()} BikeHub. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    return false;
  }
};

export const sendOTPEmail = async (email, name, otpCode) => {
  try {
    const transporter = createTransporter();

    // If transporter is null, email is not configured
    if (!transporter) {
      console.warn('⚠️ Email service not configured. Skipping OTP email.');
      console.log(`📧 Would send OTP email to ${email} with OTP: ${otpCode}`);
      return false;
    }

    const mailOptions = {
      from: `"BikeHub Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔒 Your BikeHub Login Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 3px solid #dc2626; padding: 20px; border-radius: 10px; text-align: center; margin: 25px 0; }
            .otp-code { font-size: 36px; font-weight: bold; color: #dc2626; letter-spacing: 8px; font-family: 'Courier New', monospace; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .security-tip { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
            .timer { color: #ea580c; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Login Verification</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Someone is trying to sign in to your BikeHub account. To complete the login, please use the verification code below:</p>
              
              <div class="otp-box">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">Your Verification Code</p>
                <div class="otp-code">${otpCode}</div>
              </div>
              
              <div class="warning">
                <strong>⏱️ Expires in 3 minutes:</strong> This code will expire <span class="timer">3 minutes</span> from now for your security.
              </div>
              
              <div class="security-tip">
                <strong>🛡️ Security Tips:</strong>
                <ul style="margin: 10px 0;">
                  <li>Never share this code with anyone</li>
                  <li>BikeHub will never ask for this code via phone or email</li>
                  <li>If you didn't attempt to login, please ignore this email and consider changing your password</li>
                </ul>
              </div>
              
              <p>If you didn't request this code, someone may be trying to access your account. Please secure your account immediately.</p>
              
              <div class="footer">
                <p>This is an automated security email. Please do not reply.</p>
                <p>&copy; ${new Date().getFullYear()} BikeHub. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    return false;
  }
};
