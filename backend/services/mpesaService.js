// services/mpesaService.js
const axios = require('axios');

/**
 * Determine the base URL based on environment.
 *   sandbox    → https://sandbox.safaricom.co.ke
 *   production → https://api.safaricom.co.ke
 */
const getBaseUrl = () => {
  const env = (process.env.MPESA_ENV || 'sandbox').toLowerCase();
  return env === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';
};

/**
 * Build the Daraja callback URL safely.
 * 
 * Requirements:
 *   - HTTPS in production (sandbox also accepts HTTPS)
 *   - No trailing slash
 *   - No query string
 *   - Publicly reachable
 * 
 * Resolution order:
 *   1. Explicit override argument
 *   2. MPESA_CALLBACK_URL env var
 *   3. BACKEND_URL + default path
 */
const buildCallbackUrl = (overridePath) => {
  // 1. Explicit full URL
  if (overridePath && /^https?:\/\//i.test(overridePath)) {
    return overridePath.replace(/\/+$/, ''); // strip trailing slashes
  }

  // 2. Env var
  if (process.env.MPESA_CALLBACK_URL) {
    const url = process.env.MPESA_CALLBACK_URL.trim().replace(/\/+$/, '');
    return url;
  }

  // 3. BACKEND_URL + default path
  const backend = (process.env.BACKEND_URL || '').trim().replace(/\/+$/, '');
  if (!backend) {
    throw new Error(
      'MPESA_CALLBACK_URL or BACKEND_URL must be set in environment variables.'
    );
  }

  const path = overridePath || '/api/subscription/mpesa-callback';
  return `${backend}${path}`;
};

/**
 * Validate that the URL is acceptable to Safaricom BEFORE sending.
 */
const validateCallbackUrl = (url) => {
  if (!url || typeof url !== 'string') {
    throw new Error(`Invalid callback URL: "${url}"`);
  }
  if (!url.startsWith('https://')) {
    throw new Error(
      `Callback URL must use HTTPS. Got: "${url}". ` +
      `Set MPESA_CALLBACK_URL or BACKEND_URL with https:// scheme.`
    );
  }
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    throw new Error(
      `Callback URL cannot be localhost. Got: "${url}". ` +
      `Safaricom needs a publicly reachable URL.`
    );
  }
  if (url.includes('?')) {
    throw new Error(
      `Callback URL must not contain query strings. Got: "${url}".`
    );
  }
};

/**
 * Get OAuth access token from Safaricom.
 */
const getAccessToken = async () => {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');

  try {
    const response = await axios.get(
      `${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
      { headers: { Authorization: `Basic ${auth}` } }
    );
    return response.data.access_token;
  } catch (error) {
    console.error(
      'M-Pesa access token error:',
      error.response?.data || error.message
    );
    throw new Error('Failed to get M-Pesa access token');
  }
};

/**
 * Build a timestamp in the YYYYMMDDHHmmss format Safaricom expects.
 */
const buildTimestamp = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    now.getFullYear() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
};

/**
 * Initiate STK Push (Lipa Na M-Pesa Online).
 *
 * @param {string} phoneNumber       - 2547XXXXXXXX
 * @param {number} amount            - KES amount (integer)
 * @param {string} accountReference  - max 12 chars (truncated automatically)
 * @param {string} transactionDesc   - max 13 chars (truncated automatically)
 * @param {string} [callbackPath]    - optional override path or full URL
 */
const stkPush = async (
  phoneNumber,
  amount,
  accountReference,
  transactionDesc,
  callbackPath
) => {
  // ─── Validate inputs ──────────────────────────────────────
  if (!phoneNumber || !/^254[17]\d{8}$/.test(phoneNumber)) {
    throw new Error(`Invalid phone number: ${phoneNumber}`);
  }
  if (!amount || amount <= 0) {
    throw new Error(`Invalid amount: ${amount}`);
  }

  const amountInt = Math.round(Number(amount));
  const accountRef = String(accountReference || 'PAYMENT').slice(0, 12);
  const desc = String(transactionDesc || 'Payment').slice(0, 13);

  // ─── Build and validate callback URL ──────────────────────
  const callbackUrl = buildCallbackUrl(callbackPath);
  validateCallbackUrl(callbackUrl);

  // ─── Get access token ─────────────────────────────────────
  const accessToken = await getAccessToken();
  const timestamp = buildTimestamp();

  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
  ).toString('base64');

  const payload = {
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amountInt,
    PartyA: phoneNumber,
    PartyB: process.env.MPESA_SHORTCODE,
    PhoneNumber: phoneNumber,
    CallBackURL: callbackUrl,
    AccountReference: accountRef,
    TransactionDesc: desc,
  };

  // ─── Debug log (helps enormously) ─────────────────────────
  console.log('══════ M-PESA STK PUSH ══════');
  console.log('Base URL:      ', getBaseUrl());
  console.log('CallBackURL:   ', callbackUrl);
  console.log('Phone:         ', phoneNumber);
  console.log('Amount:        ', amountInt);
  console.log('AccountRef:    ', accountRef, `(${accountRef.length} chars)`);
  console.log('TransactionDesc:', desc, `(${desc.length} chars)`);
  console.log('Timestamp:     ', timestamp);
  console.log('══════════════════════════════');

  try {
    const response = await axios.post(
      `${getBaseUrl()}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ STK Push response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ STK Push error:');
    console.error('  Status:', error.response?.status);
    console.error('  Data:  ', JSON.stringify(error.response?.data, null, 2));
    console.error('  Sent payload:', JSON.stringify({ ...payload, Password: '***' }, null, 2));
    throw new Error(
      error.response?.data?.errorMessage || 'M-Pesa STK Push failed'
    );
  }
};

/**
 * Query STK push status.
 */
const queryStatus = async (checkoutRequestID) => {
  const accessToken = await getAccessToken();
  const timestamp = buildTimestamp();

  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
  ).toString('base64');

  const payload = {
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestID,
  };

  try {
    const response = await axios.post(
      `${getBaseUrl()}/mpesa/stkpushquery/v1/query`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      'Query status error:',
      error.response?.data || error.message
    );
    throw new Error('Failed to query M-Pesa payment status');
  }
};

module.exports = { getAccessToken, stkPush, queryStatus };