'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CartIcon() {
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    const fetchCartCount = async () => {
      try {
        const response = await fetch('/api/cart');
        if (response.ok) {
          const data = await response.json();
          const count = data.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
          setItemCount(count);
        }
      } catch (error) {
        console.error('Error fetching cart count:', error);
      }
    };

    fetchCartCount();
    // Refresh cart count every 5 seconds
    const interval = setInterval(fetchCartCount, 5000);
    return () => clearInterval(interval);
  }, []);

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

