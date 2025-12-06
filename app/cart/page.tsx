'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CartItem } from '@/lib/types';
import Link from 'next/link';

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

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

  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(cartItemId);
      return;
    }

    setUpdating(cartItemId);
    try {
      const response = await fetch('/api/cart/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cartItemId, quantity: newQuantity }),
      });

      if (response.ok) {
        await fetchCart();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update cart');
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (cartItemId: string) => {
    setUpdating(cartItemId);
    try {
      const response = await fetch(`/api/cart/remove?id=${cartItemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCart();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to remove item');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-black">
        <p className="text-gray-400">Loading cart...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-black py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="mb-8 text-4xl font-bold text-white">Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-12 text-center">
            <p className="mb-4 text-xl text-gray-400">Your cart is empty</p>
            <Link
              href="/store"
              className="inline-block rounded-md bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div
                key={item._id}
                className="rounded-lg border border-gray-800 bg-gray-900 p-6"
              >
                <div className="flex items-center gap-6">
                  <div className="flex h-24 w-24 items-center justify-center rounded-md bg-gray-800 text-4xl">
                    {item.product.image}
                  </div>

                  <div className="flex-1">
                    <h3 className="mb-1 text-xl font-semibold text-white">
                      {item.product.name}
                    </h3>
                    <p className="mb-2 text-sm text-gray-400">
                      {item.product.description}
                    </p>
                    <p className="text-lg font-bold text-white">
                      ${((item.product?.price || 0)).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateQuantity(item._id!, item.quantity - 1)
                        }
                        disabled={updating === item._id}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-700 bg-gray-800 text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
                      >
                        −
                      </button>
                      <span className="w-12 text-center text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item._id!, item.quantity + 1)
                        }
                        disabled={updating === item._id}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-700 bg-gray-800 text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-lg font-semibold text-white">
                      ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                    </p>
                    <button
                      onClick={() => removeItem(item._id!)}
                      disabled={updating === item._id}
                      className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-2xl font-bold text-white">Total</span>
                <span className="text-3xl font-bold text-white">
                  ${total.toFixed(2)}
                </span>
              </div>
              <div className="flex gap-4">
                <Link
                  href="/store"
                  className="flex-1 rounded-md border border-gray-700 bg-gray-800 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-gray-700"
                >
                  Continue Shopping
                </Link>
                <Link
                  href="/checkout"
                  className="flex-1 rounded-md bg-blue-600 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Checkout
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

