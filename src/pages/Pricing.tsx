import React, { useState } from 'react';

const Pricing = () => {
  const [loading, setLoading] = useState(false);

  const handleStartTrial = async () => {
    setLoading(true);
    try {
      const res = await fetch('/functions/v1/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: window.localStorage.getItem('user_email') }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to start trial: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-4 text-center">Start Your Free Trial</h1>
        <p className="text-gray-600 mb-6 text-center">
          Try VendorHub free for 3 days. No setup fee. Cancel anytime before your trial ends and you won't be charged.
        </p>
        <button
          className="w-full bg-vendor-green-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-vendor-green-700 transition"
          onClick={handleStartTrial}
          disabled={loading}
        >
          {loading ? 'Redirecting...' : 'Start 3-Day Trial'}
        </button>
      </div>
    </div>
  );
};

export default Pricing;