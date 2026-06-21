"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

export default function TenantVerificationPage() {
  const [verification, setVerification] = useState<any>(null);
  const [userStatus, setUserStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Tenant verification fields per business plan: NIN, Phone, Profile pic, Email
  const [nin, setNin] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string>("");
  const profilePicRef = useRef<HTMLInputElement>(null);

  function authFetch(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem("token");
    return fetch(url, {
      ...options,
      headers: {
        ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  }

  useEffect(() => {
    authFetch("/api/verification")
      .then(r => r.json())
      .then(d => {
        const hasDocs = !!d.verification;
        // If admin approved, always show approved regardless of docs
        const effectiveStatus = d.status === 'approved' ? 'approved' : (hasDocs ? d.status : "unverified");

        if (d.verification) {
          setVerification(d.verification);
          setNin(d.verification.nin || "");
          setPhone(d.verification.phone || "");
          setEmail(d.verification.email || "");
          if (d.verification.profile_pic_url) setProfilePicPreview(d.verification.profile_pic_url);
        }
        setUserStatus(effectiveStatus);
      })
      .catch(() => setError("Failed to load verification status"))
      .finally(() => setLoading(false));
  }, []);

  function handleProfilePic(file: File | null) {
    if (!file) { setProfilePicFile(null); setProfilePicPreview(""); return; }
    setProfilePicFile(file);
    const r = new FileReader();
    r.onload = (e) => setProfilePicPreview(e.target?.result as string);
    r.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!nin || !phone || !email || !profilePicFile) {
      setError("All fields are required, including profile picture");
      return;
    }

    const maxSize = 1 * 1024 * 1024;
    if (profilePicFile.size > maxSize) {
      setError("Profile picture must be less than 1MB");
      return;
    }

    // Estimate total body size (base64 adds ~33% overhead)
    const totalSize = profilePicFile.size * 1.33;
    if (totalSize > 4 * 1024 * 1024) {
      setError(`File too large (estimated ${(totalSize / 1024 / 1024).toFixed(1)}MB). Use a smaller file.`);
      return;
    }

    setSubmitting(true);
    try {
      const toBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = reject;
          r.readAsDataURL(file);
        });

      const profilePicData = await toBase64(profilePicFile);

      const res = await authFetch("/api/verification", {
        method: "POST",
        body: JSON.stringify({ nin, phone, profilePicUrl: profilePicData, email }),
      });

      let data;
      try { data = await res.json(); } catch {
        setError(`Server error (${res.status}). Try a smaller file.`);
        return;
      }

      if (!res.ok) {
        setError(data.error || "Submission failed");
      } else {
        setSuccess("Verification submitted! Awaiting admin approval.");
        setUserStatus("pending");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
      console.error("Verification submit error:", err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (userStatus === "approved") {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Verification</h1>
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <p className="text-4xl mb-3">✅</p>
          <h2 className="text-xl font-semibold text-green-800 mb-2">Verified!</h2>
          <p className="text-green-600">Your account has been approved. You can now access all features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Tenant Verification</h1>

      {userStatus === "pending" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-amber-800 text-sm">
          ⏳ Your verification is <strong>pending admin review</strong>.
        </div>
      )}

      {userStatus === "rejected" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-800 text-sm">
          ❌ Your verification was <strong>rejected</strong>. Please update and resubmit.
        </div>
      )}

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-sm text-gray-500 mb-6">
          Submit your details for identity verification. Admin will review and approve your account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">National Identification Number (NIN)</label>
            <input type="text" value={nin} onChange={e => setNin(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="08012345678"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
          </div>

          {/* Profile Picture */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture (capture via camera)</label>
            <input
              type="file"
              accept="image/*"
              ref={profilePicRef}
              onChange={e => handleProfilePic(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
            <p className="text-xs text-gray-400 mt-1">You can use your phone camera to take a selfie.</p>
            {profilePicPreview && (
              <div className="mt-2 flex items-center gap-3">
                <img src={profilePicPreview} alt="Preview" className="h-20 w-20 object-cover rounded-full border" />
                <button type="button" onClick={() => { setProfilePicFile(null); setProfilePicPreview(""); if (profilePicRef.current) profilePicRef.current.value = ""; }}
                  className="text-red-500 hover:text-red-700 text-sm">Remove</button>
              </div>
            )}
          </div>

          <button type="submit" disabled={submitting || userStatus === "pending"}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50">
            {submitting ? "Submitting..." : "Submit for Verification"}
          </button>

          {userStatus === "pending" && (
            <p className="text-xs text-gray-400 text-center">Already submitted. Awaiting admin review.</p>
          )}
        </form>
      </div>
    </div>
  );
}