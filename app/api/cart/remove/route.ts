import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cartItemId = searchParams.get('id');

    if (!cartItemId) {
      return NextResponse.json(
        { error: 'Cart item ID is required' },
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

    // Remove item
    await cart.deleteOne({ _id: objectId });

    return NextResponse.json(
      { message: 'Item removed from cart successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Remove from cart error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

