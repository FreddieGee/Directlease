"use client";

import { useEffect, useState } from "react";

export default function LandlordListings() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/landlord/properties")
      .then(r => r.json())
      .then(d => { setProperties(d.properties || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Listings</h1>
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>)}
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500 mb-4">You haven&apos;t listed any properties yet.</p>
          <a href="/landlord/listings/new" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">Create Your First Listing</a>
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map((p: any) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-6 flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{p.title}</h3>
                <p className="text-sm text-gray-500">{p.type} — {p.category} — {p.city}, {p.state}</p>
                <p className="text-lg font-bold mt-1">₦{parseFloat(p.price_naira).toLocaleString()}</p>
                {p.ease_of_business_badge && (
                  <span className="eob-badge inline-block mt-1">🏆 Ease of Doing Business</span>
                )}
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  p.status === 'approved' ? 'bg-green-100 text-green-800' :
                  p.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  p.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                }`}>{p.status}</span>
                <p className="text-xs text-gray-400 mt-1">{p.viewings_count} viewings</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}