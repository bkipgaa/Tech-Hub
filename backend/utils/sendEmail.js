const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  console.log('📧 Sending email via Brevo:');
  console.log('  Host:', process.env.SMTP_HOST);
  console.log('  Port:', process.env.SMTP_PORT);
  console.log('  User:', process.env.SMTP_USER);
  console.log('  To:', options.email);

  try {
    // Use port 465 with secure: true for SSL
    const isSecure = process.env.SMTP_PORT == 465;
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: isSecure, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 30000,
      socketTimeout: 30000,
    });

    // ✅ Verify connection before sending (helps catch auth/network issues early)
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully.');

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: options.email,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ NODEMAILER ERROR:', error);
    throw error;
  }
};

module.exports = sendEmail;