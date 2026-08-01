import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.digitalplat.org',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export class EmailService {
  static async sendEmail(options: EmailOptions): Promise<void> {
    const mailOptions = {
      from: process.env.EMAIL_FROM || `EXYO <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html
    };

    await transporter.sendMail(mailOptions);
  }

  static async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.CORS_ORIGIN || 'https://exyo.qd.je'}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #141414; color: #ffffff; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 8px; padding: 40px; }
          .logo { color: #E50914; font-size: 32px; font-weight: bold; text-align: center; margin-bottom: 30px; }
          h1 { font-size: 24px; margin-bottom: 20px; }
          p { color: #B3B3B3; line-height: 1.6; margin-bottom: 20px; }
          .button { display: inline-block; background-color: #E50914; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 20px 0; }
          .footer { color: #666; font-size: 12px; margin-top: 30px; text-align: center; }
          .link { color: #B3B3B3; word-break: break-all; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">EXYO</div>
          <h1>Reset Your Password</h1>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p>Or copy and paste this link into your browser:</p>
          <p class="link">${resetUrl}</p>
          <p>This link will expire in 1 hour for security purposes.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <div class="footer">
            <p>© ${new Date().getFullYear()} EXYO. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'EXYO - Reset Your Password',
      html
    });
  }

  static async sendWelcomeEmail(email: string, username: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #141414; color: #ffffff; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 8px; padding: 40px; }
          .logo { color: #E50914; font-size: 32px; font-weight: bold; text-align: center; margin-bottom: 30px; }
          h1 { font-size: 24px; margin-bottom: 20px; }
          p { color: #B3B3B3; line-height: 1.6; margin-bottom: 20px; }
          .button { display: inline-block; background-color: #E50914; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 20px 0; }
          .footer { color: #666; font-size: 12px; margin-top: 30px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">EXYO</div>
          <h1>Welcome to EXYO, ${username}!</h1>
          <p>Thank you for joining EXYO - your personal streaming platform.</p>
          <p>With EXYO, you can:</p>
          <ul style="color: #B3B3B3;">
            <li>Stream movies, TV shows, and documentaries</li>
            <li>Create your personal watchlist</li>
            <li>Track your viewing history</li>
            <li>Discover new content with personalized recommendations</li>
          </ul>
          <a href="${process.env.CORS_ORIGIN || 'https://exyo.qd.je'}" class="button">Start Watching</a>
          <div class="footer">
            <p>© ${new Date().getFullYear()} EXYO. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Welcome to EXYO!',
      html
    });
  }
}
