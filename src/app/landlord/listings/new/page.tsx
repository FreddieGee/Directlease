"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function NewListing() {
  const router = useRouter();
  const [form, setForm] = useState({
    type: 'lease',
    category: 'self-contained-studio',
    title: '',
    description: '',
    priceNaira: '',
    address: '',
    city: '',
    state: '',
  });
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function addPhotoUrl(url: string) {
    if (url.trim()) setPhotoUrls(prev => [...prev, url.trim()]);
  }
  function removePhoto(i: number) {
    setPhotoUrls(prev => prev.filter((_, idx) => idx !== i));
  }
  function addVideoUrl(url: string) {
    if (url.trim()) setVideoUrls(prev => [...prev, url.trim()]);
  }
  function removeVideo(i: number) {
    setVideoUrls(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (photoUrls.length < 6) {
      setError("At least 6 photos are required (add URLs below)");
      return;
    }
    if (videoUrls.length < 2) {
      setError("At least 2 videos are required (add URLs below)");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...form,
          priceNaira: parseFloat(form.priceNaira),
          photosUrls: photoUrls,
          videosUrls: videoUrls,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create listing");
      } else {
        router.push('/landlord/listings');
      }
    } catch (err) {
      setError("Connection error: " + (err instanceof Error ? err.message : ""));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">New Property Listing</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="lease">Lease</option>
              <option value="sale">Sale</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <optgroup label="Lease Types">
                <option value="self-contained-studio">Self-Contained (Studio)</option>
                <option value="bedroom-flat">Bedroom Flat</option>
                <option value="bungalow">Bungalow</option>
                <option value="duplex">Duplex</option>
                <option value="shop">Shop</option>
                <option value="shared-apartment">Shared Apartment</option>
                <option value="student-accommodation">Student Accommodation</option>
              </optgroup>
              <optgroup label="Sale Types">
                <option value="house">House</option>
                <option value="land">Land</option>
                <option value="other">Other</option>
              </optgroup>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦)</label>
          <input type="number" value={form.priceNaira} onChange={e => setForm({...form, priceNaira: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input type="text" value={form.state} onChange={e => setForm({...form, state: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>

        {/* Photos URLs */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Photos ({photoUrls.length}/6 minimum required)
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Paste photo URL..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addPhotoUrl((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
            <button type="button" onClick={() => {
              const input = document.querySelector<HTMLInputElement>('[placeholder="Paste photo URL..."]');
              if (input) { addPhotoUrl(input.value); input.value = ''; }
            }}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {photoUrls.map((url, i) => (
              <div key={i} className="bg-gray-100 px-3 py-1 rounded-lg text-xs flex items-center gap-2 border">
                <span>📷 #{i+1}</span>
                <button type="button" onClick={() => removePhoto(i)} className="text-red-500 hover:text-red-700">×</button>
              </div>
            ))}
          </div>
        </div>

        {/* Videos URLs */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Videos ({videoUrls.length}/2 minimum required)
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Paste video URL..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addVideoUrl((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
            <button type="button" onClick={() => {
              const input = document.querySelector<HTMLInputElement>('[placeholder="Paste video URL..."]');
              if (input) { addVideoUrl(input.value); input.value = ''; }
            }}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {videoUrls.map((url, i) => (
              <div key={i} className="bg-gray-100 px-3 py-1 rounded-lg text-xs flex items-center gap-2 border">
                <span>🎬 #{i+1}</span>
                <button type="button" onClick={() => removeVideo(i)} className="text-red-500 hover:text-red-700">×</button>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50">
          {loading ? "Submitting..." : "Submit for Approval"}
        </button>
      </form>
    </div>
  );
}