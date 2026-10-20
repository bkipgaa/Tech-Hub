  import React, { useEffect, useState } from 'react';
  import { useNavigate, useSearchParams } from 'react-router-dom';
  import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
  import api from '../services/api';

  const PaymentCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
    const [message, setMessage] = useState('');

    useEffect(() => {
      const verifyPayment = async () => {
        // Paystack appends 'reference' (or 'trxref' on some channels).
        const reference =
          searchParams.get('reference') || searchParams.get('trxref');

        if (!reference) {
          setStatus('error');
          setMessage('No payment reference found.');
          return;
        }

        const redirectTo = '/subscription';
        const successMessage = 'Payment successful! Your subscription has been updated.';
        const failureMessage = 'Payment was not successful. Please try again.';

        try {
          const response = await api.get(`/subscription/verify?reference=${reference}`);
          const payload = response.data;

          // The subscription endpoint returns { success, data: { status } }
          if (payload.data?.status === 'success') {
            setStatus('success');
            setMessage(successMessage);
            setTimeout(() => navigate(redirectTo), 2000);
          } else {
            setStatus('error');
            setMessage(payload.message || failureMessage);
            setTimeout(() => navigate(redirectTo), 3000);
          }
        } catch (error) {
          console.error('Verification error:', error);
          setStatus('error');
          setMessage(
            error.response?.data?.message ||
              'Could not verify payment. Please check your account status.'
          );
          setTimeout(() => navigate(redirectTo), 3000);
        }
      };

      verifyPayment();
    }, [searchParams, navigate]);

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 mx-auto text-blue-600 animate-spin" />
              <h2 className="text-xl font-semibold mt-4">
                Verifying your payment...
              </h2>
              <p className="text-gray-500 mt-2">
                Please wait while we confirm your transaction.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 mx-auto text-green-600" />
              <h2 className="text-xl font-semibold mt-4 text-green-700">
                Payment Successful!
              </h2>
              <p className="text-gray-600 mt-2">{message}</p>
              <p className="text-sm text-gray-400 mt-4">
                Redirecting...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="w-16 h-16 mx-auto text-red-600" />
              <h2 className="text-xl font-semibold mt-4 text-red-700">
                Payment Verification Failed
              </h2>
              <p className="text-gray-600 mt-2">{message}</p>
              <p className="text-sm text-gray-400 mt-4">
                Redirecting...
              </p>
            </>
          )}
        </div>
      </div>
    );
  };

  export default PaymentCallback;