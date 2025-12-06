import { Product } from './types';

// Shared product data
export const products: Product[] = [
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

export function getProductById(id: number): Product | undefined {
  return products.find((p) => p.id === id);
}

