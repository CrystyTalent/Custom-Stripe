import { NextResponse } from 'next/server';

export async function GET() {
  const docs = {
    title: 'Public Checkout API Documentation',
    version: '1.0.0',
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://yourdomain.com',
    authentication: {
      method: 'API Key',
      header: 'X-API-Key',
      alternativeHeader: 'Authorization: Bearer <api_key>',
      description: 'Include your API key in the request header',
    },
    endpoints: {
      checkout: {
        method: 'POST',
        path: '/api/public/checkout',
        description: 'Create a payment intent for checkout',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'your_api_key',
        },
        body: {
          amount: 'number (required) - Payment amount',
          currency: 'string (optional) - Currency code, default: "usd"',
          email: 'string (required) - Customer email',
          metadata: 'object (optional) - Additional metadata',
        },
        response: {
          success: true,
          paymentIntentId: 'string',
          clientSecret: 'string',
          amount: 'number',
          currency: 'string',
        },
        example: {
          request: {
            amount: 100.00,
            currency: 'usd',
            email: 'customer@example.com',
            metadata: {
              orderId: '12345',
              customerName: 'John Doe',
            },
          },
          response: {
            success: true,
            paymentIntentId: 'pi_1234567890',
            clientSecret: 'pi_1234567890_secret_xxx',
            amount: 100.00,
            currency: 'usd',
          },
        },
      },
      paymentStatus: {
        method: 'GET',
        path: '/api/public/payment-status?paymentIntentId=pi_xxx',
        description: 'Check the status of a payment',
        queryParams: {
          paymentIntentId: 'string (required) - Payment intent ID',
        },
        response: {
          paymentIntentId: 'string',
          status: 'pending | succeeded | failed | refunded',
          amount: 'number',
          currency: 'string',
          refunded: 'boolean',
          refundAmount: 'number',
          createdAt: 'string',
          updatedAt: 'string',
        },
      },
      refund: {
        method: 'POST',
        path: '/api/public/refund',
        description: 'Refund a payment (full or partial)',
        body: {
          paymentIntentId: 'string (required) - Payment intent ID',
          amount: 'number (optional) - Partial refund amount, omit for full refund',
        },
        response: {
          success: true,
          refund: {
            id: 'string',
            amount: 'number',
            status: 'string',
          },
          order: {
            status: 'string',
            refundAmount: 'number',
          },
        },
      },
    },
    integration: {
      javascript: `
// Example: Create checkout
async function createCheckout(amount, email) {
  const response = await fetch('https://yourdomain.com/api/public/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'your_api_key_here',
    },
    body: JSON.stringify({
      amount: amount,
      email: email,
      currency: 'usd',
    }),
  });
  
  const data = await response.json();
  return data.clientSecret; // Use with Stripe.js
}

// Example: Check payment status
async function checkStatus(paymentIntentId) {
  const response = await fetch(
    \`https://yourdomain.com/api/public/payment-status?paymentIntentId=\${paymentIntentId}\`,
    {
      headers: {
        'X-API-Key': 'your_api_key_here',
      },
    }
  );
  
  return await response.json();
}
      `,
      curl: `
# Create checkout
curl -X POST https://yourdomain.com/api/public/checkout \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your_api_key_here" \\
  -d '{
    "amount": 100.00,
    "email": "customer@example.com",
    "currency": "usd"
  }'

# Check status
curl -X GET "https://yourdomain.com/api/public/payment-status?paymentIntentId=pi_xxx" \\
  -H "X-API-Key: your_api_key_here"
      `,
    },
    webhooks: {
      description: 'You can also set up webhooks to receive payment status updates',
      endpoint: '/api/stripe/webhook',
      events: ['payment_intent.succeeded', 'payment_intent.payment_failed'],
    },
  };

  return NextResponse.json(docs);
}

