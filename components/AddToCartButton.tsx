'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AddToCartButtonProps {
  productId: number;
  productName: string;
  productPrice: number;
  productImage: string;
}

export default function AddToCartButton({
  productId,
  productName,
  productPrice,
  productImage,
}: AddToCartButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAddToCart = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          productName,
          productPrice,
          productImage,
          quantity: 1,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Added to cart!');
        router.refresh(); // Refresh to update cart count
        setTimeout(() => setMessage(''), 2000);
      } else {
        setMessage(data.error || 'Failed to add to cart');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleAddToCart}
        disabled={loading}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Adding...' : 'Add to Cart'}
      </button>
      {message && (
        <span className={`text-xs ${message.includes('Added') ? 'text-green-400' : 'text-red-400'}`}>
          {message}
        </span>
      )}
    </div>
  );
}

