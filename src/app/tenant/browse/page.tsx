"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function BrowseProperties() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [filters, setFilters] = useState({ type: '', category: '', city: '', minPrice: '', maxPrice: '' });

  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  function fetchProperties() {
    const params = new URLSearchParams();
    if (filters.type) params.set('type', filters.type);
    if (filters.category) params.set('category', filters.category);
    if (filters.city) params.set('city', filters.city);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);

    fetch(`/api/properties?${params.toString()}`, { headers: authHeaders })
      .then(r => r.json())
      .then(d => { setProperties(d.properties || []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    fetch("/api/auth/me", { headers: authHeaders })
      .then(r => r.json())
      .then(d => { if (d.user) setUser(d.user); })
      .catch(() => {});
    fetchProperties();
  }, []);

  const isSubscribed = user && (user.userType === 'landlord' || user.userType === 'seller' || user.userType === 'admin');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Browse Properties</h1>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6">
        <div className="grid grid-cols-5 gap-3">
          <select value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm">
            <option value="">All Types</option>
            <option value="lease">For Lease</option>
            <option value="sale">For Sale</option>
          </select>
          <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm">
            <option value="">All Categories</option>
            <option value="self-contained-studio">Studio</option>
            <option value="bedroom-flat">Bedroom Flat</option>
            <option value="bungalow">Bungalow</option>
            <option value="duplex">Duplex</option>
            <option value="shop">Shop</option>
            <option value="house">House</option>
            <option value="land">Land</option>
          </select>
          <input type="text" placeholder="City" value={filters.city} onChange={e => setFilters({ ...filters, city: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm" />
          <input type="number" placeholder="Min ₦" value={filters.minPrice} onChange={e => setFilters({ ...filters, minPrice: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm" />
          <input type="number" placeholder="Max ₦" value={filters.maxPrice} onChange={e => setFilters({ ...filters, maxPrice: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm" />
        </div>
        <button onClick={fetchProperties} className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          Apply Filters
        </button>
      </div>

      {/* Subscription upsell for unsubscribed tenants */}
      {user && (user.userType === 'tenant' || user.userType === 'buyer') && !isSubscribed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-amber-800 text-sm flex items-center justify-between">
          <span>🔒 Subscribe to unlock full property details, contact info, and chat with landlords.</span>
          <Link href="/tenant/subscriptions" className="bg-amber-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-700 transition ml-4 whitespace-nowrap">
            View Plans
          </Link>
        </div>
      )}

      {/* Property Grid */}
      {loading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>)}
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No properties found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {properties.map((p: any) => (
            <a key={p.id} href={`/tenant/property/${p.id}`}
              className="property-card bg-white rounded-xl border border-gray-200 overflow-hidden block">
              <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                {p.photosUrls && p.photosUrls[0] ? (
                  <img src={p.photosUrls[0]} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">🏠</span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full capitalize">{p.type}</span>
                  {p.easeOfBusinessBadge && <span className="eob-badge">Ease of Doing Business</span>}
                </div>
                <h3 className="font-semibold">{p.title}</h3>
                <p className="text-sm text-gray-500">{p.city}, {p.state}</p>
                <p className="text-lg font-bold mt-2">₦{p.priceNaira?.toLocaleString()}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}