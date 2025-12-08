import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId, productName, productPrice, productImage, quantity = 1 } = body;

    // Validate input
    if (!productId || !productName || productPrice === undefined || !productImage) {
      return NextResponse.json(
        { error: 'Missing required product information' },
        { status: 400 }
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

    // Check if item already exists in cart
    const existingItem = await cart.findOne({
      userId: session.userId,
      productId: productId,
    });

    if (existingItem) {
      // Update quantity
      await cart.updateOne(
        { userId: session.userId, productId: productId },
        { $inc: { quantity: quantity } }
      );
      
      return NextResponse.json(
        { message: 'Cart updated successfully', updated: true },
        { status: 200 }
      );
    } else {
      // Add new item
      const result = await cart.insertOne({
        userId: session.userId,
        productId: productId,
        productName: productName,
        productPrice: productPrice,
        productImage: productImage,
        quantity: quantity,
        addedAt: new Date(),
      });

      return NextResponse.json(
        { message: 'Item added to cart successfully', itemId: result.insertedId },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Add to cart error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

