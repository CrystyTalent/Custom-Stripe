import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
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
    const payments = db.collection('payments');

    // Check if a specific order ID is requested
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');

    if (orderId) {
      // Get specific order by paymentId or _id
      let order;
      try {
        // Try to find by _id first (if it's a valid ObjectId)
        let query: any = { userId: session.userId };
        
        // Check if orderId is a valid ObjectId format
        if (ObjectId.isValid(orderId)) {
          query._id = new ObjectId(orderId);
        } else {
          // If not a valid ObjectId, search by paymentId
          query.paymentId = orderId;
        }
        
        order = await payments.findOne(query);
        
        // If not found and we searched by _id, try paymentId as fallback
        if (!order && ObjectId.isValid(orderId)) {
          order = await payments.findOne({
            paymentId: orderId,
            userId: session.userId
          });
        }
      } catch (error) {
        console.error('Error finding order:', error);
        return NextResponse.json(
          { error: 'Invalid order ID' },
          { status: 400 }
        );
      }

      if (!order) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      // Convert amount from cents to dollars
      const totalAmount = (order.amount / 100).toFixed(2);

      return NextResponse.json({
        order: {
          _id: order._id?.toString(),
          paymentId: order.paymentId,
          orderId: order.metadata,
          amount: totalAmount,
          currency: order.currency,
          email: order.email,
          name: order.name,
          description: order.description,
          createdAt: order.createdAt,
          cartItems: order.cartItems,
          state: order.state || 'pending'
        }
      }, { status: 200 });
    }

    // Get all orders for the user
    const allOrders = await payments
      .find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .toArray();

    // Convert orders to response format
    const orders = allOrders.map(order => {
      const totalAmount = (order.amount / 100).toFixed(2);
      return {
        _id: order._id?.toString(),
        paymentId: order.paymentId,
        orderId: order.metadata,
        amount: totalAmount,
        currency: order.currency,
        email: order.email,
        name: order.name,
        description: order.description,
        createdAt: order.createdAt,
        state: order.state || 'pending'
      };
    });

    return NextResponse.json({
      orders
    }, { status: 200 });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

