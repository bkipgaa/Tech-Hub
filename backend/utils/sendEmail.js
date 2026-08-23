const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Log the exact configuration being used (hide password partially)
  console.log('📧 Sending email with config:');
  console.log('  - Host:', process.env.SMTP_HOST);
  console.log('  - Port:', process.env.SMTP_PORT);
  console.log('  - User:', process.env.SMTP_USER);
  console.log('  - Pass:', process.env.SMTP_PASS ? '✅ Set' : '❌ MISSING');
  console.log('  - From:', process.env.SMTP_FROM || '❌ MISSING');
  console.log('  - To:', options.email);

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, // false for 587, true for 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // ⚠️ This often fixes Gmail blocks on cloud servers
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Ensure 'from' falls back to the user if SMTP_FROM is missing
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
    // Log the FULL error stack so Render shows it
    console.error('❌ NODEMAILER ERROR DETAILS:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error command:', error.command);
    console.error('❌ Error response:', error.response);
    throw error; // Re-throw so the authController catches it
  }
};

module.exports = sendEmail;