import React, { useState, useEffect } from 'react';
import { 
  CreditCard, CheckCircle, AlertCircle, Crown, 
  Shield, TrendingUp, MapPin, Calendar, Zap
} from 'lucide-react';
import api from '../../services/api';

/**
 * SubscriptionManager Component
 * 
 * Displays all available subscription plans, shows the technician's current plan,
 * allows activation of a free trial, and initiates a Paystack payment for upgrades.
 * 
 * Flow:
 * 1. Fetch plans and current subscription on mount.
 * 2. Show current plan status (active/inactive, days remaining, visibility radius).
 * 3. List all plans (excluding 'trial' because it's handled via a separate button).
 * 4. When user clicks "Upgrade", a confirmation modal appears.
 * 5. On confirmation, call the backend to initialize Paystack payment.
 * 6. Redirect to Paystack's checkout page (authorization_url).
 * 7. After payment, the webhook updates the subscription (handled server-side).
 * 8. User returns to the app (manually or via callback URL) and the page reloads.
 */
const SubscriptionManager = () => {
  // ============================================================
  // STATE
  // ============================================================
  
  // List of all plans (fetched from backend)
  const [plans, setPlans] = useState([]);
  
  // Current subscription details of the logged-in technician
  const [currentSubscription, setCurrentSubscription] = useState(null);
  
  // Loading state for initial data fetch
  const [loading, setLoading] = useState(true);
  
  // ID of the plan the user selected for upgrade (triggers modal)
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  // Processing flag – disables buttons during API calls
  const [processing, setProcessing] = useState(false);
  
  // Feedback messages (success/error) displayed to the user
  const [message, setMessage] = useState({ type: '', text: '' });

  // ============================================================
  // EFFECTS
  // ============================================================

  // Fetch plans and current subscription on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // ============================================================
  // DATA FETCHING
  // ============================================================

  /**
   * Fetch all plans and the technician's current subscription in parallel.
   * Updates state and handles errors.
   */
  const fetchData = async () => {
    try {
      const [plansRes, subRes] = await Promise.all([
        api.get('/subscription/plans'),      // GET /api/subscription/plans
        api.get('/subscription/current')     // GET /api/subscription/current
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

  /**
   * Activate the free trial for the technician.
   * - Only available if the technician has never used a trial and has no active paid subscription.
   * - Calls POST /api/subscription/trial, then refreshes data.
   */
  const activateTrial = async () => {
    setProcessing(true);
    try {
      const response = await api.post('/subscription/trial');
      setMessage({ type: 'success', text: response.data.message });
      await fetchData(); // Refresh to show updated subscription
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to activate trial' });
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Upgrade to a selected paid plan.
   * - Calls POST /api/subscription/upgrade with { planId }.
   * - The backend initializes a Paystack transaction and returns an `authorization_url`.
   * - Redirects the user to Paystack's secure checkout page to complete payment.
   * - The actual subscription update happens via webhook after successful payment.
   */
  const upgradePlan = async (planId) => {
    setProcessing(true);
    try {
      const response = await api.post('/subscription/upgrade', { planId });
      const { authorization_url } = response.data.data;
      
      if (authorization_url) {
        // Redirect to Paystack – the user will pay via M-Pesa or card
        window.location.href = authorization_url;
      } else {
        setMessage({ type: 'error', text: 'No payment URL received. Please try again.' });
        setSelectedPlan(null);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to initiate payment' });
      setSelectedPlan(null);
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Cancel auto-renewal for the current subscription.
   * - Calls PUT /api/subscription/cancel-auto-renew.
   * - Refreshes data to reflect the change.
   */
  const cancelAutoRenew = async () => {
    try {
      const response = await api.put('/subscription/cancel-auto-renew');
      setMessage({ type: 'success', text: response.data.message });
      await fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to cancel auto-renewal' });
    }
  };

  // ============================================================
  // RENDER HELPERS (conditional content)
  // ============================================================

  // Loading spinner while fetching data
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Subscription Management</h1>
      <p className="text-gray-600 mb-6">Choose a plan that fits your business needs</p>

      {/* ========== CURRENT SUBSCRIPTION CARD ========== */}
      {currentSubscription && (
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-start justify-between flex-wrap gap-4">
            {/* Left: Plan name, status, details */}
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
              
              {/* Subscription metrics */}
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
            
            {/* Right: Action buttons (Trial activation / Cancel auto-renew) */}
            <div className="flex gap-3">
              {/* Show "Start Free Trial" only if not already on trial and can activate */}
              {currentSubscription.plan !== 'trial' && currentSubscription.canActivateTrial && (
                <button
                  onClick={activateTrial}
                  disabled={processing}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  Start Free Trial
                </button>
              )}
              {/* Show "Cancel Auto-Renewal" only if currently enabled */}
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
        </div>
      )}

      {/* ========== FEEDBACK MESSAGE ========== */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 inline mr-2" /> : <AlertCircle className="w-5 h-5 inline mr-2" />}
          {message.text}
        </div>
      )}

      {/* ========== PLANS GRID ========== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Filter out 'trial' – we handle it separately via the button */}
        {plans.filter(p => p.id !== 'trial').map((plan) => (
          <div key={plan.id} className="bg-white rounded-lg shadow-lg border overflow-hidden hover:shadow-xl transition-shadow">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold">KES {plan.price.toLocaleString()}</span>
                <span className="text-gray-500">/month</span>
              </div>
              
              {/* Visibility radius badge */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Visibility Radius</span>
                  <span className="text-lg font-bold text-blue-600">{plan.visibilityRadius}km</span>
                </div>
              </div>
              
              {/* Features list (show first 4) */}
              <ul className="space-y-2 mb-6">
                {plan.features.slice(0, 4).map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              {/* Upgrade button or "Current Plan" disabled state */}
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
              <br />
              <span className="text-sm text-blue-600">You will be redirected to Paystack to complete payment.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => upgradePlan(selectedPlan)}
                disabled={processing}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {processing ? 'Redirecting...' : 'Confirm & Pay'}
              </button>
              <button
                onClick={() => setSelectedPlan(null)}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManager;