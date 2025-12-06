import Link from 'next/link';

export default function CheckoutSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-md text-center">
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-8">
          <div className="mb-4 text-6xl">✅</div>
          <h1 className="mb-4 text-3xl font-bold text-white">Payment Successful!</h1>
          <p className="mb-6 text-gray-400">
            Thank you for your purchase. Your order has been confirmed and you will receive an email confirmation shortly.
          </p>
          <div className="flex flex-col gap-4">
            <Link
              href="/store"
              className="rounded-md bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Continue Shopping
            </Link>
            <Link
              href="/"
              className="rounded-md border border-gray-700 bg-gray-800 px-6 py-3 font-semibold text-white transition-colors hover:bg-gray-700"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

