import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import { ObjectId } from 'mongodb';

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
    const users = db.collection('users');

    // Get user with API keys
    let user;
    try {
      user = await users.findOne(
        { _id: new ObjectId(session.userId) },
        { projection: { productionApiKey: 1, webhookSecret: 1, username: 1, email: 1 } }
      );
    } catch (idError) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        productionApiKey: user.productionApiKey || null,
        webhookSecret: user.webhookSecret || null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get API keys error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

