'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Order } from '@/lib/types';
import Link from 'next/link';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refunding, setRefunding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else if (response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (order: Order, fullRefund: boolean = true) => {
    if (!confirm(`Are you sure you want to ${fullRefund ? 'fully' : 'partially'} refund this order?`)) {
      return;
    }

    setRefunding(order._id!);
    setError(null);

    try {
      const response = await fetch('/api/stripe/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId: order.paymentIntentId,
          amount: fullRefund ? undefined : (order.amount || 0) * 0.5, // Example: 50% partial refund
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Refresh orders
        await fetchOrders();
        alert(`Refund processed successfully! Amount: $${(data.refund?.amount || 0).toFixed(2)}`);
      } else {
        setError(data.error || 'Failed to process refund');
      }
    } catch (err) {
      console.error('Refund error:', err);
      setError('An error occurred while processing the refund');
    } finally {
      setRefunding(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-600';
      case 'pending':
        return 'bg-yellow-600';
      case 'failed':
        return 'bg-red-600';
      case 'refunded':
        return 'bg-gray-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'Successful';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      case 'refunded':
        return 'Refunded';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-black">
        <p className="text-gray-400">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-black py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-white">Payment Status</h1>
          <Link
            href="/store"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Continue Shopping
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-900/50 border border-red-700 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-12 text-center">
            <p className="mb-4 text-xl text-gray-400">No orders found</p>
            <Link
              href="/store"
              className="inline-block rounded-md bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="rounded-lg border border-gray-800 bg-gray-900 p-6"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${getStatusColor(order.status)}`}
                      >
                        {getStatusText(order.status)}
                      </span>
                      {order.refunded && (
                        <span className="rounded-full bg-gray-600 px-3 py-1 text-xs font-semibold text-white">
                          Refunded
                        </span>
                      )}
                    </div>
                    <p className="mb-1 text-sm text-gray-400">
                      Order ID: {order.paymentIntentId?.substring(0, 20) || 'N/A'}...
                    </p>
                    <p className="mb-1 text-lg font-semibold text-white">
                      ${(order.amount || 0).toFixed(2)} {(order.currency || 'usd').toUpperCase()}
                    </p>
                    {order.refundAmount && order.refundAmount > 0 && (
                      <p className="mb-1 text-sm text-gray-400">
                        Refunded: ${(order.refundAmount || 0).toFixed(2)}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString()
                        : 'N/A'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 md:items-end">
                    {order.status === 'succeeded' && !order.refunded && (
                      <>
                        <button
                          onClick={() => handleRefund(order, true)}
                          disabled={refunding === order._id}
                          className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {refunding === order._id ? 'Processing...' : 'Full Refund'}
                        </button>
                        <button
                          onClick={() => handleRefund(order, false)}
                          disabled={refunding === order._id}
                          className="rounded-md border border-red-600 bg-transparent px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-600/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {refunding === order._id ? 'Processing...' : 'Partial Refund (50%)'}
                        </button>
                      </>
                    )}
                    {order.status === 'refunded' && (
                      <span className="text-sm text-gray-400">Refund completed</span>
                    )}
                    {order.status === 'failed' && (
                      <span className="text-sm text-gray-400">Payment failed</span>
                    )}
                    {order.status === 'pending' && (
                      <span className="text-sm text-gray-400">Processing...</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

