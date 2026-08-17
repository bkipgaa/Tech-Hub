const Paystack = require('paystack-api')(process.env.PAYSTACK_SECRET_KEY);
module.exports = Paystack;