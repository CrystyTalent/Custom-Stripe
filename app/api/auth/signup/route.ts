import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { setSession } from '@/lib/auth';
import { generateApiKeys } from '@/lib/api-keys';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password } = body;

    // Validate input
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Trim and validate
    const trimmedUsername = username.trim();
    const trimmedEmail = email.toLowerCase().trim();

    if (!trimmedUsername || !trimmedEmail || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
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
        { error: 'Database connection failed. Please check your MongoDB connection.' },
        { status: 500 }
      );
    }

    // Get database - extract from URI or use default
    const dbName = process.env.MONGODB_DB_NAME as string;
    const db = client.db(dbName);
    const users = db.collection('users');

    // Check if user already exists
    const existingUser = await users.findOne({
      $or: [{ email: trimmedEmail }],
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate API keys
    const { productionApiKey, webhookSecret } = generateApiKeys();

    // Create user
    const result = await users.insertOne({
      username: trimmedUsername,
      email: trimmedEmail,
      password: hashedPassword,
      productionApiKey,
      webhookSecret,
      createdAt: new Date(),
    });

    // Create session
    await setSession({
      userId: result.insertedId.toString(),
      email: trimmedEmail,
      username: trimmedUsername,
    });

    return NextResponse.json(
      { message: 'User created successfully', userId: result.insertedId.toString() },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    
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
