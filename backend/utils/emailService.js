const SibApiV3Sdk = require('@getbrevo/brevo');

// Initialize the API client
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// Set your API key (from environment variables)
apiInstance.setApiKey(
  SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

const sendEmail = async (options) => {
  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = options.subject;
    sendSmtpEmail.htmlContent = options.html;
    sendSmtpEmail.sender = { 
      name: 'WeBA-Hub', 
      email: process.env.SMTP_FROM || 'webathub@gmail.com' 
    };
    sendSmtpEmail.to = [{ email: options.email }];

    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Email sent successfully via Brevo API:', response);
    return response;
  } catch (error) {
    console.error('❌ Brevo API Error:', error);
    throw error;
  }
};

module.exports = sendEmail;