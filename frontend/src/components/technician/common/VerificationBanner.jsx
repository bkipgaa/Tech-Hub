import React from 'react';
import { AlertCircle, XCircle } from 'lucide-react';

const VerificationBanner = ({ status, awaitingApproval }) => {
  if (status === 'verified') return null;

  return (
    <div className={`mb-6 p-4 rounded-lg flex items-center ${
      status === 'pending'
        ? 'bg-yellow-100 text-yellow-800'
        : 'bg-red-100 text-red-800'
    }`}>
      {status === 'pending' ? (
        <>
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>
            {awaitingApproval
              ? "Your profile is waiting for approval. Clients can't find you until our team approves it, so complete your profile in the meantime."
              : "Your profile is pending verification. You'll be able to accept jobs once approved."}
          </span>
        </>
      ) : status === 'rejected' ? (
        <>
          <XCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>Your profile verification was rejected. Please update your information.</span>
        </>
      ) : null}
    </div>
  );
};

export default VerificationBanner;
