"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEscalationEmail = exports.sendCheckInReminder = exports.sendRejectionEmail = exports.sendApprovalEmail = exports.sendSubmissionEmail = exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const APP_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.SYSTEM_ADMIN_EMAIL || 'admin@atomberg.com';
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525'),
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
    }
});
const SENDER = '"AtomQuest Portal" <no-reply@atomberg.com>';
const sendEmail = async (to, subject, html) => {
    try {
        const recipients = Array.isArray(to) ? to.join(', ') : to;
        await transporter.sendMail({
            from: SENDER,
            to: recipients,
            subject,
            html
        });
        console.log(`Email captured in sandbox for [${recipients}]: ${subject}`);
    }
    catch (error) {
        console.error('Failed to dispatch email to sandbox:', error);
    }
};
exports.sendEmail = sendEmail;
const sendSubmissionEmail = async (managerEmail, employeeEmail, employeeName) => {
    const subject = `Goal Submission: ${employeeName} has submitted goals for review`;
    const html = `
    <div style="font-family: sans-serif; line-height: 1.5; color: #141b2b;">
      <h2>Strategic Goal Submission</h2>
      <p>Hello,</p>
      <p><strong>${employeeName}</strong> has submitted their goal sheet for the current cycle for precision review.</p>
      <p style="font-size: 12px; color: #575e70;">This notification has been sent to the Manager, Employee, and System Admin.</p>
      <div style="margin: 30px 0;">
        <a href="${APP_URL}/dashboard/review" style="background: #ffd700; color: #141b2b; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px;">Go to Review Portal</a>
      </div>
      <p>Please log in to the AtomQuest portal to approve or return the sheet for rework.</p>
    </div>
  `;
    await (0, exports.sendEmail)([managerEmail, employeeEmail, ADMIN_EMAIL], subject, html);
};
exports.sendSubmissionEmail = sendSubmissionEmail;
const sendApprovalEmail = async (employeeEmail, managerEmail, employeeName) => {
    const subject = `Goal Approved: Strategic roadmap locked for ${employeeName}`;
    const html = `
    <div style="font-family: sans-serif; line-height: 1.5; color: #141b2b;">
      <h2>Strategy Approved</h2>
      <p>Hello,</p>
      <p>The goal sheet for <strong>${employeeName}</strong> has been successfully reviewed and <strong>APPROVED</strong>.</p>
      <p>The objectives are now locked for the current cycle. Quarterly achievement logging is now active.</p>
      <p style="font-size: 12px; color: #575e70;">This notification has been sent to the Manager, Employee, and System Admin.</p>
      <div style="margin: 30px 0;">
        <a href="${APP_URL}/dashboard" style="background: #ffd700; color: #141b2b; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px;">View Your Dashboard</a>
      </div>
    </div>
  `;
    await (0, exports.sendEmail)([employeeEmail, managerEmail, ADMIN_EMAIL], subject, html);
};
exports.sendApprovalEmail = sendApprovalEmail;
const sendRejectionEmail = async (employeeEmail, managerEmail, employeeName, revisionComment) => {
    const subject = `Action Required: Revision needed for ${employeeName}'s Goal Sheet`;
    const html = `
    <div style="font-family: sans-serif; line-height: 1.5; color: #141b2b;">
      <h2>Revision Required</h2>
      <p>Hello,</p>
      <p>The goal sheet for <strong>${employeeName}</strong> has been returned for rework with the following feedback:</p>
      <blockquote style="background: #f3f4f6; padding: 15px; border-left: 5px solid #ffd700; margin: 20px 0;">
        ${revisionComment}
      </blockquote>
      <p style="font-size: 12px; color: #575e70;">This notification has been sent to the Manager, Employee, and System Admin.</p>
      <div style="margin: 30px 0;">
        <a href="${APP_URL}/dashboard/builder" style="background: #ffd700; color: #141b2b; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px;">Update Goals</a>
      </div>
    </div>
  `;
    await (0, exports.sendEmail)([employeeEmail, managerEmail, ADMIN_EMAIL], subject, html);
};
exports.sendRejectionEmail = sendRejectionEmail;
const sendCheckInReminder = async (employeeEmail, employeeName, quarter) => {
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
    await (0, exports.sendEmail)(employeeEmail, subject, html);
};
exports.sendCheckInReminder = sendCheckInReminder;
const sendEscalationEmail = async (targetEmail, subject, employeeName, taskType, delayDays, level) => {
    const html = `
    <div style="font-family: sans-serif; line-height: 1.5; color: #141b2b;">
      <h2 style="color: #ba1a1a;">Escalation Alert: Level ${level}</h2>
      <p>This is a formal system escalation regarding the strategic objective lifecycle for <strong>${employeeName}</strong>.</p>
      <div style="background: #fff4f4; padding: 20px; border-radius: 12px; border: 1px solid #ffdad6; margin: 20px 0;">
        <p style="margin: 0;"><strong>Task Type:</strong> ${taskType}</p>
        <p style="margin: 5px 0;"><strong>Current Delay:</strong> ${delayDays} Days</p>
        <p style="margin: 0;"><strong>Escalation Level:</strong> ${level}</p>
      </div>
      <p>Immediate action is required to resolve this bottleneck and maintain organizational strategic alignment.</p>
      <div style="margin: 30px 0;">
        <a href="${APP_URL}/dashboard" style="background: #141b2b; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px;">Access Command Center</a>
      </div>
    </div>
  `;
    await (0, exports.sendEmail)(targetEmail, subject, html);
};
exports.sendEscalationEmail = sendEscalationEmail;
