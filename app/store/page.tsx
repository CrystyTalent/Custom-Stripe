import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AddToCartButton from '@/components/AddToCartButton';

// Mock product data
const products = [
  {
    id: 1,
    name: 'Premium Headphones',
    price: 199.99,
    description: 'High-quality wireless headphones with noise cancellation',
    image: '🎧',
  },
  {
    id: 2,
    name: 'Smart Watch',
    price: 299.99,
    description: 'Feature-rich smartwatch with health tracking',
    image: '⌚',
  },
  {
    id: 3,
    name: 'Wireless Mouse',
    price: 49.99,
    description: 'Ergonomic wireless mouse with precision tracking',
    image: '🖱️',
  },
  {
    id: 4,
    name: 'Mechanical Keyboard',
    price: 149.99,
    description: 'RGB mechanical keyboard with customizable keys',
    image: '⌨️',
  },
  {
    id: 5,
    name: 'USB-C Hub',
    price: 79.99,
    description: 'Multi-port USB-C hub for all your devices',
    image: '🔌',
  },
  {
    id: 6,
    name: 'Laptop Stand',
    price: 39.99,
    description: 'Adjustable aluminum laptop stand for better ergonomics',
    image: '💻',
  },
  {
    id: 7,
    name: 'Webcam HD',
    price: 89.99,
    description: '1080p HD webcam with auto-focus and microphone',
    image: '📹',
  },
  {
    id: 8,
    name: 'Desk Lamp',
    price: 59.99,
    description: 'LED desk lamp with adjustable brightness and color temperature',
    image: '💡',
  },
];

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
                <AddToCartButton
                  productId={product.id}
                  productName={product.name}
                  productPrice={product.price}
                  productImage={product.image}
                />
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

