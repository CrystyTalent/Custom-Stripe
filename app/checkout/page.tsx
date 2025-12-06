'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import StripeCheckoutForm from '@/components/StripeCheckoutForm';

export default function CheckoutPage() {
  const router = useRouter();
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');

  useEffect(() => {
    fetchCartTotal();
  }, []);

  const fetchCartTotal = async () => {
    try {
      const response = await fetch('/api/cart');
      if (response.ok) {
        const data = await response.json();
        setTotal(data.total || 0);
        if (!data.total || data.total === 0 || !data.items || data.items.length === 0) {
          router.push('/cart');
          return;
        }
      } else if (response.status === 401) {
        router.push('/login');
        return;
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <p className="text-gray-400">Loading checkout...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Support Banner */}
        <div className="mb-4 rounded-lg border border-gray-800 bg-gray-900 p-4 text-sm text-gray-300">
          If you didn&apos;t receive your product or are unhappy with your purchase, please visit our{' '}
          <Link href="/support" className="text-blue-400 hover:text-blue-300 underline">
            support page
          </Link>{' '}
          for assistance or a possible refund.
        </div>

        {/* Payment Form Card */}
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-white text-xl font-bold text-black">
                A
              </div>
              <span className="text-xl font-semibold text-white">amstore</span>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">${(total || 0).toFixed(2)}</div>
              <div className="text-sm text-gray-400">Total:</div>
            </div>
          </div>

          {/* Apple Pay Section */}
          <div className="mb-6 rounded-lg border border-gray-700 bg-gray-800 p-4 text-center">
            <p className="text-sm text-gray-300">
              To use Apple Pay, open on your mobile device
            </p>
          </div>

          {/* Separator */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-gray-900 px-4 text-gray-400">or pay with card</span>
            </div>
          </div>

          {/* Email Field */}
          <div className="mb-6">
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-white">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Stripe Checkout Form */}
          {email && (
            <StripeCheckoutForm total={total} email={email} />
          )}

          {!email && (
            <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 text-center text-sm text-gray-400">
              Please enter your email to continue
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-gray-500">
            Powered by Stripe • Secure Payment
          </div>
        </div>
      </div>
    </div>
  );
}
