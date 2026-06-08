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
  const [photos, setPhotos] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  function handlePhotosSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setPhotos(prev => [...prev, ...files].slice(0, 10));
    const previews = files.map(f => URL.createObjectURL(f));
    setPhotoPreviews(prev => [...prev, ...previews].slice(0, 10));
  }

  function removePhoto(i: number) {
    setPhotos(prev => prev.filter((_, idx) => idx !== i));
    setPhotoPreviews(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (photos.length < 6) {
      setError("At least 6 photos are required");
      return;
    }
    if (videos.length < 2) {
      setError("At least 2 videos are required");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('type', form.type);
      formData.append('category', form.category);
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('priceNaira', form.priceNaira);
      formData.append('address', form.address);
      formData.append('city', form.city);
      formData.append('state', form.state);
      photos.forEach(p => formData.append('photos', p));
      videos.forEach(v => formData.append('videos', v));

      const token = localStorage.getItem("token");
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦)</label>
            <input type="number" value={form.priceNaira} onChange={e => setForm({...form, priceNaira: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
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

        {/* Photos Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Photos ({photos.length}/6 minimum required)
          </label>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotosSelected}
            className="hidden"
          />
          <div className="flex flex-wrap gap-2 mb-2">
            {photoPreviews.map((preview, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                <img src={preview} alt={`Photo ${i+1}`} className="w-full h-full object-cover" />
                <button type="button" onClick={() => removePhoto(i)}
                  className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 text-xs rounded-bl-lg">×</button>
              </div>
            ))}
            <button type="button" onClick={() => photoInputRef.current?.click()}
              className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition">
              <span className="text-2xl">+</span>
            </button>
          </div>
          <p className="text-xs text-gray-400">Select at least 6 photos (JPEG, PNG)</p>
        </div>

        {/* Videos Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Videos ({videos.length}/2 minimum required)
          </label>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            multiple
            onChange={e => {
              const files = Array.from(e.target.files || []);
              setVideos(prev => [...prev, ...files].slice(0, 5));
            }}
            className="hidden"
          />
          <div className="flex flex-wrap gap-2 mb-2">
            {videos.map((v, i) => (
              <div key={i} className="relative bg-gray-100 rounded-lg px-3 py-2 text-sm flex items-center gap-2 border border-gray-200">
                <span>🎬 {v.name.slice(0, 20)}</span>
                <button type="button" onClick={() => setVideos(prev => prev.filter((_, idx) => idx !== i))}
                  className="text-red-500 hover:text-red-700">×</button>
              </div>
            ))}
            <button type="button" onClick={() => videoInputRef.current?.click()}
              className="px-3 py-2 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-blue-500 hover:text-blue-500 transition text-sm">
              + Add Video
            </button>
          </div>
          <p className="text-xs text-gray-400">Select at least 2 videos (MP4, WebM)</p>
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50">
          {loading ? "Submitting..." : "Submit for Approval"}
        </button>
      </form>
    </div>
  );
}