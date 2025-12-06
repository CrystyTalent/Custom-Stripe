'use client';

import { useEffect, useState } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useRouter } from 'next/navigation';

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

interface StripeCheckoutFormProps {
  total: number;
  email: string;
}

function CheckoutForm({ total, email }: StripeCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  useEffect(() => {
    // Create payment intent when component mounts
    fetch('/api/stripe/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: total,
        currency: 'usd',
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          setPaymentIntentId(data.paymentIntentId);
        } else {
          setError(data.error || 'Failed to initialize payment');
        }
      })
      .catch((err) => {
        console.error('Error creating payment intent:', err);
        setError('Failed to initialize payment');
      });
  }, [total]);

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
      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: email,
            },
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        
        // Update order status to failed
        if (paymentIntentId) {
          try {
            await fetch('/api/stripe/update-order-status', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                paymentIntentId: paymentIntentId,
                status: 'failed',
              }),
            });
          } catch (err) {
            console.error('Error updating order status:', err);
          }
        }
        
        setProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Confirm payment on server
        const response = await fetch('/api/stripe/confirm-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Redirect to success page
          router.push('/checkout/success');
        } else {
          setError(data.error || 'Payment confirmation failed');
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
    hidePostalCode: false,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-900/50 border border-red-700 px-4 py-3 text-sm text-red-200">
          {error}
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
        {processing ? 'Processing...' : 'Purchase'}
      </button>
    </form>
  );
}

export default function StripeCheckoutForm({ total, email }: StripeCheckoutFormProps) {
  const options: StripeElementsOptions = {
    mode: 'payment',
    amount: Math.round(total * 100),
    currency: 'usd',
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm total={total} email={email} />
    </Elements>
  );
}

