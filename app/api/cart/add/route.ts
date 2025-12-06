import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { getProductById } from '@/lib/products';

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
    const { productId, quantity = 1 } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Verify product exists
    const product = getProductById(productId);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be at least 1' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
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
      const newQuantity = existingItem.quantity + quantity;
      await cart.updateOne(
        { _id: existingItem._id },
        {
          $set: {
            quantity: newQuantity,
            updatedAt: new Date(),
          },
        }
      );

      return NextResponse.json(
        { message: 'Cart updated successfully', quantity: newQuantity },
        { status: 200 }
      );
    } else {
      // Add new item
      const result = await cart.insertOne({
        userId: session.userId,
        productId: productId,
        quantity: quantity,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return NextResponse.json(
        { message: 'Item added to cart successfully', cartItemId: result.insertedId },
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

