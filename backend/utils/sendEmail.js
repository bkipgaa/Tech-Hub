/**
 * sendEmail.js
 * ============
 * Sends transactional emails via Brevo's HTTP API.
 * 
 * Why HTTP API instead of SMTP?
 *   - Render's free tier blocks outbound SMTP ports (25/465/587)
 *   - Brevo's HTTP API runs over HTTPS (port 443), which is never blocked
 *   - Faster than SMTP: no handshake, no connection keep-alive needed
 * 
 * Used by services/notificationService.js
 * 
 * @version 2.0.0 – Switched from Nodemailer/SMTP to Brevo HTTP API
 */

const axios = require('axios');

/**
 * Send an email via Brevo.
 * 
 * @param {Object} options
 * @param {string} options.email    - Recipient email address
 * @param {string} options.subject  - Email subject
 * @param {string} options.html     - HTML content
 * @param {string} [options.text]   - Optional plain-text fallback
 * @param {string} [options.from]   - Override sender email
 * @param {string} [options.fromName] - Override sender name
 * @returns {Promise<Object>} Brevo API response
 */
const sendEmail = async (options) => {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      throw new Error('BREVO_API_KEY is missing in environment variables');
    }

    if (!options?.email) {
      throw new Error('Recipient email (options.email) is required');
    }

    const senderEmail = options.from || process.env.SMTP_FROM || 'webathub@gmail.com';
    const senderName  = options.fromName || 'WeBA-Hub';

    console.log('📧 Sending email via Brevo HTTP API:');
    console.log('  From:', `${senderName} <${senderEmail}>`);
    console.log('  To:  ', options.email);
    console.log('  Subj:', options.subject);

    const payload = {
      sender: { name: senderName, email: senderEmail },
      to: [{ email: options.email }],
      subject: options.subject,
      htmlContent: options.html,
    };

    // Optional plain-text fallback
    if (options.text) payload.textContent = options.text;

    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        timeout: 30000,
      }
    );

    console.log('✅ Email sent successfully via Brevo API:', response.data.messageId);
    return response.data;
  } catch (error) {
    // Brevo returns detailed error info in response.data — log it all
    const brevoError = error.response?.data;
    console.error('❌ Brevo API Error:', brevoError || error.message);

    // Re-throw with useful context so the caller (notificationService) can log it
    const err = new Error(
      brevoError?.message || error.message || 'Failed to send email'
    );
    err.code = brevoError?.code || error.code;
    err.brevoResponse = brevoError;
    throw err;
  }
};

module.exports = sendEmail;