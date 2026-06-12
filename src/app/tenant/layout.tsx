"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    fetch("/api/auth/me", { headers })
      .then(r => r.json())
      .then(data => {
        if (!data.user || (data.user.userType !== 'tenant' && data.user.userType !== 'buyer')) {
          router.push('/login');
        } else {
          setUser(data.user);
        }
      })
      .catch(() => router.push('/login'));
  }, []);

  if (!user) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full"></div></div>;

  const navItems = [
    { href: '/tenant/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/tenant/browse', label: 'Browse Properties', icon: '🔍' },
    { href: '/tenant/subscriptions', label: 'Subscription', icon: '💳' },
    { href: '/tenant/verification', label: 'Verification', icon: '✅' },
    { href: '/tenant/viewings', label: 'My Viewings', icon: '📅' },
    { href: '/tenant/chat', label: 'Chat', icon: '💬' },
    { href: '/tenant/transactions', label: 'Transactions', icon: '💰' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-green-700 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <Link href="/" className="text-lg font-bold">DirectLease</Link>
        <div className="flex items-center gap-3">
          <span className="text-sm opacity-80">{user.name}</span>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-green-600 transition"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-green-800 text-white shadow-xl z-40">
          <nav className="p-2">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/90 hover:bg-green-600 hover:text-white transition"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                router.push('/login');
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/90 hover:bg-green-600 hover:text-white transition mt-2"
            >
              <span>🚪</span>
              <span>Sign Out</span>
            </button>
          </nav>
        </div>
      )}

      {/* Desktop Sidebar — unchanged */}
      <aside className="hidden md:flex md:w-64 bg-white border-r border-gray-200 flex-shrink-0 flex-col">
        <div className="p-6 border-b border-gray-200">
          <Link href="/" className="text-xl font-bold text-green-600">DirectLease</Link>
          <p className="text-sm text-gray-500 mt-1">Welcome, {user.name}</p>
          <p className="text-xs text-gray-400 capitalize">{user.userType}</p>
        </div>
        <nav className="p-4 flex-1">
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
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              router.push('/login');
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition w-full"
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 p-4 md:p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}