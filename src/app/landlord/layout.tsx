"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LandlordLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => {
        if (!data.user || (data.user.userType !== 'landlord' && data.user.userType !== 'seller')) {
          router.push('/login');
        } else {
          setUser(data.user);
        }
      })
      .catch(() => router.push('/login'));
  }, []);

  if (!user) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>;

  const navItems = [
    { href: '/landlord/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/landlord/listings', label: 'My Listings', icon: '🏠' },
    { href: '/landlord/listings/new', label: 'New Listing', icon: '➕' },
    { href: '/landlord/viewings', label: 'Viewings', icon: '📅' },
    { href: '/landlord/chat', label: 'Chat', icon: '💬' },
    { href: '/landlord/transactions', label: 'Transactions', icon: '💰' },
    { href: '/landlord/verification', label: 'Verification', icon: '✅' },
  ];

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="p-6 border-b border-gray-200">
          <Link href="/" className="text-xl font-bold text-blue-600">DirectLease</Link>
          <p className="text-sm text-gray-500 mt-1">Welcome, {user.name}</p>
          <p className="text-xs text-gray-400 capitalize">{user.userType}</p>
        </div>
        <nav className="p-4">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg mb-1 text-gray-700 hover:bg-gray-100 transition"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4">
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              router.push('/login');
            }}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 bg-gray-50 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}