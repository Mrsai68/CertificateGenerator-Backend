import nodemailer from 'nodemailer';
import { InstitutionConstants } from '../config/institutionConfig.js';

const getSmtpCredentials = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER || 'sairaj0608@gmail.com';
  const pass = process.env.SMTP_PASS || 'clli szld hdie pnan';

  return { host, port, user, pass };
};

const createTransporter = () => {
  const { host, port, user, pass } = getSmtpCredentials();

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 5000,
    socketTimeout: 5000
  });
};

export const sendWelcomeEmail = async (toEmail, studentName, username) => {
  try {
    const { user } = getSmtpCredentials();
    const transporter = createTransporter();
    if (!transporter) return;

    const html = `<div style='font-family: Arial, sans-serif; padding: 20px; color: #1e293b;'>
      <h2 style='color: #2563eb;'>Welcome to ${InstitutionConstants.PORTAL_NAME}</h2>
      <p>Dear <strong>${studentName}</strong>,</p>
      <p>Your student profile has been registered successfully at ${InstitutionConstants.COLLEGE_NAME}!</p>
      <p><strong>Username:</strong> ${username}</p>
      <p>You can now log in to request digital Bonafide certificates and track approval status in real-time.</p>
      <br><p>Best Regards,<br>${InstitutionConstants.COLLEGE_NAME.toUpperCase()}</p>
    </div>`;

    await transporter.sendMail({
      from: `"${InstitutionConstants.COLLEGE_SHORT_NAME} Portal" <${user}>`,
      to: toEmail,
      subject: `Welcome to ${InstitutionConstants.PORTAL_NAME} | ${InstitutionConstants.COLLEGE_SHORT_NAME}`,
      html
    });
  } catch (error) {
    console.error(`Failed to send Welcome Email: ${error.message}`);
  }
};

export const sendPasswordResetOtpEmail = async (toEmail, otpCode) => {
  try {
    const { user } = getSmtpCredentials();
    const transporter = createTransporter();
    if (!transporter) return;

    const html = `<div style='font-family: Arial, sans-serif; padding: 20px; color: #1e293b;'>
      <h2 style='color: #2563eb;'>Password Reset Verification Code</h2>
      <p>Your 6-digit OTP code for password recovery is:</p>
      <div style='font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #1e40af; margin: 15px 0; padding: 10px; background: #e0effe; width: fit-content; border-radius: 8px;'>${otpCode}</div>
      <p>This code is valid for 15 minutes. If you did not request a password reset, please ignore this email.</p>
      <br><p>Best Regards,<br>${InstitutionConstants.PORTAL_NAME} | ${InstitutionConstants.COLLEGE_SHORT_NAME}</p>
    </div>`;

    await transporter.sendMail({
      from: `"${InstitutionConstants.COLLEGE_SHORT_NAME} Portal" <${user}>`,
      to: toEmail,
      subject: `Reset Password OTP Code - ${InstitutionConstants.PORTAL_NAME}`,
      html
    });
  } catch (error) {
    console.error(`Failed to send OTP Email: ${error.message}`);
  }
};

export const sendCertificateApprovalEmail = async (toEmail, studentName, purpose, certNo, pdfBuffer) => {
  try {
    const { user } = getSmtpCredentials();
    const transporter = createTransporter();
    if (!transporter) return;

    const html = `<div style='font-family: Arial, sans-serif; padding: 20px; color: #1e293b;'>
      <h2 style='color: #16a34a;'>Bonafide Certificate Approved!</h2>
      <p>Dear <strong>${studentName}</strong>,</p>
      <p>Your application for <strong>${purpose}</strong> Bonafide Certificate has been approved by the Head of Department.</p>
      <p><strong>Certificate Ref No:</strong> ${certNo}</p>
      <p>The official digital PDF with embedded anti-tamper QR code is attached to this email.</p>
      <br><p>Best Regards,<br>Academic Administration | ${InstitutionConstants.COLLEGE_NAME}</p>
    </div>`;

    await transporter.sendMail({
      from: `"${InstitutionConstants.COLLEGE_SHORT_NAME} Portal" <${user}>`,
      to: toEmail,
      subject: `APPROVED: Bonafide Certificate (${certNo})`,
      html,
      attachments: [
        {
          filename: `Bonafide_Certificate_${certNo}.pdf`,
          content: pdfBuffer
        }
      ]
    });
  } catch (error) {
    console.error(`Failed to send approval email: ${error.message}`);
  }
};

