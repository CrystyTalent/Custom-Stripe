import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { getProductById } from '@/lib/products';
import { CartItem } from '@/lib/types';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB_NAME as string;
    const db = client.db(dbName);
    const cart = db.collection('cart');

    // Get all cart items for user
    const cartItems = await cart
      .find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .toArray();

    // Enrich with product data
    const enrichedItems = cartItems
      .map((item) => {
        const product = getProductById(item.productId);
        if (!product) {
          return null; // Filter out items with invalid products
        }
        return {
          _id: item._id.toString(),
          userId: item.userId,
          productId: item.productId,
          quantity: item.quantity,
          product: product,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        } as CartItem;
      })
      .filter((item): item is CartItem => item !== null);

    // Calculate total
    const total = enrichedItems.reduce((sum, item) => {
      return sum + (item.product?.price || 0) * (item.quantity || 0);
    }, 0);

    return NextResponse.json({
      items: enrichedItems,
      total: total,
      itemCount: enrichedItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
    });
  } catch (error) {
    console.error('Get cart error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

