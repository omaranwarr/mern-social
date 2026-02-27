import nodemailer from 'nodemailer'
import config from '../../config/config'

/**
 * Create transporter. Uses SMTP from env, or Ethereal for development if not set.
 */
async function getTransporter() {
  if (config.smtpHost && config.smtpUser) {
    return nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort || 587,
      secure: config.smtpSecure === 'true',
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass
      }
    })
  }
  // Development: create a test account at ethereal.email
  const testAccount = await nodemailer.createTestAccount()
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  })
}

/**
 * Send verification code to email.
 * @param {string} to - Recipient email
 * @param {string} code - 6-digit verification code
 * @returns {{ success: boolean, messageId?: string, previewUrl?: string }}
 */
export async function sendVerificationEmail(to, code) {
  try {
    const transporter = await getTransporter()
    const info = await transporter.sendMail({
      from: config.smtpFrom || '"MERN Social" <noreply@mernsocial.com>',
      to,
      subject: 'Your verification code - MERN Social',
      text: `Your verification code is: ${code}. It expires in 10 minutes.`,
      html: `
        <p>Your verification code is: <strong>${code}</strong></p>
        <p>It expires in 10 minutes.</p>
        <p>If you didn't request this, you can ignore this email.</p>
      `
    })
    const previewUrl = nodemailer.getTestMessageUrl && nodemailer.getTestMessageUrl(info)
    if (previewUrl) {
      console.log('Ethereal preview URL (dev):', previewUrl)
    }
    return { success: true, messageId: info.messageId, previewUrl: previewUrl || null }
  } catch (err) {
    console.error('Send verification email error:', err)
    return { success: false }
  }
}
