export interface User {
  _id?: string;
  username: string;
  email: string;
  password: string;
  productionApiKey?: string;
  webhookSecret?: string;
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
  productName: string;
  productPrice: number;
  productImage: string;
  quantity: number;
  addedAt?: Date;
}

export interface PaymentCartItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}

export interface Payment {
  _id?: string;
  paymentId: string;
  amount: number;
  currency: string;
  email: string;
  name: string;
  description: string;
  success_url: string;
  metadata: string;
  createdAt: Date;
  userId: string;
  state: string;
}