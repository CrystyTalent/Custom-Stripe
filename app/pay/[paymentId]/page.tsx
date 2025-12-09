'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import Link from 'next/link';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

interface PaymentData {
  paymentId: string;
  amount: string;
  currency: string;
  email: string;
  username: string;
  description: string;
}

function CheckoutForm({ paymentData }: { paymentData: PaymentData }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [email, setEmail] = useState(paymentData.email || '');
  const [name, setName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Create payment intent
      const intentResponse = await fetch(`/api/v1/payments/${paymentData.paymentId}/intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!intentResponse.ok) {
        const errorData = await intentResponse.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const { clientSecret } = await intentResponse.json();

      // Get card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Confirm payment
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: name,
              email: email,
            },
          },
        }
      );

      if (confirmError) {
        // Update payment status to failed
        await fetch(`/api/v1/payments/${paymentData.paymentId}/status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'failed' }),
        });
        throw new Error(confirmError.message);
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Update payment status to completed/paid
        const statusResponse = await fetch(`/api/v1/payments/${paymentData.paymentId}/status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'paid' }),
        });

        const statusData = await statusResponse.json();
        // Redirect to success page or order page
        router.push(`${statusData.success_url as string}`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred during payment');
      }
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#ffffff',
        '::placeholder': {
          color: '#9ca3af',
        },
        backgroundColor: '#1f2937',
      },
      invalid: {
        color: '#ef4444',
        iconColor: '#ef4444',
      },
    },
    hidePostalCode: true,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-md border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="your@email.com"
        />
      </div>


      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Card information
        </label>
        <div className="rounded-md border border-gray-700 bg-gray-800 p-4">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-900/50 border border-red-800 p-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
          Name on Card
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-md border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Full Name"
        />
      </div>

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full rounded-md bg-white px-6 py-4 text-lg font-semibold text-black transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? 'Processing...' : `Purchase`}
      </button>

      <p className="text-center text-xs text-gray-400">
        Powered by Payzo.cc • Secure Payment
      </p>
    </form>
  );
}

export default function PaymentPage() {
  const params = useParams();
  const paymentId = params?.paymentId as string;
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!paymentId) {
      setError('Payment ID is required');
      setLoading(false);
      return;
    }

    const fetchPayment = async () => {
      try {
        const response = await fetch(`/api/v1/payments/${paymentId}`);
        if (response.ok) {
          const data = await response.json();
          setPaymentData(data.payment);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Payment not found');
        }
      } catch (err) {
        console.error('Error fetching payment:', err);
        setError('Failed to load payment details');
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [paymentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400">Loading payment...</p>
      </div>
    );
  }

  if (error || !paymentData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Payment Not Found</h1>
          <p className="text-gray-400 mb-6">{error || 'Unable to load payment details'}</p>
          <Link
            href="/order"
            className="inline-block rounded-md bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Go to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Support notice */}
        <div className="mb-6 rounded-lg border border-gray-700 bg-gray-800 p-4">
          <p className="text-sm text-gray-300">
            If you didn&apos;t receive your product or are unhappy with your purchase, please visit our{' '}
            <Link href="/support" className="underline text-blue-400 hover:text-blue-300">
              support page
            </Link>
            {' '}for assistance or a possible refund.
          </p>
        </div>

        {/* Payment form container */}
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-8">
          {/* Product/Service info */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-md bg-white flex items-center justify-center">
                <span className="text-2xl font-bold text-black">{paymentData.username[0].toUpperCase()}</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{paymentData.description || 'Payment'}</h2>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">${paymentData.amount}</p>
              <p className="text-sm text-gray-400">Total:</p>
            </div>
          </div>

          {/* Payment form */}
          <Elements stripe={stripePromise}>
            <CheckoutForm paymentData={paymentData} />
          </Elements>
        </div>
      </div>
    </div>
  );
}

