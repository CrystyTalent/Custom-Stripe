'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface PaymentInfo {
  paymentId?: string;
  amount?: string;
}

export default function CancelPage() {
  const searchParams = useSearchParams();
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const paymentId = searchParams.get('paymentId');
    
    if (paymentId) {
      // Fetch payment details
      fetch(`/api/v1/payments/${paymentId}`)
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            setPaymentInfo({
              paymentId: data.payment?.paymentId,
              amount: data.payment?.amount ? `$${(data.payment.amount / 100).toFixed(2)}` : undefined,
            });
          }
        })
        .catch((err) => {
          console.error('Error fetching payment:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const paymentId = searchParams.get('paymentId') || paymentInfo?.paymentId;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-black flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-8 text-center">
          {/* Cancel Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-600/20">
            <svg
              className="h-12 w-12 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>

          {/* Cancel Message */}
          <h1 className="text-3xl font-bold text-white mb-4">Payment Cancelled</h1>
          <p className="text-gray-400 mb-8">
            Your payment was cancelled. No charges have been made to your account.
          </p>

          {/* Payment Details */}
          {loading ? (
            <div className="mb-8">
              <p className="text-gray-400">Loading payment details...</p>
            </div>
          ) : paymentInfo ? (
            <div className="mb-8 rounded-lg border border-gray-800 bg-gray-800 p-6 text-left">
              <h2 className="text-lg font-semibold text-white mb-4">Payment Details</h2>
              <div className="space-y-3">
                {paymentInfo.paymentId && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Payment ID:</span>
                    <span className="text-white font-mono text-sm">{paymentInfo.paymentId}</span>
                  </div>
                )}
                {paymentInfo.amount && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount:</span>
                    <span className="text-white font-semibold">{paymentInfo.amount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-yellow-500 font-semibold uppercase">Cancelled</span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {paymentId && (
              <Link
                href={`/pay/${paymentId}`}
                className="rounded-md bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Try Again
              </Link>
            )}
            <Link
              href={`/order?id=${paymentId}`}
              className="rounded-md border border-gray-700 bg-gray-800 px-6 py-3 font-semibold text-white transition-colors hover:bg-gray-700"
            >
              View Order
            </Link>
          </div>

          {/* Additional Info */}
          <p className="mt-8 text-xs text-gray-500">
            If you experienced any issues during checkout, please contact our support team for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}

