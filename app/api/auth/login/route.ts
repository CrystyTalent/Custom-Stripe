import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { setSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.toLowerCase().trim();

    // Connect to MongoDB
    let client;
    try {
      client = await clientPromise;
    } catch (dbError) {
      console.error('MongoDB connection error:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed. Please check your MongoDB connection.' },
        { status: 500 }
      );
    }

    // Get database - extract from URI or use default
    const dbName = process.env.MONGODB_DB_NAME as string;
    const db = client.db(dbName);
    const users = db.collection('users');

    // Find user by email
    const user = await users.findOne({ email: trimmedEmail });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session
    await setSession({
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
    });

    return NextResponse.json(
      { message: 'Login successful', userId: user._id.toString() },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Mongo') || error.message.includes('connection')) {
        return NextResponse.json(
          { error: 'Database connection failed. Please check your MongoDB connection string.' },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
