'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
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

type FilterStatus = 'all' | 'completed' | 'pending' | 'failed';

export default function OrderPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [refundingId, setRefundingId] = useState<string | null>(null);

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
    setError(null);
    try {
      const response = await fetch(`/api/orders?id=${encodeURIComponent(orderId)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.order) {
          setSelectedOrder(data.order);
          setError(null);
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
      const orderId = order._id || order.paymentId;
      fetchOrderDetails(orderId);
    } else {
      setSelectedOrder(order);
    }
  };

  const handleRefund = async (paymentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to refund this payment?')) {
      return;
    }

    setRefundingId(paymentId);
    try {
      const response = await fetch(`/api/orders/${paymentId}/refund`, {
        method: 'POST',
      });

      if (response.ok) {
        // Refresh orders list
        await fetchOrders();
        if (selectedOrder && selectedOrder.paymentId === paymentId) {
          // Update selected order if it's the one being refunded
          const updatedOrder = { ...selectedOrder, state: 'refunded' };
          setSelectedOrder(updatedOrder);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to process refund');
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      alert('Failed to process refund. Please try again.');
    } finally {
      setRefundingId(null);
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
    const lowerState = state.toLowerCase();
    switch (lowerState) {
      case 'completed':
      case 'paid':
        return 'bg-green-600';
      case 'pending':
        return 'bg-yellow-600';
      case 'failed':
      case 'cancelled':
        return 'bg-red-600';
      case 'refunded':
        return 'bg-purple-600';
      default:
        return 'bg-gray-600';
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = orders.length;
    const completed = orders.filter(o => ['completed', 'paid'].includes(o.state?.toLowerCase())).length;
    const pending = orders.filter(o => o.state?.toLowerCase() === 'pending').length;
    const failed = orders.filter(o => ['failed', 'cancelled'].includes(o.state?.toLowerCase())).length;
    const totalRevenue = orders
      .filter(o => ['completed', 'paid'].includes(o.state?.toLowerCase()))
      .reduce((sum, o) => sum + parseFloat(o.amount || '0'), 0);

    return { total, completed, pending, failed, totalRevenue };
  }, [orders]);

  // Filter orders based on selected status
  const filteredOrders = useMemo(() => {
    if (filterStatus === 'all') return orders;
    if (filterStatus === 'completed') {
      return orders.filter(o => ['completed', 'paid'].includes(o.state?.toLowerCase()));
    }
    if (filterStatus === 'pending') {
      return orders.filter(o => o.state?.toLowerCase() === 'pending');
    }
    if (filterStatus === 'failed') {
      return orders.filter(o => ['failed', 'cancelled'].includes(o.state?.toLowerCase()));
    }
    return orders;
  }, [orders, filterStatus]);

  const isRefundable = (state: string | undefined | null) => {
    if (!state) return false;
    const lowerState = state.toLowerCase();
    return ['completed', 'paid'].includes(lowerState);
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-black">
        <p className="text-gray-400">Loading Orders...</p>
      </div>
    );
  }

  // Show order details view
  if (selectedOrder) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-black py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6">
            <button
              onClick={() => {
                setSelectedOrder(null);
                setError(null);
              }}
              className="mb-4 text-blue-400 hover:text-blue-300 transition-colors"
            >
              ← Back to Payments
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
                Back to Payments
              </button>
              {selectedOrder.state === 'pending' ? (
                <Link
                  href={`/v1/payments/${selectedOrder.paymentId}`}
                  className="rounded-md bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 text-center"
                >
                  Complete Payment
                </Link>
              ) : isRefundable(selectedOrder.state) ? (
                <button
                  onClick={() => handleRefund(selectedOrder.paymentId, {} as React.MouseEvent)}
                  disabled={refundingId === selectedOrder.paymentId}
                  className="rounded-md bg-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {refundingId === selectedOrder.paymentId ? 'Processing...' : 'Refund'}
                </button>
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

  // Main Payment Dashboard view
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-black py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">Payment Dashboard</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
            <p className="text-sm text-gray-400 mb-2">Total Payments</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
            <p className="text-sm text-gray-400 mb-2">Completed</p>
            <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
            <p className="text-sm text-gray-400 mb-2">Pending</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
            <p className="text-sm text-gray-400 mb-2">Failed</p>
            <p className="text-2xl font-bold text-red-400">{stats.failed}</p>
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
            <p className="text-sm text-gray-400 mb-2">Total Revenue</p>
            <p className="text-2xl font-bold text-white">${stats.totalRevenue.toFixed(2)}</p>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-6 mb-6 border-b border-gray-800">
          <button
            onClick={() => setFilterStatus('all')}
            className={`pb-3 px-1 font-medium transition-colors ${
              filterStatus === 'all'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`pb-3 px-1 font-medium transition-colors ${
              filterStatus === 'completed'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`pb-3 px-1 font-medium transition-colors ${
              filterStatus === 'pending'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilterStatus('failed')}
            className={`pb-3 px-1 font-medium transition-colors ${
              filterStatus === 'failed'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Failed
          </button>
        </div>

        {/* Transactions List */}
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No payments found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-800 bg-gray-800 hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => handleOrderClick(order)}
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Payment ID</p>
                      <p className="text-white font-mono text-sm">{order.paymentId.substring(0, 12)}...</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Description</p>
                      <p className="text-white truncate max-w-xs">{order.description}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Date</p>
                      <p className="text-white text-sm">{formatDate(order.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Amount</p>
                      <p className="text-white font-semibold">${order.amount} {order.currency.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.state)} text-white`}>
                      {(order.state || 'UNKNOWN').toUpperCase()}
                    </span>
                    {isRefundable(order.state) && (
                      <button
                        onClick={(e) => handleRefund(order.paymentId, e)}
                        disabled={refundingId === order.paymentId}
                        className="px-4 py-2 rounded-md bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {refundingId === order.paymentId ? 'Processing...' : 'Refund'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
