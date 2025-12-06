export interface User {
  _id?: string;
  username: string;
  email: string;
  password: string;
  createdAt?: Date;
}

export interface Session {
  userId: string;
  email: string;
  username: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
}

export interface CartItem {
  _id?: string;
  userId: string;
  productId: number;
  quantity: number;
  product: Product;
  createdAt?: Date;
  updatedAt?: Date;
}

export type OrderStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

export interface Order {
  _id?: string;
  userId: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  refunded?: boolean;
  refundAmount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

