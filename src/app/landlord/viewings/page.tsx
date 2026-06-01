"use client";

import { useEffect, useState } from "react";

export default function LandlordViewings() {
  const [viewings, setViewings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/landlord/viewings")
      .then(r => r.json())
      .then(d => { setViewings(d.viewingRequests || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleAction(requestId: string, action: string) {
    const token = document.cookie.split('; ').find(c => c.startsWith('session_token='))?.split('=')[1];
    const res = await fetch("/api/viewings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token || ''}` },
      body: JSON.stringify({ requestId, action }),
    });
    if (res.ok) {
      setViewings(viewings.map(v => v.id === requestId ? { ...v, status: action === 'agree' ? 'agreed' : 'rescheduled' } : v));
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Viewing Requests</h1>
      {loading ? (
        <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>)}</div>
      ) : viewings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No viewing requests yet.</p>
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
                    <p className="text-sm"><span className="font-medium">Tenant:</span> {vr.tenant_name} ({vr.tenant_email})</p>
                    <p className="text-sm"><span className="font-medium">Date:</span> {new Date(vr.slot_date).toLocaleDateString()} — {vr.slot_time_start?.slice(0,5)} to {vr.slot_time_end?.slice(0,5)}</p>
                    <p className="text-sm"><span className="font-medium">Requested:</span> {new Date(vr.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    vr.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    vr.status === 'agreed' ? 'bg-green-100 text-green-800' :
                    vr.status === 'rescheduled' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>{vr.status}</span>
                  {vr.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleAction(vr.id, 'agree')}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200">Agree</button>
                      <button onClick={() => handleAction(vr.id, 'reschedule')}
                        className="px-3 py-1 bg-amber-100 text-amber-700 rounded text-sm hover:bg-amber-200">Reschedule</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}