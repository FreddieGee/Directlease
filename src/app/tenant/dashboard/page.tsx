"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function TenantDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [saved, setSaved] = useState<any[]>([]);
  const [viewings, setViewings] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [tab, setTab] = useState<'overview' | 'saved' | 'profile'>('overview');

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setUser(d.user));
    fetch("/api/favorites").then(r => r.json()).then(d => setSaved(d.savedProperties || [])).catch(() => {});
    fetch("/api/tenant/viewings").then(r => r.json()).then(d => setViewings(d.viewingRequests || [])).catch(() => {});
    fetch("/api/subscriptions").then(r => r.json()).then(d => setSubscription(d.subscription)).catch(() => {});
  }, []);

  if (!user) return <div className="animate-pulse h-64 bg-gray-100 rounded-xl"></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Dashboard</h1>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <p className="text-3xl font-bold text-green-600">{saved.length}</p>
          <p className="text-sm text-gray-500">Saved Properties</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <p className="text-3xl font-bold text-blue-600">{viewings.length}</p>
          <p className="text-sm text-gray-500">Viewing Requests</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <p className="text-3xl font-bold text-amber-600">{subscription ? 'Active' : 'Free'}</p>
          <p className="text-sm text-gray-500">Subscription</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6 border-b">
        {(['overview', 'saved', 'profile'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-2 px-1 font-medium text-sm border-b-2 transition capitalize ${
              tab === t ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>{t === 'overview' ? '📊 Activity' : t === 'saved' ? '❤️ Saved' : '👤 Profile'}</button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-4">Recent Viewings</h2>
            {viewings.length === 0 ? (
              <p className="text-gray-500 text-sm">No viewing requests yet. <Link href="/tenant/browse" className="text-green-600 hover:underline">Browse properties</Link></p>
            ) : (
              viewings.slice(0, 5).map((v: any) => (
                <div key={v.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{v.property_title}</p>
                    <p className="text-xs text-gray-500">{new Date(v.slot_date).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    v.status === 'agreed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>{v.status}</span>
                </div>
              ))
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/tenant/browse" className="p-3 bg-blue-50 rounded-lg text-center text-sm font-medium text-blue-700 hover:bg-blue-100">🔍 Browse Properties</Link>
              <Link href="/tenant/viewings" className="p-3 bg-green-50 rounded-lg text-center text-sm font-medium text-green-700 hover:bg-green-100">📅 My Viewings</Link>
              <Link href="/tenant/chat" className="p-3 bg-amber-50 rounded-lg text-center text-sm font-medium text-amber-700 hover:bg-amber-100">💬 Messages</Link>
              <Link href="/tenant/subscriptions" className="p-3 bg-purple-50 rounded-lg text-center text-sm font-medium text-purple-700 hover:bg-purple-100">💳 Subscribe</Link>
            </div>
          </div>
        </div>
      )}

      {/* Saved Tab */}
      {tab === 'saved' && (
        <div>
          {saved.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-500 mb-4">You haven't saved any properties yet.</p>
              <Link href="/tenant/browse" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Browse Properties</Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {saved.map((s: any) => (
                <div key={s.saved_id} className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {s.photos_urls?.[0] ? <img src={s.photos_urls[0]} className="w-full h-full object-cover rounded-lg" /> : <span className="text-2xl">🏠</span>}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{s.title}</h3>
                    <p className="text-xs text-gray-500">{s.city}, {s.state}</p>
                    <p className="font-bold mt-1">₦{parseFloat(s.price_naira).toLocaleString()}</p>
                    <div className="flex gap-2 mt-2">
                      <Link href={`/tenant/property/${s.id}`} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">View</Link>
                      <button onClick={async () => {
                        await fetch("/api/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ propertyId: s.id }) });
                        setSaved(saved.filter(sv => sv.id !== s.id));
                      }} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="max-w-lg">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-2xl">{user.name?.[0] || '👤'}</div>
              <div>
                <h2 className="font-bold">{user.name}</h2>
                <p className="text-sm text-gray-500 capitalize">{user.userType}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 uppercase font-medium">Email</label>
                <p className="text-sm">{user.email}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-medium">Member Since</label>
                <p className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-medium">Verification Status</label>
                <p className={`text-sm font-medium ${user.verificationStatus === 'approved' ? 'text-green-600' : 'text-amber-600'}`}>{user.verificationStatus}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-medium">T&amp;C Accepted</label>
                <p className="text-sm">{user.tcAccepted ? '✅ Yes' : '❌ No'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-medium">Subscription</label>
                <p className="text-sm">{subscription ? `Active - ${subscription.plan}` : 'Free Tier'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}