/**
 * sendWhatsApp.js
 * ===============
 * Sends WhatsApp template messages via Meta's WhatsApp Cloud API.
 *
 * Messages a business starts must use a template approved in WhatsApp Manager,
 * so each call names a template and fills its {{1}}, {{2}}… body values.
 *
 * Env:
 *   WHATSAPP_TOKEN            - permanent access token (System User)
 *   WHATSAPP_PHONE_NUMBER_ID  - the sending number's ID from WhatsApp Manager
 *   WHATSAPP_API_VERSION      - optional, defaults to v21.0
 *
 * Used by services/notificationService.js
 */

const axios = require('axios');

/**
 * Turn a Kenyan phone number into the international form WhatsApp wants.
 * 0712 345 678 / +254712345678 / 254712345678 / 712345678 → 254712345678
 * Returns null when the number can't be read.
 */
const toWhatsAppNumber = (phone) => {
  if (!phone) return null;
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `254${digits.slice(1)}`;
  else if (/^[17]\d{8}$/.test(digits)) digits = `254${digits}`;
  return /^\d{10,15}$/.test(digits) ? digits : null;
};

/** True when the WhatsApp keys are set, so callers can skip quietly otherwise */
const isConfigured = () => !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);

/**
 * Send a template message.
 *
 * @param {Object} options
 * @param {string} options.phone     - Recipient phone (any Kenyan format)
 * @param {string} options.template  - Approved template name
 * @param {string[]} [options.params] - Body values, in {{1}}, {{2}}… order
 * @param {string} [options.language] - Template language code (default 'en')
 * @returns {Promise<Object>} Cloud API response
 */
const sendWhatsApp = async ({ phone, template, params = [], language = 'en' }) => {
  if (!isConfigured()) {
    throw new Error('WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID is missing in environment variables');
  }

  const to = toWhatsAppNumber(phone);
  if (!to) throw new Error(`Invalid phone number for WhatsApp: ${phone}`);
  if (!template) throw new Error('WhatsApp template name is required');

  const version = process.env.WHATSAPP_API_VERSION || 'v21.0';
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: template,
      language: { code: language },
      components: params.length
        ? [{
            type: 'body',
            // WhatsApp rejects empty values and new lines inside a parameter
            parameters: params.map((p) => ({
              type: 'text',
              text: String(p ?? '').replace(/\s+/g, ' ').trim() || '-',
            })),
          }]
        : [],
    },
  };

  try {
    const response = await axios.post(
      `https://graph.facebook.com/${version}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        },
        timeout: 30000,
      }
    );
    console.log(`✅ WhatsApp sent (${template}) to ${to}:`, response.data?.messages?.[0]?.id);
    return response.data;
  } catch (error) {
    const apiError = error.response?.data?.error;
    console.error('❌ WhatsApp API Error:', apiError || error.message);
    const err = new Error(apiError?.message || error.message || 'Failed to send WhatsApp message');
    err.code = apiError?.code || error.code;
    throw err;
  }
};

module.exports = sendWhatsApp;
module.exports.toWhatsAppNumber = toWhatsAppNumber;
module.exports.isConfigured = isConfigured;
