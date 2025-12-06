import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { cartItemId, quantity } = body;

    if (!cartItemId || quantity === undefined) {
      return NextResponse.json(
        { error: 'Cart item ID and quantity are required' },
        { status: 400 }
      );
    }

    if (quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be at least 1' },
        { status: 400 }
      );
    }

    let objectId;
    try {
      objectId = new ObjectId(cartItemId);
    } catch {
      return NextResponse.json(
        { error: 'Invalid cart item ID' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB_NAME as string;
    const db = client.db(dbName);
    const cart = db.collection('cart');

    // Verify the item belongs to the user
    const item = await cart.findOne({
      _id: objectId,
      userId: session.userId,
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }

    // Update quantity
    await cart.updateOne(
      { _id: objectId },
      {
        $set: {
          quantity: quantity,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json(
      { message: 'Cart updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update cart error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

