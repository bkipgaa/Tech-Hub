const nodemailer = require('nodemailer');
const dns = require('dns');

const sendEmail = async (options) => {
  console.log('📧 Sending email via Brevo:');
  console.log('  Host:', process.env.SMTP_HOST);
  console.log('  Port:', process.env.SMTP_PORT);
  console.log('  User:', process.env.SMTP_USER);
  console.log('  To:', options.email);

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // ✅ Force IPv4 lookup
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
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 30000,
      socketTimeout: 30000,
    });

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