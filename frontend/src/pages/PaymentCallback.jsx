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
      const reference = searchParams.get('reference');

      if (!reference) {
        setStatus('error');
        setMessage('No payment reference found.');
        return;
      }

      try {
        // Call your backend verification endpoint
        const response = await api.get(`/subscription/verify?reference=${reference}`);
        const { data } = response.data;

        if (data.status === 'success') {
          setStatus('success');
          setMessage('Payment successful! Your subscription has been updated.');
          // Redirect to subscription page after 2 seconds
          setTimeout(() => navigate('/subscription'), 2000);
        } else {
          setStatus('error');
          setMessage('Payment was not successful. Please try again.');
          setTimeout(() => navigate('/subscription'), 3000);
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('Could not verify payment. Please check your subscription status.');
        setTimeout(() => navigate('/subscription'), 3000);
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
            <h2 className="text-xl font-semibold mt-4">Verifying your payment...</h2>
            <p className="text-gray-500 mt-2">Please wait while we confirm your transaction.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 mx-auto text-green-600" />
            <h2 className="text-xl font-semibold mt-4 text-green-700">Payment Successful!</h2>
            <p className="text-gray-600 mt-2">{message}</p>
            <p className="text-sm text-gray-400 mt-4">Redirecting to subscription page...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-16 h-16 mx-auto text-red-600" />
            <h2 className="text-xl font-semibold mt-4 text-red-700">Payment Verification Failed</h2>
            <p className="text-gray-600 mt-2">{message}</p>
            <p className="text-sm text-gray-400 mt-4">Redirecting to subscription page...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback;