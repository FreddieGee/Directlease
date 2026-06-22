"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function PropertyDetail() {
  const params = useParams();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [slots, setSlots] = useState<any[]>([]);

  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  // Determine subscription status: description is only returned for subscribed users
  const isSubscribed = property?.description ? true : false;

  useEffect(() => {
    fetch(`/api/properties/${params.id}`, { headers: authHeaders })
      .then(r => r.json())
      .then(d => { setProperty(d.property); setLoading(false); })
      .catch(() => setLoading(false));

    fetch("/api/favorites", { headers: authHeaders })
      .then(r => r.json())
      .then(d => {
        const saved = d.savedProperties || [];
        setIsSaved(saved.some((s: any) => s.id === params.id));
      })
      .catch(() => {});

    // Load viewing slots if subscribed
    if (token) {
      fetch(`/api/properties/${params.id}/viewing-slots`, { headers: authHeaders })
        .then(r => r.json())
        .then(d => setSlots(d.slots || []))
        .catch(() => {});
    }
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

          {/* Subscribed content — full details */}
          {isSubscribed && property.description && (
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

          {/* Subscribed: landlord contact info & viewing scheduling */}
          {isSubscribed ? (
            <div className="border-t pt-6 space-y-6">
              {/* Landlord Contact */}
              <div>
                <h2 className="font-semibold mb-3">Landlord Contact</h2>
                <div className="bg-green-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm"><strong>Name:</strong> {property.landlordName}</p>
                  {property.landlordEmail && <p className="text-sm"><strong>Email:</strong> {property.landlordEmail}</p>}
                  {property.landlordPhone && <p className="text-sm"><strong>Phone:</strong> {property.landlordPhone}</p>}
                </div>
              </div>

              {/* Viewing Slots */}
              <div className="border-t pt-6">
                <h2 className="font-semibold mb-3">Request a Viewing</h2>
                {slots.length > 0 ? (
                  <div className="space-y-3">
                    <select value={selectedSlot} onChange={e => setSelectedSlot(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm">
                      <option value="">Select a date/time</option>
                      {slots.filter((s: any) => s.is_available).map((slot: any) => (
                        <option key={slot.id} value={slot.id}>
                          {new Date(slot.date).toLocaleDateString()} at {slot.time_start?.substring(0, 5)}
                        </option>
                      ))}
                    </select>
                    <button onClick={requestViewing} disabled={!selectedSlot}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50">
                      Request Viewing
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No available viewing slots. Check back later or contact the landlord via chat.</p>
                )}
              </div>

              {/* Chat */}
              <div className="border-t pt-6">
                <Link href="/tenant/chat" className="bg-green-600 text-white px-6 py-2 rounded-lg inline-block font-medium hover:bg-green-700 transition">
                  💬 Chat with Landlord
                </Link>
              </div>
            </div>
          ) : (
            /* Not subscribed: upsell */
            <div className="border-t pt-6">
              <h2 className="font-semibold mb-3">Full Access Requires Subscription</h2>
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-4">
                <p className="text-sm text-amber-800">
                  🔒 Subscribe to unlock <strong>full property details</strong>, <strong>landlord contact info</strong>, <strong>viewing scheduling</strong>, and <strong>chat</strong> with the landlord.
                </p>
              </div>
              <Link href="/tenant/subscriptions" className="bg-amber-600 text-white px-6 py-2 rounded-lg inline-block font-medium hover:bg-amber-700 transition">
                View Subscription Plans
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}