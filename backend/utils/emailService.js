// backend/utils/emailService.js
const axios = require('axios');

const sendEmail = async (options) => {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      throw new Error('BREVO_API_KEY is missing in environment variables');
    }

    const senderEmail = process.env.SMTP_FROM || 'webathub@gmail.com';
    const senderName = 'WeBA-Hub';

    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [{ email: options.email }],
        subject: options.subject,
        htmlContent: options.html,
      },
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
    console.error('❌ Brevo API Error:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = sendEmail;