import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { Order } from '@/lib/types';

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
    const orders = db.collection('orders');

    // Get all orders for user
    const userOrders = await orders
      .find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .toArray();

    const formattedOrders: Order[] = userOrders.map((order) => ({
      _id: order._id.toString(),
      userId: order.userId,
      paymentIntentId: order.paymentIntentId,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      refunded: order.refunded || false,
      refundAmount: order.refundAmount || 0,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    return NextResponse.json({ orders: formattedOrders });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

