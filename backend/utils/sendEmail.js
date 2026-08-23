const nodemailer = require('nodemailer');
const dns = require('dns');

const sendEmail = async (options) => {
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
      // ✅ FORCE IPv4 – custom lookup function
      lookup: (hostname, callback) => {
        dns.lookup(hostname, { family: 4 }, (err, address) => {
          if (err) {
            console.error('❌ DNS lookup failed:', err);
            return callback(err);
          }
          console.log(`✅ Resolved ${hostname} -> IPv4: ${address}`);
          callback(null, address, 4);
        });
      },
      // Increase timeouts for Render's network
      connectionTimeout: 30000,
      socketTimeout: 30000,
      // Bypass SSL certificate issues (if any)
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