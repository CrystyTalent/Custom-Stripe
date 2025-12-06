import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { products } from '@/lib/products';
import AddToCartButton from '@/components/AddToCartButton';

export default async function StorePage() {
  const session = await getSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-black py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Store</h1>
          <p className="text-gray-400">Welcome, {session.username}! Browse our products below.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="group rounded-lg border border-gray-800 bg-gray-900 p-6 transition-all hover:border-gray-700 hover:shadow-lg hover:shadow-blue-500/10"
            >
              <div className="mb-4 flex h-48 items-center justify-center rounded-md bg-gray-800 text-6xl transition-transform group-hover:scale-105">
                {product.image}
              </div>
              
              <h3 className="mb-2 text-xl font-semibold text-white">{product.name}</h3>
              
              <p className="mb-4 text-sm text-gray-400 line-clamp-2">
                {product.description}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-white">
                  ${product.price.toFixed(2)}
                </span>
                <AddToCartButton productId={product.id} />
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-xl text-gray-400">No products available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}

