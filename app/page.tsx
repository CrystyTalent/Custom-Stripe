import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await getSession();

  // Redirect logged-in users to store
  if (session) {
    redirect('/keys');
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-black">
      <main className="flex flex-col items-center justify-center gap-8 px-4 text-center">
        <h1 className="text-4xl font-bold text-white sm:text-5xl">
          Welcome to Payzo
        </h1>
        <p className="max-w-md text-lg text-gray-400">
          Get started by logging in or creating a new account.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="rounded-lg border-2 border-gray-700 px-8 py-3 text-lg font-semibold text-white transition-colors hover:border-gray-600 hover:bg-gray-900"
          >
            Signup
          </Link>
        </div>
      </main>
    </div>
  );
}
