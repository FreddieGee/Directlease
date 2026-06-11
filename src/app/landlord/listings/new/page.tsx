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
  const [photoDataUrls, setPhotoDataUrls] = useState<string[]>([]);
  const [videoDataUrls, setVideoDataUrls] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  function readFilesAsDataUrls(files: FileList): Promise<string[]> {
    return Promise.all(Array.from(files).map(f => new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(f);
    })));
  }

  async function addPhotos(files: FileList | null) {
    if (!files) return;
    const urls = await readFilesAsDataUrls(files);
    setPhotoDataUrls(prev => [...prev, ...urls]);
  }

  function removePhoto(i: number) {
    setPhotoDataUrls(prev => prev.filter((_, idx) => idx !== i));
  }

  async function addVideos(files: FileList | null) {
    if (!files) return;
    const urls = await readFilesAsDataUrls(files);
    setVideoDataUrls(prev => [...prev, ...urls]);
  }

  function removeVideo(i: number) {
    setVideoDataUrls(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (photoDataUrls.length < 6) {
      setError("At least 6 photos are required");
      return;
    }
    if (videoDataUrls.length < 2) {
      setError("At least 2 videos are required");
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
          photosUrls: photoDataUrls,
          videosUrls: videoDataUrls,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create listing");
      } else {
        router.push('/landlord/listings');
      }
    } catch (err) {
      setError("Upload error: " + (err instanceof Error ? err.message : ""));
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

        {/* Photos Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Photos ({photoDataUrls.length}/6 minimum required)
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            ref={photoInputRef}
            onChange={e => { addPhotos(e.target.files); if (photoInputRef.current) photoInputRef.current.value = ''; }}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {photoDataUrls.map((src, i) => (
              <div key={i} className="relative group">
                <img src={src} alt={`Photo ${i+1}`} className="h-16 w-16 object-cover rounded-lg border" />
                <button type="button" onClick={() => removePhoto(i)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition">×</button>
                <span className="block text-[10px] text-gray-400 text-center mt-0.5">{i+1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Videos Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Videos ({videoDataUrls.length}/2 minimum required)
          </label>
          <input
            type="file"
            accept="video/*"
            multiple
            ref={videoInputRef}
            onChange={e => { addVideos(e.target.files); if (videoInputRef.current) videoInputRef.current.value = ''; }}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {videoDataUrls.map((src, i) => (
              <div key={i} className="relative group">
                <video src={src} className="h-16 w-16 object-cover rounded-lg border" />
                <button type="button" onClick={() => removeVideo(i)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition">×</button>
                <span className="block text-[10px] text-gray-400 text-center mt-0.5">{i+1}</span>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50">
          {loading ? "Uploading & Submitting..." : "Submit for Approval"}
        </button>
      </form>
    </div>
  );
}