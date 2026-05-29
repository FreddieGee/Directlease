"use client";

import { useEffect, useState } from "react";

export default function LandlordDashboard() {
  const [properties, setProperties] = useState([]);
  const [viewings, setViewings] = useState([]);

  useEffect(() => {
    fetch("/api/landlord/properties")
      .then(r => r.json())
      .then(d => setProperties(d.properties || []))
      .catch(() => {});

    fetch("/api/landlord/viewings")
      .then(r => r.json())
      .then(d => setViewings(d.viewingRequests || []))
      .catch(() => {});
  }, []);

  const pendingVerification = properties.filter((p: any) => p.status === 'pending').length;
  const approved = properties.filter((p: any) => p.status === 'approved').length;
  const pendingViewings = viewings.filter((v: any) => v.status === 'pending').length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Landlord Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <p className="text-3xl font-bold text-blue-600">{properties.length}</p>
          <p className="text-sm text-gray-500">Total Listings</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <p className="text-3xl font-bold text-green-600">{approved}</p>
          <p className="text-sm text-gray-500">Approved</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <p className="text-3xl font-bold text-amber-600">{pendingViewings}</p>
          <p className="text-sm text-gray-500">Pending Viewings</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Viewing Requests</h2>
        {viewings.length === 0 ? (
          <p className="text-gray-500">No viewing requests yet.</p>
        ) : (
          <div className="space-y-3">
            {viewings.slice(0, 5).map((vr: any) => (
              <div key={vr.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{vr.property_title}</p>
                  <p className="text-sm text-gray-500">{vr.tenant_name} — {new Date(vr.slot_date).toLocaleDateString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  vr.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  vr.status === 'agreed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>{vr.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}