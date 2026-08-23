const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Log configuration (without exposing full password)
  console.log('📧 Sending email with config:');
  console.log('  Host:', process.env.SMTP_HOST);
  console.log('  Port:', process.env.SMTP_PORT);
  console.log('  User:', process.env.SMTP_USER);
  console.log('  Pass:', process.env.SMTP_PASS ? '✅ Set' : '❌ MISSING');
  console.log('  From:', process.env.SMTP_FROM || '❌ MISSING (using user)');
  console.log('  To:', options.email);

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT == 465, // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // ✅ FORCE IPv4 – this is the critical fix
      family: 4,
      // ✅ Increase timeouts to avoid premature failures
      connectionTimeout: 30000, // 30 seconds
      socketTimeout: 30000,
      // Helps bypass some Gmail blocks on cloud servers
      tls: {
        rejectUnauthorized: false,
      },
    });

    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    const mailOptions = {
      from: from,
      to: options.email,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ NODEMAILER ERROR:', error);
    // Re-throw so the calling function can handle it
    throw error;
  }
};

module.exports = sendEmail;