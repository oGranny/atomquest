import nodemailer from 'nodemailer';
import { MailtrapTransport } from 'mailtrap';

const APP_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Initialize Transporter
let transporter: any;

if (process.env.MAILTRAP_TOKEN) {
    // Official Mailtrap API Method (Production)
    transporter = nodemailer.createTransport(
        MailtrapTransport({
            token: process.env.MAILTRAP_TOKEN,
        })
    );
} else {
    // Standard SMTP Method (Development/Sandbox)
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
        port: parseInt(process.env.SMTP_PORT || '2525'),
        auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || ''
        }
    });
}

const SENDER = {
    address: "no-reply@demomailtrap.co", // Mailtrap's demo sender or your verified domain
    name: "AtomQuest Portal",
};

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    await transporter.sendMail({
      from: SENDER,
      to: [to], // Mailtrap API expects an array or single string
      subject,
      html,
      category: "Strategic Objective Update",
    });
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
};

export const sendSubmissionEmail = async (managerEmail: string, employeeName: string, sheetId: string) => {
  const subject = `Goal Submission: ${employeeName} has submitted goals for review`;
  const html = `
    <div style="font-family: sans-serif; line-height: 1.5; color: #141b2b;">
      <h2>Strategic Goal Submission</h2>
      <p>Hello,</p>
      <p><strong>${employeeName}</strong> has submitted their goal sheet for the current cycle for your precision review.</p>
      <div style="margin: 30px 0;">
        <a href="${APP_URL}/dashboard/review" style="background: #ffd700; color: #141b2b; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px;">Go to Review Portal</a>
      </div>
      <p>Please log in to the AtomQuest portal to approve or return the sheet for rework.</p>
    </div>
  `;
  await sendEmail(managerEmail, subject, html);
};

export const sendApprovalEmail = async (employeeEmail: string, employeeName: string) => {
  const subject = `Goal Approved: Your strategic roadmap is locked`;
  const html = `
    <div style="font-family: sans-serif; line-height: 1.5; color: #141b2b;">
      <h2>Strategy Approved</h2>
      <p>Hello ${employeeName},</p>
      <p>Your goal sheet has been successfully reviewed and <strong>APPROVED</strong> by your manager.</p>
      <p>Your objectives are now locked for the current cycle. You can now begin logging your quarterly achievements.</p>
      <div style="margin: 30px 0;">
        <a href="${APP_URL}/dashboard" style="background: #ffd700; color: #141b2b; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px;">View Your Dashboard</a>
      </div>
    </div>
  `;
  await sendEmail(employeeEmail, subject, html);
};

export const sendRejectionEmail = async (employeeEmail: string, employeeName: string, revisionComment: string) => {
  const subject = `Action Required: Revision needed for your Goal Sheet`;
  const html = `
    <div style="font-family: sans-serif; line-height: 1.5; color: #141b2b;">
      <h2>Revision Required</h2>
      <p>Hello ${employeeName},</p>
      <p>Your goal sheet has been returned for rework by your manager with the following feedback:</p>
      <blockquote style="background: #f3f4f6; padding: 15px; border-left: 5px solid #ffd700; margin: 20px 0;">
        ${revisionComment}
      </blockquote>
      <div style="margin: 30px 0;">
        <a href="${APP_URL}/dashboard/builder" style="background: #ffd700; color: #141b2b; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px;">Update Goals</a>
      </div>
    </div>
  `;
  await sendEmail(employeeEmail, subject, html);
};

export const sendCheckInReminder = async (employeeEmail: string, employeeName: string, quarter: string) => {
  const subject = `Reminder: Quarterly Check-in window is open (${quarter})`;
  const html = `
    <div style="font-family: sans-serif; line-height: 1.5; color: #141b2b;">
      <h2>Quarterly Progress Tracking Reminder</h2>
      <p>Hello ${employeeName},</p>
      <p>This is an automated reminder to log your actual achievements for <strong>${quarter}</strong> against your strategic targets.</p>
      <p>Please ensure all progress and notes are updated for review.</p>
      <div style="margin: 30px 0;">
        <a href="${APP_URL}/dashboard" style="background: #ffd700; color: #141b2b; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px;">Open Tracking Console</a>
      </div>
    </div>
  `;
  await sendEmail(employeeEmail, subject, html);
};