export const sendCertificateRejectionEmail = async (toEmail, studentName, purpose, remarks) => {
  try {
    const { user } = getSmtpCredentials();
    const transporter = createTransporter();
    if (!transporter) return;

    const html = `<div style='font-family: Arial, sans-serif; padding: 20px; color: #1e293b;'>
      <h2 style='color: #dc2626;'>Certificate Application Status Update</h2>
      <p>Dear <strong>${studentName}</strong>,</p>
      <p>Your application for <strong>${purpose}</strong> Bonafide Certificate was reviewed and was not approved.</p>
      <p><strong>Remarks / Reason:</strong> ${remarks}</p>
      <p>You may submit a fresh request with corrected details from your student portal.</p>
      <br><p>Best Regards,<br>Academic Administration | ${InstitutionConstants.COLLEGE_NAME}</p>
    </div>`;

    await transporter.sendMail({
      from: `"${InstitutionConstants.COLLEGE_SHORT_NAME} Portal" <${user}>`,
      to: toEmail,
      subject: `UPDATE: Bonafide Certificate Application Status`,
      html
    });
  } catch (error) {
    console.error(`Failed to send rejection email: ${error.message}`);
  }
};

export const sendAccountDeactivatedEmail = async (toEmail, username, reason) => {
  try {
    const { user } = getSmtpCredentials();
    const transporter = createTransporter();
    if (!transporter) return;

    const reasonHtml = reason && reason.trim() !== ''
      ? `<p style='background: #fef2f2; border-left: 4px solid #dc2626; padding: 10px; margin: 10px 0;'><strong>Reason for Deactivation:</strong> ${reason}</p>`
      : '';

    const html = `<div style='font-family: Arial, sans-serif; padding: 20px; color: #1e293b;'>
      <h2 style='color: #dc2626;'>Account Status Notice: Deactivated</h2>
      <p>Dear <strong>${username}</strong>,</p>
      <p>Your portal account (<strong>${username}</strong>) has been <strong>Deactivated</strong> by the Institutional Administration.</p>
      ${reasonHtml}
      <p>While your account is inactive, you will not be able to log in or submit certificate applications.</p>
      <p>If you believe this is an error or need your account restored, please contact your department Head of Department (HOD) or Administration.</p>
      <br><p>Best Regards,<br>Institutional Administration | ${InstitutionConstants.COLLEGE_NAME}</p>
    </div>`;

    await transporter.sendMail({
      from: `"${InstitutionConstants.COLLEGE_SHORT_NAME} Portal" <${user}>`,
      to: toEmail,
      subject: `NOTICE: Account Deactivated - ${InstitutionConstants.PORTAL_NAME}`,
      html
    });
  } catch (error) {
    console.error(`Failed to send deactivation email: ${error.message}`);
  }
};

export const sendAccountReactivatedEmail = async (toEmail, username) => {
  try {
    const { user } = getSmtpCredentials();
    const transporter = createTransporter();
    if (!transporter) return;

    const html = `<div style='font-family: Arial, sans-serif; padding: 20px; color: #1e293b;'>
      <h2 style='color: #16a34a;'>Account Reactivated!</h2>
      <p>Dear <strong>${username}</strong>,</p>
      <p>Your portal account (<strong>${username}</strong>) has been <strong>Reactivated</strong> and restored by Administration.</p>
      <p>You may now sign in with your credentials to submit certificate applications and access your dashboard.</p>
      <br><p>Best Regards,<br>Institutional Administration | ${InstitutionConstants.COLLEGE_NAME}</p>
    </div>`;

    await transporter.sendMail({
      from: `"${InstitutionConstants.COLLEGE_SHORT_NAME} Portal" <${user}>`,
      to: toEmail,
      subject: `NOTICE: Account Restored & Reactivated - ${InstitutionConstants.PORTAL_NAME}`,
      html
    });
  } catch (error) {
    console.error(`Failed to send reactivation email: ${error.message}`);
  }
};

export const sendAccountDeletedEmail = async (toEmail, username) => {
  try {
    const { user } = getSmtpCredentials();
    const transporter = createTransporter();
    if (!transporter) return;

    const html = `<div style='font-family: Arial, sans-serif; padding: 20px; color: #1e293b;'>
      <h2 style='color: #dc2626;'>Account Deleted Notice</h2>
      <p>Dear <strong>${username}</strong>,</p>
      <p>Your portal account (<strong>${username}</strong>) and associated student profile have been <strong>Permanently Deleted</strong> by Institutional Administration.</p>
      <p>If you believe this action was performed in error or need a new account created, please contact the Head of Department (HOD) or Administration office.</p>
      <br><p>Best Regards,<br>Institutional Administration | ${InstitutionConstants.COLLEGE_NAME}</p>
    </div>`;

    await transporter.sendMail({
      from: `"${InstitutionConstants.COLLEGE_SHORT_NAME} Portal" <${user}>`,
      to: toEmail,
      subject: `NOTICE: Account Deleted - ${InstitutionConstants.PORTAL_NAME}`,
      html
    });
  } catch (error) {
    console.error(`Failed to send deletion email: ${error.message}`);
  }
};
