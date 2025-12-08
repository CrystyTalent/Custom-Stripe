'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface PaymentItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}

interface Payment {
  paymentId: string;
  amount: string;
  currency: string;
  email: string;
  name: string;
  description: string;
  cartItems: PaymentItem[];
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const paymentId = params.paymentId as string;
  
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [email, setEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');

  const fetchPayment = async () => {
    if (!paymentId) {
      setError('Payment ID is required');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/payments/${encodeURIComponent(paymentId)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.payment) {
          setPayment(data.payment);
          setEmail(data.payment.email || '');
        } else {
          setError('Payment data not found in response');
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setError(errorData.error || 'Failed to load payment');
      }
    } catch (error) {
      console.error('Error fetching payment:', error);
      setError('Failed to load payment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paymentId) {
      fetchPayment();
    } else {
      setError('Payment ID is missing from URL');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);

    try {
      // Simulate payment processing
      // In a real implementation, you would integrate with Stripe or another payment processor
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update payment status
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'completed',
          email: email
        }),
      });

      if (response.ok) {
        // Redirect to success page or order page
        router.push(`/order`);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Payment failed' }));
        setError(errorData.error || 'Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError('Payment failed. Please try again.');
      
      // Update payment status to failed
      try {
        await fetch(`/api/payments/${paymentId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'failed',
            email: email
          }),
        });
      } catch (updateError) {
        console.error('Failed to update payment status:', updateError);
      }
    } finally {
      setProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400">Loading payment...</p>
      </div>
    );
  }

  if (error && !payment) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Payment Error</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/store')}
            className="rounded-md bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Go to Store
          </button>
        </div>
      </div>
    );
  }

  if (!payment) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Support Message */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 text-sm text-gray-300">
          If you didn&apos;t receive your product or are unhappy with your purchase, please visit our{' '}
          <a href="#" className="underline hover:text-white">support page</a> for assistance or a possible refund.
        </div>

        {/* Payment Form */}
        <div className="bg-gray-800 rounded-lg p-6">
          {/* Product Info */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded flex items-center justify-center">
                <span className="text-black font-bold text-xl">C</span>
              </div>
              <span className="text-white font-semibold">{payment.description || 'Payment'}</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">${payment.amount}</div>
              <div className="text-sm text-gray-400">Total:</div>
            </div>
          </div>

          {/* Apple Pay Button */}
          <button
            type="button"
            className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-md mb-4 transition-colors"
            disabled
          >
            To use Apple Pay, open on your mobile device
          </button>
          <p className="text-center text-gray-400 text-sm mb-6">or pay with card</p>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="mb-4">
              <label className="block text-white text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-gray-900 border border-gray-700 rounded-md px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your@email.com"
              />
            </div>

            {/* Card Information */}
            <div className="mb-4">
              <label className="block text-white text-sm font-medium mb-2">Card information</label>
              <div className="relative">
                <input
                  type="text"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  maxLength={19}
                  required
                  className="w-full bg-gray-900 border border-gray-700 rounded-md px-4 py-3 pl-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Card number"
                />
                <span className="absolute left-3 top-3.5 text-gray-500">💳</span>
                <button
                  type="button"
                  className="absolute right-3 top-2.5 bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded transition-colors"
                >
                  Autofill link
                </button>
              </div>
            </div>

            {/* Name on Card */}
            <div className="mb-6">
              <input
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                required
                className="w-full bg-gray-900 border border-gray-700 rounded-md px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Name on Card"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-800 rounded-md text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Purchase Button */}
            <button
              type="submit"
              disabled={processing}
              className="w-full bg-white hover:bg-gray-100 text-black font-semibold py-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Processing...' : 'Purchase'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-gray-500 text-xs mt-6">
            Powered by Payzo • Secure Payment
          </p>
        </div>
      </div>
    </div>
  );
}

