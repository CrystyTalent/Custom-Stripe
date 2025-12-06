# Public Checkout API Documentation

This API allows external websites to integrate our payment processing system.

## Authentication

All API requests require a global API key. Include it in one of these ways:

- Header: `X-API-Key: your_global_api_key`
- Header: `Authorization: Bearer your_global_api_key`

**Setup:** Set `PUBLIC_API_KEY` in your `.env.local` file. This single key is used for all public API requests.

## Base URL

```
https://yourdomain.com/api/public
```

## Endpoints

### 1. Create Checkout

Create a payment intent for processing a payment.

**Endpoint:** `POST /api/public/checkout`

**Headers:**
```
Content-Type: application/json
X-API-Key: your_api_key_here
```

**Request Body:**
```json
{
  "amount": 100.00,
  "currency": "usd",
  "email": "customer@example.com",
  "metadata": {
    "orderId": "12345",
    "customerName": "John Doe"
  }
}
```

**Response:**
```json
{
  "success": true,
  "paymentIntentId": "pi_1234567890",
  "clientSecret": "pi_1234567890_secret_xxx",
  "amount": 100.00,
  "currency": "usd"
}
```

### 2. Check Payment Status

Check the status of a payment.

**Endpoint:** `GET /api/public/payment-status?paymentIntentId=pi_xxx`

**Headers:**
```
X-API-Key: your_api_key_here
```

**Response:**
```json
{
  "paymentIntentId": "pi_1234567890",
  "status": "succeeded",
  "amount": 100.00,
  "currency": "usd",
  "refunded": false,
  "refundAmount": 0,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Status Values:**
- `pending` - Payment is being processed
- `succeeded` - Payment completed successfully
- `failed` - Payment failed
- `refunded` - Payment has been refunded

### 3. Refund Payment

Refund a payment (full or partial).

**Endpoint:** `POST /api/public/refund`

**Headers:**
```
Content-Type: application/json
X-API-Key: your_api_key_here
```

**Request Body (Full Refund):**
```json
{
  "paymentIntentId": "pi_1234567890"
}
```

**Request Body (Partial Refund):**
```json
{
  "paymentIntentId": "pi_1234567890",
  "amount": 50.00
}
```

**Response:**
```json
{
  "success": true,
  "refund": {
    "id": "re_1234567890",
    "amount": 50.00,
    "status": "succeeded"
  },
  "order": {
    "status": "succeeded",
    "refundAmount": 50.00
  }
}
```

## Integration Examples

### JavaScript/React

```javascript
// Create checkout
async function createCheckout(amount, email, apiKey) {
  const response = await fetch('https://yourdomain.com/api/public/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({
      amount: amount,
      email: email,
      currency: 'usd',
    }),
  });
  
  const data = await response.json();
  
  if (data.clientSecret) {
    // Use with Stripe.js to process payment
    return data.clientSecret;
  } else {
    throw new Error(data.error);
  }
}

// Check payment status
async function checkPaymentStatus(paymentIntentId, apiKey) {
  const response = await fetch(
    `https://yourdomain.com/api/public/payment-status?paymentIntentId=${paymentIntentId}`,
    {
      headers: {
        'X-API-Key': apiKey,
      },
    }
  );
  
  return await response.json();
}

// Process refund
async function refundPayment(paymentIntentId, amount, apiKey) {
  const response = await fetch('https://yourdomain.com/api/public/refund', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({
      paymentIntentId: paymentIntentId,
      ...(amount && { amount: amount }),
    }),
  });
  
  return await response.json();
}
```

### cURL Examples

```bash
# Create checkout
curl -X POST https://yourdomain.com/api/public/checkout \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here" \
  -d '{
    "amount": 100.00,
    "email": "customer@example.com",
    "currency": "usd"
  }'

# Check status
curl -X GET "https://yourdomain.com/api/public/payment-status?paymentIntentId=pi_xxx" \
  -H "X-API-Key: your_api_key_here"

# Full refund
curl -X POST https://yourdomain.com/api/public/refund \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here" \
  -d '{
    "paymentIntentId": "pi_xxx"
  }'

# Partial refund
curl -X POST https://yourdomain.com/api/public/refund \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here" \
  -d '{
    "paymentIntentId": "pi_xxx",
    "amount": 50.00
  }'
```

## Using with Stripe.js

After getting the `clientSecret` from the checkout endpoint, use it with Stripe.js:

```javascript
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_your_publishable_key');

// In your component
const stripe = useStripe();
const elements = useElements();

// Confirm payment
const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: elements.getElement(CardElement),
    billing_details: {
      email: 'customer@example.com',
    },
  },
});
```

## Error Handling

All endpoints return standard HTTP status codes:

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid or missing API key)
- `404` - Not Found (payment/order not found)
- `500` - Internal Server Error

Error responses include an error message:

```json
{
  "error": "Error message here"
}
```

## Rate Limiting

API requests are subject to rate limiting. Contact support for higher limits.

## Webhooks

You can also receive payment status updates via webhooks. Contact support to set up webhook endpoints.

## Support

For API key generation and support, contact: support@yourdomain.com

