'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CartIcon() {
  const [itemCount, setItemCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCartCount = async () => {
      try {
        const response = await fetch('/api/cart');
        if (response.ok) {
          const data = await response.json();
          setItemCount(data.itemCount || 0);
        }
      } catch (error) {
        console.error('Error fetching cart count:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCartCount();
    
    // Refresh cart count periodically
    const interval = setInterval(fetchCartCount, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return null;
  }

  return (
    <Link
      href="/cart"
      className="relative rounded-md px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
    >
      <span className="flex items-center gap-2">
        🛒 Cart
        {itemCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </span>
    </Link>
  );
}

