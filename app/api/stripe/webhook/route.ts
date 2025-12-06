import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import clientPromise from '@/lib/mongodb';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  // Handle the event
  const client = await clientPromise;
  const dbName = process.env.MONGODB_DB_NAME as string;
  const db = client.db(dbName);
  const orders = db.collection('orders');

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('PaymentIntent succeeded:', paymentIntent.id);
      
      // Update order status
      await orders.updateOne(
        { paymentIntentId: paymentIntent.id },
        {
          $set: {
            status: 'succeeded',
            updatedAt: new Date(),
          },
        }
      );
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object as Stripe.PaymentIntent;
      console.log('PaymentIntent failed:', failedPayment.id);
      
      // Update order status
      await orders.updateOne(
        { paymentIntentId: failedPayment.id },
        {
          $set: {
            status: 'failed',
            updatedAt: new Date(),
          },
        }
      );
      break;

    case 'payment_intent.canceled':
      const canceledPayment = event.data.object as Stripe.PaymentIntent;
      console.log('PaymentIntent canceled:', canceledPayment.id);
      
      // Update order status
      await orders.updateOne(
        { paymentIntentId: canceledPayment.id },
        {
          $set: {
            status: 'failed',
            updatedAt: new Date(),
          },
        }
      );
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

