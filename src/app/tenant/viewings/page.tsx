"use client";

import { useEffect, useState } from "react";

export default function TenantViewings() {
  const [viewings, setViewings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tenant/viewings")
      .then(r => r.json())
      .then(d => { setViewings(d.viewingRequests || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Viewings</h1>
      {loading ? (
        <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>)}</div>
      ) : viewings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No viewing requests yet. Browse properties and request a viewing.</p>
          <a href="/tenant/browse" className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg">Browse Properties</a>
        </div>
      ) : (
        <div className="space-y-4">
          {viewings.map(vr => (
            <div key={vr.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{vr.property_title}</h3>
                  <p className="text-sm text-gray-500">{vr.property_address}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm"><span className="font-medium">Landlord:</span> {vr.landlord_name}</p>
                    <p className="text-sm"><span className="font-medium">Date:</span> {new Date(vr.slot_date).toLocaleDateString()} — {vr.slot_time_start?.slice(0,5)} to {vr.slot_time_end?.slice(0,5)}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  vr.status === 'agreed' ? 'bg-green-100 text-green-800' :
                  vr.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  vr.status === 'rescheduled' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}>{vr.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}