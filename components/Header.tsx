import Link from 'next/link';
import { getSession } from '@/lib/auth';
import UserMenu from './UserMenu';

export default async function Header() {
  const session = await getSession();

  return (
    <header className="w-full border-b border-gray-800 bg-black">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-white">
          My App
        </Link>
        <nav className="flex items-center gap-4">
          {session ? (
            <>
              <Link
                href="/paymentID"
                className="rounded-md px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
              >
                Create PaymentID
              </Link>
              <Link
                href="/order"
                className="rounded-md px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
              >
                Order
              </Link>
              <Link
                href="/docs"
                className="rounded-md px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
              >
                Docs
              </Link>
              <Link
                href="/keys"
                className="rounded-md px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
              >
                API Keys
              </Link>
              <UserMenu username={session.username} />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Signup
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

