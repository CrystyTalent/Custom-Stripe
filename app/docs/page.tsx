export default function DocsPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-black py-12">
      <div className="container mx-auto max-w-4xl px-4">
        <h1 className="mb-8 text-4xl font-bold text-white">Integration Guide</h1>
        
        <div className="space-y-12">
          {/* Overview Section */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-white">Overview</h2>
            <p className="mb-4 text-gray-300 leading-relaxed">
              This guide will help you integrate our payment system into your website. 
              The integration process involves creating a payment on your server using our API, 
              then redirecting your customers to our secure checkout page.
            </p>
          </section>

          {/* Getting Started */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-white">Getting Started</h2>
            <div className="rounded-lg bg-gray-900 p-6">
              <p className="mb-4 text-gray-300">
                Before you begin, make sure you have:
              </p>
              <ul className="ml-6 list-disc space-y-2 text-gray-300">
                <li>Your API key (available in your dashboard)</li>
                <li>Your public checkout URL (provided by your administrator)</li>
                <li>A success URL where customers will be redirected after payment</li>
              </ul>
            </div>
          </section>

          {/* JavaScript/Node.js Integration */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-white">JavaScript/Node.js Integration</h2>
            <p className="mb-4 text-gray-300">
              Use this example to integrate payments in your JavaScript or Node.js application:
            </p>
            <div className="rounded-lg bg-gray-900 p-6">
              <pre className="overflow-x-auto text-sm text-gray-300">
                <code>{`// Create a payment on your server
const response = await fetch('/api/v1/payments', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer payzo_live_7cc5bd8f9b04e2ee0d83c53986d14f6cb383c0d9ae16ae134a26a6455bb0fbf3',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 10000, // $100.00 in cents (required)
    currency: 'usd', // required
    email: 'customer@example.com', // optional
    username: 'John Doe', // optional
    description: 'Order #1234', // optional
    success_url: 'https://yoursite.com/success', // required
    metadata: { order_id: '1234' } // optional - track your orders
  })
})

const data = await response.json()

if (!response.ok) {
  console.error('Payment creation failed:', data.error)
  return
}

// Redirect customer to checkout page
const PublicAPI = 'https://yourdomain.com/v1/payments' // Replace with your checkout base URL
window.location.href = \`\${PublicAPI}/\${data.paymentId}\`;`}</code>
              </pre>
            </div>
          </section>

          {/* PHP Integration */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-white">PHP Integration</h2>
            <p className="mb-4 text-gray-300">
              Use this example to integrate payments in your PHP application:
            </p>
            <div className="rounded-lg bg-gray-900 p-6">
              <pre className="overflow-x-auto text-sm text-gray-300">
                <code>{`<?php
// API endpoint
$url = 'https://yourdomain.com/api/v1/payments';

// Your secret API key
$apiKey = 'payzo_live_7cc5bd8f9b04e2ee0d83c53986d14f6cb383c0d9ae16ae134a26a6455bb0fbf3';

// Payment data
$data = [
    'amount' => 10000,
    'currency' => 'usd',
    'email' => 'customer@example.com',
    'username' => 'John Doe',
    'description' => 'Order #1234',
    'success_url' => 'https://yoursite.com/success',
    'metadata' => [
        'order_id' => '1234'
    ]
];

// Initialize cURL
$ch = curl_init($url);

// Set cURL options
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

// Execute request
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Decode JSON
$result = json_decode($response, true);

// Check response
if ($httpCode !== 200) {
    echo "Payment creation failed: " . ($result['error'] ?? 'Unknown error');
    exit;
}

// Successful → redirect to checkout URL
$PublicAPI = "https://yourdomain.com/v1/payments"; // replace with your checkout base URL
header("Location: {$PublicAPI}/" . $result['paymentId']);
exit;
?>`}</code>
              </pre>
            </div>
          </section>

          {/* API Reference */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-white">API Reference</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-xl font-semibold text-white">Endpoint</h3>
                <div className="rounded-lg bg-gray-900 p-4">
                  <code className="text-sm text-blue-400">POST /api/v1/payments</code>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-xl font-semibold text-white">Authentication</h3>
                <p className="mb-2 text-gray-300">
                  Include your API key in the Authorization header:
                </p>
                <div className="rounded-lg bg-gray-900 p-4">
                  <code className="text-sm text-gray-300">Authorization: Bearer YOUR_API_KEY</code>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-xl font-semibold text-white">Request Parameters</h3>
                <div className="overflow-x-auto rounded-lg bg-gray-900">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="px-4 py-3 text-left text-white">Parameter</th>
                        <th className="px-4 py-3 text-left text-white">Type</th>
                        <th className="px-4 py-3 text-left text-white">Required</th>
                        <th className="px-4 py-3 text-left text-white">Description</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-300">
                      <tr className="border-b border-gray-800">
                        <td className="px-4 py-3 font-mono text-blue-400">amount</td>
                        <td className="px-4 py-3">integer</td>
                        <td className="px-4 py-3">Yes</td>
                        <td className="px-4 py-3">Amount in cents (e.g., 10000 = $100.00)</td>
                      </tr>
                      <tr className="border-b border-gray-800">
                        <td className="px-4 py-3 font-mono text-blue-400">currency</td>
                        <td className="px-4 py-3">string</td>
                        <td className="px-4 py-3">Yes</td>
                        <td className="px-4 py-3">Currency code (e.g., 'usd', 'eur')</td>
                      </tr>
                      <tr className="border-b border-gray-800">
                        <td className="px-4 py-3 font-mono text-blue-400">success_url</td>
                        <td className="px-4 py-3">string</td>
                        <td className="px-4 py-3">Yes</td>
                        <td className="px-4 py-3">URL to redirect after successful payment</td>
                      </tr>
                      <tr className="border-b border-gray-800">
                        <td className="px-4 py-3 font-mono text-blue-400">email</td>
                        <td className="px-4 py-3">string</td>
                        <td className="px-4 py-3">No</td>
                        <td className="px-4 py-3">Customer email address</td>
                      </tr>
                      <tr className="border-b border-gray-800">
                        <td className="px-4 py-3 font-mono text-blue-400">username</td>
                        <td className="px-4 py-3">string</td>
                        <td className="px-4 py-3">No</td>
                        <td className="px-4 py-3">Customer name</td>
                      </tr>
                      <tr className="border-b border-gray-800">
                        <td className="px-4 py-3 font-mono text-blue-400">description</td>
                        <td className="px-4 py-3">string</td>
                        <td className="px-4 py-3">No</td>
                        <td className="px-4 py-3">Payment description</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-mono text-blue-400">metadata</td>
                        <td className="px-4 py-3">object</td>
                        <td className="px-4 py-3">No</td>
                        <td className="px-4 py-3">Custom data to track orders (e.g., {'{'} order_id: '1234' {'}'})</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-xl font-semibold text-white">Response</h3>
                <p className="mb-2 text-gray-300">Success response (200 OK):</p>
                <div className="rounded-lg bg-gray-900 p-4">
                  <pre className="text-sm text-gray-300">
                    <code>{`{
  "message": "Payment created successfully",
  "paymentId": "uuid-string"
}`}</code>
                  </pre>
                </div>
                <p className="mt-4 mb-2 text-gray-300">Error response:</p>
                <div className="rounded-lg bg-gray-900 p-4">
                  <pre className="text-sm text-gray-300">
                    <code>{`{
  "error": "Error message"
}`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </section>

          {/* Checkout Flow */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-white">Checkout Flow</h2>
            <div className="space-y-4 text-gray-300">
              <div className="rounded-lg bg-gray-900 p-6">
                <ol className="ml-6 list-decimal space-y-4">
                  <li>Create a payment using the API endpoint with your API key</li>
                  <li>Receive a paymentId in the response</li>
                  <li>Redirect the customer to: <code className="rounded bg-gray-800 px-2 py-1 text-blue-400">https://yourdomain.com/v1/payments/{'{paymentId}'}</code></li>
                  <li>Customer completes payment on the secure checkout page</li>
                  <li>Customer is redirected to your success_url after successful payment</li>
                </ol>
              </div>
            </div>
          </section>

          {/* Important Notes */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-white">Important Notes</h2>
            <div className="space-y-3 rounded-lg bg-yellow-900/20 border border-yellow-700/50 p-6">
              <div className="flex items-start gap-3">
                <span className="text-yellow-400">⚠️</span>
                <p className="text-gray-300">
                  <strong className="text-white">Security:</strong> Never expose your API key in client-side code. 
                  Always make API calls from your server.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-yellow-400">⚠️</span>
                <p className="text-gray-300">
                  <strong className="text-white">Amount:</strong> Always specify amounts in cents (smallest currency unit). 
                  For example, $100.00 should be sent as 10000.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-yellow-400">⚠️</span>
                <p className="text-gray-300">
                  <strong className="text-white">URLs:</strong> Replace placeholder URLs with your actual domain and checkout URLs.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

