import React, { useState, useEffect } from 'react';
import { 
  CreditCard, CheckCircle, AlertCircle, Crown, 
  Shield, TrendingUp, MapPin, Calendar, Zap, Phone
} from 'lucide-react';
import api from '../../services/api';

/**
 * SubscriptionManager Component
 * 
 * Displays all available subscription plans, shows the technician's current plan,
 * allows activation of a free trial, and initiates payment for upgrades.
 * Supports Card (Paystack) and M-Pesa (Daraja STK Push).
 */
const SubscriptionManager = () => {
  // ============================================================
  // STATE
  // ============================================================
  
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Payment method selection state – now only 'card' or 'mpesa'
  const [paymentMethod, setPaymentMethod] = useState('card'); // default to card
  const [phoneNumber, setPhoneNumber] = useState(''); // for M-Pesa

  // M-Pesa polling state
  const [mpesaStatus, setMpesaStatus] = useState(null); // { status, message }
  const [pollingInterval, setPollingInterval] = useState(null);

  // ============================================================
  // EFFECTS
  // ============================================================

  useEffect(() => {
    fetchData();
    // Cleanup polling on unmount
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, []);

  // ============================================================
  // DATA FETCHING
  // ============================================================

  const fetchData = async () => {
    try {
      const [plansRes, subRes] = await Promise.all([
        api.get('/subscription/plans'),
        api.get('/subscription/current')
      ]);
      setPlans(plansRes.data.data);
      setCurrentSubscription(subRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Failed to load subscription data' });
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // ACTION HANDLERS
  // ============================================================

  const activateTrial = async () => {
    setProcessing(true);
    try {
      const response = await api.post('/subscription/trial');
      setMessage({ type: 'success', text: response.data.message });
      await fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to activate trial' });
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Upgrade to a selected paid plan.
   * - For card: sends paymentMethod: 'card' → backend returns authorization_url → redirect.
   * - For mpesa: sends paymentMethod: 'mpesa' and phoneNumber → backend initiates STK Push → returns checkoutRequestID → start polling.
   */
  const upgradePlan = async (planId) => {
    setProcessing(true);
    try {
      const payload = {
        planId,
        paymentMethod,
        autoRenew: currentSubscription?.autoRenew || false
      };
      // If M-Pesa, include phoneNumber
      if (paymentMethod === 'mpesa') {
        if (!phoneNumber) {
          setMessage({ type: 'error', text: 'Please enter your phone number for M-Pesa payment.' });
          setProcessing(false);
          return;
        }
        payload.phoneNumber = phoneNumber;
      }

      const response = await api.post('/subscription/upgrade', payload);
      const { data } = response.data;

      if (paymentMethod === 'card') {
        // Card: redirect to Paystack
        const { authorization_url } = data;
        if (authorization_url) {
          window.location.href = authorization_url;
        } else {
          setMessage({ type: 'error', text: 'No payment URL received. Please try again.' });
          setSelectedPlan(null);
          setProcessing(false);
        }
      } else if (paymentMethod === 'mpesa') {
        // M-Pesa: start polling
        const { checkoutRequestID } = data;
        if (checkoutRequestID) {
          setMpesaStatus({ status: 'pending', message: 'Please complete payment on your phone.' });
          startPolling(checkoutRequestID);
          setSelectedPlan(null); // close modal
          setProcessing(false);
        } else {
          setMessage({ type: 'error', text: 'No checkout request ID received. Please try again.' });
          setSelectedPlan(null);
          setProcessing(false);
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to initiate payment' });
      setSelectedPlan(null);
      setProcessing(false);
    }
  };

  const startPolling = (checkoutRequestID) => {
    let attempts = 0;
    const maxAttempts = 30; // 30 * 5s = 150s max
    const interval = setInterval(async () => {
      attempts++;
      try {
        const response = await api.get(`/subscription/mpesa-status?checkoutRequestID=${checkoutRequestID}`);
        const { status, message } = response.data.data;
        setMpesaStatus({ status, message });

        if (status === 'success') {
          clearInterval(interval);
          setPollingInterval(null);
          setMessage({ type: 'success', text: 'Payment successful! Your subscription has been updated.' });
          await fetchData(); // refresh subscription data
          setMpesaStatus(null);
          setProcessing(false);
        } else if (status === 'failed') {
          clearInterval(interval);
          setPollingInterval(null);
          setMessage({ type: 'error', text: `Payment failed: ${message}` });
          setMpesaStatus(null);
          setProcessing(false);
        }
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setPollingInterval(null);
          setMessage({ type: 'error', text: 'Payment confirmation timed out. Please contact support.' });
          setMpesaStatus(null);
          setProcessing(false);
        }
      } catch (error) {
        console.error('Polling error:', error);
        // Optionally stop polling after too many errors
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setPollingInterval(null);
          setMessage({ type: 'error', text: 'Error checking payment status. Please contact support.' });
          setMpesaStatus(null);
          setProcessing(false);
        }
      }
    }, 5000);

    setPollingInterval(interval);
  };

  const cancelAutoRenew = async () => {
    try {
      const response = await api.put('/subscription/cancel-auto-renew');
      setMessage({ type: 'success', text: response.data.message });
      await fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to cancel auto-renewal' });
    }
  };

  const closeModal = () => {
    setSelectedPlan(null);
    setMpesaStatus(null);
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setProcessing(false);
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Subscription Management</h1>
      <p className="text-gray-600 mb-6">Choose a plan that fits your business needs</p>

      {/* Current Subscription Card */}
      {currentSubscription && (
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Current Plan</h3>
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                <span className="text-xl font-bold">
                  {currentSubscription.plan === 'trial' ? 'Free Trial' : 
                   currentSubscription.plan === 'basicPlus' ? 'Basic-Plus' :
                   currentSubscription.plan?.charAt(0).toUpperCase() + currentSubscription.plan?.slice(1) || 'Free'}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${currentSubscription.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {currentSubscription.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Visibility Radius: <strong>{currentSubscription.visibilityRadius}km</strong></span>
                </div>
                {currentSubscription.daysRemaining > 0 && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{currentSubscription.daysRemaining} days remaining</span>
                  </div>
                )}
                {currentSubscription.autoRenew && (
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span>Auto-renewal enabled</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              {currentSubscription.plan !== 'trial' && currentSubscription.canActivateTrial && (
                <button
                  onClick={activateTrial}
                  disabled={processing}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  Start Free Trial
                </button>
              )}
              {currentSubscription.autoRenew && (
                <button
                  onClick={cancelAutoRenew}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                >
                  Cancel Auto-Renewal
                </button>
              )}
            </div>
          </div>

          {/* Upgrade prompt when subscription is inactive */}
          {!currentSubscription.isActive && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex flex-wrap items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span className="text-red-700 font-medium flex-1">
                Your subscription has expired. To continue using the platform and be visible to clients, please upgrade to a paid plan.
              </span>
              <button
                onClick={() => {
                  document.getElementById('plans-grid')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Upgrade Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* Message Display */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 inline mr-2" /> : <AlertCircle className="w-5 h-5 inline mr-2" />}
          {message.text}
        </div>
      )}

      {/* Plans Grid */}
      <div id="plans-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.filter(p => p.id !== 'trial').map((plan) => (
          <div key={plan.id} className="bg-white rounded-lg shadow-lg border overflow-hidden hover:shadow-xl transition-shadow">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold">KES {plan.price.toLocaleString()}</span>
                <span className="text-gray-500">/month</span>
              </div>
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Visibility Radius</span>
                  <span className="text-lg font-bold text-blue-600">{plan.visibilityRadius}km</span>
                </div>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.slice(0, 4).map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {currentSubscription?.plan === plan.id ? (
                <button className="w-full py-2 bg-gray-100 text-gray-600 rounded-lg cursor-default" disabled>
                  Current Plan
                </button>
              ) : (
                <button
                  onClick={() => setSelectedPlan(plan.id)}
                  className="w-full py-2 bg-gray-800 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Upgrade to {plan.name}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ========== UPGRADE CONFIRMATION MODAL ========== */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Confirm Upgrade</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to upgrade to {plans.find(p => p.id === selectedPlan)?.name} plan?
            </p>

            {/* Payment Method Selection - only card or mpesa */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose Payment Method
              </label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  💳 Card
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="mpesa"
                    checked={paymentMethod === 'mpesa'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  📱 M-Pesa
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {paymentMethod === 'card' && 'You will be redirected to Paystack to complete payment.'}
                {paymentMethod === 'mpesa' && 'You will receive an M-Pesa STK push on your phone.'}
              </p>
            </div>

            {/* Phone number input for M-Pesa */}
            {paymentMethod === 'mpesa' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  M-Pesa Phone Number
                </label>
                <div className="flex items-center border rounded-lg px-3 py-2">
                  <Phone className="w-5 h-5 text-gray-400 mr-2" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g., 254712345678"
                    className="w-full outline-none"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter the phone number registered with M-Pesa (starting with 254).
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => upgradePlan(selectedPlan)}
                disabled={processing || (paymentMethod === 'mpesa' && !phoneNumber)}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Confirm & Pay'}
              </button>
              <button
                onClick={closeModal}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>

            {/* M-Pesa waiting status inside modal */}
            {mpesaStatus && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800">{mpesaStatus.message}</p>
                <p className="text-xs text-blue-600">Waiting for payment confirmation...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManager;