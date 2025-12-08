'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// import { NextResponse } from 'next/server';

interface CartItem {
  _id: string;
  productId: number;
  productName: string;
  productPrice: number;
  productImage: string;
  quantity: number;
}

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart');
      if (response.ok) {
        const data = await response.json();
        setCartItems(data.items || []);
        setTotal(data.total || 0);
      } else if (response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/cart/remove?itemId=${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCart();
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setUpdating(itemId);
    try {
      const response = await fetch('/api/cart/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId, quantity: newQuantity }),
      });

      if (response.ok) {
        fetchCart();
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setUpdating(null);
    }
  };

  const handleCheckout = async () => {
    const response = await fetch('/api/payments', {
      method: 'POST',
      body: JSON.stringify({ metadata: { order_id: Date.now() } }),
    });
    const data = await response.json();
    console.log(data);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-black">
        <p className="text-gray-400">Loading Cart...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-black py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Shopping Cart</h1>
          {cartItems.length === 0 ? (
            <p className="text-gray-400">Your cart is empty.</p>
          ) : (
            <p className="text-gray-400">{cartItems.length} item(s) in your cart</p>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-xl text-gray-400 mb-4">Your cart is empty</p>
            <Link
              href="/store"
              className="rounded-md bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-8">
              {cartItems.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center gap-4 rounded-lg border border-gray-800 bg-gray-900 p-4"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-md bg-gray-800 text-3xl">
                    {item.productImage}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{item.productName}</h3>
                    <p className="text-gray-400">${item.productPrice.toFixed(2)} each</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                        disabled={updating === item._id || item.quantity <= 1}
                        className="rounded-md border border-gray-700 bg-gray-800 px-3 py-1 text-white transition-colors hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        −
                      </button>
                      <span className="w-12 text-center text-white">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                        disabled={updating === item._id}
                        className="rounded-md border border-gray-700 bg-gray-800 px-3 py-1 text-white transition-colors hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>

                    <div className="w-24 text-right">
                      <p className="text-lg font-bold text-white">
                        ${(item.productPrice * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item._id)}
                      className="rounded-md bg-red-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xl font-semibold text-white">Total:</span>
                <span className="text-3xl font-bold text-white">${total.toFixed(2)}</span>
              </div>
              <div className="flex gap-4">
                <Link
                  href="/store"
                  className="flex-1 rounded-md border border-gray-700 bg-gray-800 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-gray-700"
                >
                  Continue Shopping
                </Link>
                <button
                  className="flex-1 rounded-md bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? 'Processing...' : 'Checkout'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

