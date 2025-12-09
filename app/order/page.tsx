'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface OrderItem {
  productId: number;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  paymentId: string;
  orderId: string;
  amount: string;
  currency: string;
  email: string;
  username: string;
  description: string;
  createdAt: string;
  cartItems?: OrderItem[];
  state: string;
}

export default function OrderPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else if (response.status === 401) {
        router.push('/login');
      } else if (response.status === 404) {
        setError('No orders found');
      } else {
        setError('Failed to load orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const fetchOrderDetails = async (orderId: string) => {
    setLoadingDetails(true);
    setError(null); // Clear any previous errors
    try {
      const response = await fetch(`/api/orders?id=${encodeURIComponent(orderId)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.order) {
          setSelectedOrder(data.order);
          setError(null); // Clear error on success
        } else {
          console.error('Order data not found in response');
          setError('Failed to load order details');
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to fetch order details:', response.status, errorData);
        setError(errorData.error || 'Failed to load order details');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError('Failed to load order details. Please try again.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOrderClick = (order: Order) => {
    if (!order.cartItems) {
      // Use _id if available, otherwise use paymentId
      const orderId = order._id || order.paymentId;
      fetchOrderDetails(orderId);
    } else {
      setSelectedOrder(order);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (state: string | undefined | null) => {
    if (!state || typeof state !== 'string') {
      return 'bg-gray-600';
    }
    switch (state.toLowerCase()) {
      case 'completed':
      case 'paid':
        return 'bg-green-600';
      case 'pending':
        return 'bg-yellow-600';
      case 'failed':
      case 'cancelled':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-black">
        <p className="text-gray-400">Loading Orders...</p>
      </div>
    );
  }

  // Show order details modal
  if (selectedOrder) {
    
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-black py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Header with back button */}
          <div className="mb-6">
            <button
              onClick={() => {
                setSelectedOrder(null);
                setError(null);
              }}
              className="mb-4 text-blue-400 hover:text-blue-300 transition-colors"
            >
              ← Back to Orders
            </button>
            {error && (
              <div className="mb-4 rounded-lg border border-red-800 bg-red-900/50 p-4">
                <p className="text-red-300">{error}</p>
              </div>
            )}
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-4xl font-bold text-white">Order Details</h1>
              <span className={`rounded-full px-4 py-2 text-sm font-semibold text-white ${getStatusColor(selectedOrder.state)}`}>
                {(selectedOrder.state || 'UNKNOWN').toUpperCase()}
              </span>
            </div>
          </div>

          {/* Order Information */}
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Order Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Order ID</p>
                <p className="text-white font-mono">{selectedOrder.orderId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Payment ID</p>
                <p className="text-white font-mono text-sm">{selectedOrder.paymentId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Order Date</p>
                <p className="text-white">{formatDate(selectedOrder.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Email</p>
                <p className="text-white">{selectedOrder.email}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          {selectedOrder.cartItems && selectedOrder.cartItems.length > 0 && (
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Order Items</h2>
              <div className="space-y-4">
                {selectedOrder.cartItems.map((item, index) => (
                  <div
                    key={`${item.productId}-${index}`}
                    className="flex items-center gap-4 rounded-lg border border-gray-800 bg-gray-800 p-4"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-md bg-gray-700 text-2xl">
                      {item.productImage}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">{item.productName}</h3>
                      <p className="text-gray-400">Quantity: {item.quantity}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-white">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-400">${item.price.toFixed(2)} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
            <div className="space-y-3 mb-4">
              <div className="border-gray-700 pt-3 flex items-center justify-between">
                <span className="text-xl font-semibold text-white">Total</span>
                <span className="text-2xl font-bold text-white">${selectedOrder.amount}</span>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 rounded-md border border-gray-700 bg-gray-800 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-gray-700"
              >
                Back to Orders
              </button>
              {selectedOrder.state === 'pending' ? (
                <Link
                  href={`/v1/payments/${selectedOrder.paymentId}`}
                  className="rounded-md bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 text-center"
                >
                  Pay
                </Link>
              ) : (
                <button
                  onClick={() => window.print()}
                  className="rounded-md bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Print Receipt
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show orders table
  if (error || orders.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-black py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">My Orders</h1>
            <p className="text-gray-400">View all your orders</p>
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">No Orders Found</h2>
            <p className="text-gray-400 mb-6">{error || 'You haven\'t placed any orders yet'}</p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/keys"
                className="rounded-md bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Continue Keys
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-black py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">My Orders</h1>
          <p className="text-gray-400">{orders.length} order(s) found</p>
        </div>

        {/* Orders Table */}
        <div className="rounded-lg border border-gray-800 bg-gray-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Payment ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Total Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Currency
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Create Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    State
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {orders.map((order) => (
                  <tr
                    key={order._id}
                    onClick={() => handleOrderClick(order)}
                    className="hover:bg-gray-800 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-white">{order.paymentId.substring(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{order.username}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300 max-w-xs truncate">{order.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-white">
                        {order.amount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300 uppercase">{order.currency}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{formatDate(order.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white ${getStatusColor(order.state)}`}>
                        {(order.state || 'UNKNOWN').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {loadingDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <p className="text-white">Loading order details...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
