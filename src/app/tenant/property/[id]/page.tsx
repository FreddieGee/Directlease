"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function PropertyDetail() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    fetch(`/api/properties/${params.id}`, { headers: authHeaders })
      .then(r => r.json())
      .then(d => { setProperty(d.property); setLoading(false); })
      .catch(() => setLoading(false));

    // Check if saved
    fetch("/api/favorites", { headers: authHeaders })
      .then(r => r.json())
      .then(d => {
        const saved = d.savedProperties || [];
        setIsSaved(saved.some((s: any) => s.id === params.id));
      })
      .catch(() => {});
  }, [params.id]);

  async function toggleSave() {
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ propertyId: params.id }),
    });
    if (res.ok) {
      const data = await res.json();
      setIsSaved(data.saved);
    }
  }

  async function requestViewing() {
    if (!selectedSlot) return;
    const res = await fetch("/api/viewings", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ propertyId: params.id, slotId: selectedSlot }),
    });
    if (res.ok) {
      alert("Viewing requested! The landlord will respond shortly.");
    } else {
      const data = await res.json();
      alert(data.error || "Failed to request viewing");
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>;

  if (!property) return <div className="bg-white rounded-xl p-8 text-center"><p className="text-gray-500">Property not found.</p></div>;

  return (
    <div className="max-w-4xl">
      <Link href="/tenant/browse" className="text-blue-600 hover:underline text-sm mb-4 inline-block">&larr; Back to Browse</Link>
      
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="h-64 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
          {property.photosUrls?.[0] ? (
            <img src={property.photosUrls[0]} alt={property.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-6xl">🏠</span>
          )}
        </div>

        <div className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full capitalize">{property.type}</span>
            <span className="text-sm bg-gray-100 text-gray-800 px-3 py-1 rounded-full capitalize">{property.category}</span>
            {property.easeOfBusinessBadge && <span className="eob-badge">Ease of Doing Business</span>}
          </div>

          <h1 className="text-2xl font-bold mb-2">{property.title}</h1>
          <p className="text-gray-500 mb-4">{property.address}, {property.city}, {property.state}</p>
          <div className="flex items-center gap-4 mb-6">
            <p className="text-3xl font-bold text-blue-600">₦{property.priceNaira?.toLocaleString()}</p>
            <button onClick={toggleSave} className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${isSaved ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
              {isSaved ? '❤️ Saved' : '🤍 Save'}
            </button>
          </div>

          {property.description && (
            <div className="mb-6">
              <h2 className="font-semibold mb-2">Description</h2>
              <p className="text-gray-700">{property.description}</p>
            </div>
          )}

          {property.photosUrls && property.photosUrls.length > 0 && (
            <div className="mb-6">
              <h2 className="font-semibold mb-2">Photos</h2>
              <div className="grid grid-cols-3 gap-2">
                {property.photosUrls.map((url: string, i: number) => (
                  <div key={i} className="h-32 bg-gray-100 rounded-lg overflow-hidden">
                    <img src={url} alt={`Photo ${i+1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Viewing Request Section */}
          {property.description && (
            <div className="border-t pt-6">
              <h2 className="font-semibold mb-3">Request a Viewing</h2>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-blue-800">
                  💡 Subscribe to unlock full details, chat with the landlord, and schedule viewings.
                </p>
              </div>
              <a href="/tenant/subscriptions" className="bg-blue-600 text-white px-6 py-2 rounded-lg inline-block hover:bg-blue-700 transition">
                Subscribe to Access
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}