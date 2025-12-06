import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    let client;
    try {
      client = await clientPromise;
    } catch (dbError) {
      console.error('MongoDB connection error:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const dbName = process.env.MONGODB_DB_NAME as string;
    const db = client.db(dbName);
    const cart = db.collection('cart');

    // Get all cart items for user
    const cartItems = await cart.find({ userId: session.userId }).toArray();

    // Calculate total
    const total = cartItems.reduce((sum, item) => {
      return sum + (item.productPrice * item.quantity);
    }, 0);

    return NextResponse.json(
      { items: cartItems, total: total },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get cart error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

