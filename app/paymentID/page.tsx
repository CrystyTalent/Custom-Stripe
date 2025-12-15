'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreatePaymentPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    amount: '',
    currency: '',
    email: '',
    username: '',
    description: '',
    success_url: '',
    order_id: '',
  });
  const [productionApiKey, setProductionApiKey] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const response = await fetch('/api/keys');
        if (response.ok) {
          const data = await response.json();
          setProductionApiKey(data.productionApiKey || '');
        } else if (response.status === 401) {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching API key:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApiKey();
  }, [router]);

  const formatApiKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 20) return key;
    return `${key.substring(0, 20)}${'x'.repeat(Math.min(32, key.length - 20))}`;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleAmountChange = (value: string) => {
    // Allow only numbers and decimal point
    const sanitized = value.replace(/[^0-9.]/g, '');
    // Prevent multiple decimal points
    const parts = sanitized.split('.');
    if (parts.length > 2) {
      return;
    }
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return;
    }
    handleInputChange('amount', sanitized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    // Validation
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Amount is required and must be greater than 0');
      setSubmitting(false);
      return;
    }

    if (!formData.currency) {
      setError('Currency is required');
      setSubmitting(false);
      return;
    }

    if (!formData.success_url) {
      setError('Success URL is required');
      setSubmitting(false);
      return;
    }

    try {
      // Convert amount to cents for API (Stripe uses cents)
      const amountInCents = Math.round(parseFloat(formData.amount) * 100);

      const response = await fetch('/api/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${productionApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInCents, // $100.00 in cents (required)
          currency: formData.currency, // required
          email: formData.email || undefined, // optional
          username: formData.username || undefined, // optional
          description: formData.description || undefined, // optional
          success_url: formData.success_url, // required
          metadata: formData.order_id ? { order_id: formData.order_id } : undefined, // optional - track your orders
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Payment creation failed:', data.error);
        throw new Error(data.error || 'Failed to create payment');
      }

      setSuccess(`Payment created successfully! Redirecting to checkout...`);
      
      // Redirect customer to checkout page
      setTimeout(() => {
        router.push('/order');
      }, 1500);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create payment. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const currencies = [
    { value: 'usd', label: 'USD - US Dollar' },
    { value: 'eur', label: 'EUR - Euro' },
    { value: 'gbp', label: 'GBP - British Pound' },
    { value: 'cad', label: 'CAD - Canadian Dollar' },
    { value: 'aud', label: 'AUD - Australian Dollar' },
    { value: 'jpy', label: 'JPY - Japanese Yen' },
  ];

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-300 border-r-transparent mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-black">
      <div className="container mx-auto max-w-2xl px-4 py-8 sm:py-12">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Create Payment</h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Fill in the payment details below to process your transaction.
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-gray-800 bg-gray-900/50 p-6 sm:p-8">
          {/* Payment Details Section */}
          <div className="space-y-5 pb-6 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Payment Details</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Amount Field */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Amount <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm">$</span>
                  <input
                    type="text"
                    id="amount"
                    value={formData.amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2.5 pl-7 pr-4 text-white placeholder-gray-500 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Currency Field */}
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Currency <span className="text-red-400">*</span>
                </label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                >
                  <option value="" className="bg-gray-800">Select currency</option>
                  {currencies.map((curr) => (
                    <option key={curr.value} value={curr.value} className="bg-gray-800">
                      {curr.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Customer Information Section */}
          <div className="space-y-5 pb-6 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Customer Information</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Email Address Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>

              {/* Customer Name Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Customer Name
                </label>
                <input
                  type="text"
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Additional Details Section */}
          <div className="space-y-5 pb-6 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Additional Details</h2>
            
            {/* Description Field */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1.5">
                Description
              </label>
              <input
                type="text"
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Order #1234"
                className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            {/* Success URL Field */}
            <div>
              <label htmlFor="success_url" className="block text-sm font-medium text-gray-300 mb-1.5">
                Success URL <span className="text-red-400">*</span>
              </label>
              <input
                type="url"
                id="success_url"
                value={formData.success_url}
                onChange={(e) => handleInputChange('success_url', e.target.value)}
                placeholder="https://yourwebsite.com/success"
                required
                className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
              <p className="mt-1.5 text-xs text-gray-500">Where to redirect customers after successful payment</p>
            </div>

            {/* Order ID Field */}
            <div>
              <label htmlFor="order_id" className="block text-sm font-medium text-gray-300 mb-1.5">
                Order ID
              </label>
              <input
                type="text"
                id="order_id"
                value={formData.order_id}
                onChange={(e) => handleInputChange('order_id', e.target.value)}
                placeholder="1234"
                className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
              <p className="mt-1.5 text-xs text-gray-500">Optional identifier for tracking your orders</p>
            </div>
          </div>

          {/* API Key Section */}
          <div className="space-y-3">
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300">
              Production API Key
            </label>
            <input
              type="text"
              id="apiKey"
              value={formatApiKey(productionApiKey)}
              readOnly
              className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-gray-400 text-sm cursor-not-allowed font-mono"
            />
            <p className="text-xs text-gray-500">Your API key is automatically included in the request</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-950/50 border border-red-800/50 p-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="rounded-lg bg-green-950/50 border border-green-800/50 p-4">
              <p className="text-green-300 text-sm">{success}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !productionApiKey}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>Creating Payment...</span>
              </>
            ) : (
              <>
                <span>Create</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
