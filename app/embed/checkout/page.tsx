'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

function CheckoutForm({ amount, email }: { amount: number; email?: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [formEmail, setFormEmail] = useState(email || '');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!amount || amount <= 0) {
      setError('Invalid amount');
      return;
    }

    fetch('/api/public/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount,
        email: formEmail || email,
        currency: 'usd',
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError(data.error || 'Failed to initialize payment');
        }
      })
      .catch((err) => {
        console.error('Error creating payment intent:', err);
        setError('Failed to initialize payment');
      });
  }, [amount, formEmail, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('Card element not found');
      setProcessing(false);
      return;
    }

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: formEmail || email,
            },
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        setProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        setSuccess(true);
        // Notify parent window if embedded
        if (window.parent !== window) {
          window.parent.postMessage({
            type: 'payment_success',
            paymentIntentId: paymentIntent.id,
          }, '*');
        }
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('An unexpected error occurred');
    } finally {
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
      },
    },
  };

  if (success) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-8 text-center">
        <div className="mb-4 text-6xl">✅</div>
        <h2 className="mb-2 text-2xl font-bold text-white">Payment Successful!</h2>
        <p className="text-gray-400">Thank you for your purchase.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-900/50 border border-red-700 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {!email && (
        <div>
          <label className="mb-2 block text-sm font-medium text-white">
            Email
          </label>
          <input
            type="email"
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-white">
          Card information
        </label>
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || processing || !clientSecret}
        className="w-full rounded-lg bg-white px-6 py-4 text-lg font-bold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {processing ? 'Processing...' : `Pay $${(amount || 0).toFixed(2)}`}
      </button>
    </form>
  );
}

function EmbedCheckoutContent() {
  const searchParams = useSearchParams();
  const amount = parseFloat(searchParams.get('amount') || '0');
  const email = searchParams.get('email') || undefined;

  if (!amount || amount <= 0) {
    return (
      <div className="min-h-screen bg-black py-8 px-4">
        <div className="mx-auto max-w-md rounded-lg border border-red-800 bg-red-900/50 p-8 text-center">
          <p className="text-red-200">Invalid amount. Please provide a valid amount parameter.</p>
        </div>
      </div>
    );
  }

  const options = {
    mode: 'payment' as const,
    amount: Math.round(amount * 100),
    currency: 'usd',
  };

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="mx-auto max-w-md">
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-8">
          <h1 className="mb-6 text-2xl font-bold text-white">Checkout</h1>
          <div className="mb-4 text-xl font-semibold text-white">
            Total: ${amount.toFixed(2)}
          </div>
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm amount={amount} email={email} />
          </Elements>
        </div>
      </div>
    </div>
  );
}

export default function EmbedCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-black">
        <p className="text-gray-400">Loading checkout...</p>
      </div>
    }>
      <EmbedCheckoutContent />
    </Suspense>
  );
}

