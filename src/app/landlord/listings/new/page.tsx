"use client";

import { useState, FormEvent } from "react";
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
    photosUrls: ['', '', '', '', '', ''],
    videosUrls: ['', ''],
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const photos = form.photosUrls.filter(u => u.trim());
    const videos = form.videosUrls.filter(u => u.trim());

    if (photos.length < 6) {
      setError("At least 6 photo URLs are required");
      return;
    }
    if (videos.length < 2) {
      setError("At least 2 video URLs are required");
      return;
    }

    setLoading(true);
    try {
      const token = document.cookie.split('; ').find(c => c.startsWith('session_token='))?.split('=')[1];
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify({ ...form, priceNaira: parseFloat(form.priceNaira), photosUrls: photos, videosUrls: videos }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create listing");
      } else {
        router.push('/landlord/listings');
      }
    } catch (err) {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }

  const updatePhoto = (i: number, val: string) => {
    const urls = [...form.photosUrls];
    urls[i] = val;
    setForm({ ...form, photosUrls: urls });
  };

  const updateVideo = (i: number, val: string) => {
    const urls = [...form.videosUrls];
    urls[i] = val;
    setForm({ ...form, videosUrls: urls });
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">New Property Listing</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg">
              <option value="lease">Lease</option>
              <option value="sale">Sale</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg">
              <option value="self-contained-studio">Self-contained (Studio)</option>
              <option value="bedroom-flat">Bedroom Flat</option>
              <option value="bungalow">Bungalow</option>
              <option value="duplex">Duplex</option>
              <option value="shop">Shop</option>
              <option value="shared-apartment">Shared Apartment</option>
              <option value="student-accommodation">Student Accommodation</option>
              <option value="house">House</option>
              <option value="land">Land</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg h-24" required />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦)</label>
            <input type="number" value={form.priceNaira} onChange={e => setForm({ ...form, priceNaira: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input type="text" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Photos (min 6 — enter URLs)</label>
          {form.photosUrls.map((url, i) => (
            <input key={i} type="text" value={url} onChange={e => updatePhoto(i, e.target.value)}
              placeholder={`Photo ${i + 1} URL`}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-1" />
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Videos (min 2 — enter URLs)</label>
          {form.videosUrls.map((url, i) => (
            <input key={i} type="text" value={url} onChange={e => updateVideo(i, e.target.value)}
              placeholder={`Video ${i + 1} URL`}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-1" />
          ))}
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50">
          {loading ? "Submitting..." : "Submit Listing for Approval"}
        </button>
      </form>
    </div>
  );
}