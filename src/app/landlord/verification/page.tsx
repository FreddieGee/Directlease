"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LandlordVerificationPage() {
  const router = useRouter();
  const [verification, setVerification] = useState<any>(null);
  const [userStatus, setUserStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [nin, setNin] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [utilityBillFile, setUtilityBillFile] = useState<File | null>(null);
  const [ninSlipFile, setNinSlipFile] = useState<File | null>(null);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [utilityBillPreview, setUtilityBillPreview] = useState<string>("");
  const [ninSlipPreview, setNinSlipPreview] = useState<string>("");
  const [profilePicPreview, setProfilePicPreview] = useState<string>("");

  const utilityBillRef = useRef<HTMLInputElement>(null);
  const ninSlipRef = useRef<HTMLInputElement>(null);
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
          setHomeAddress(d.verification.home_address || "");
          if (d.verification.utility_bill_url) setUtilityBillPreview(d.verification.utility_bill_url);
          if (d.verification.nin_slip_url) setNinSlipPreview(d.verification.nin_slip_url);
          if (d.verification.profile_pic_url) setProfilePicPreview(d.verification.profile_pic_url);
        }
        setUserStatus(effectiveStatus);
      })
      .catch(() => setError("Failed to load verification status"))
      .finally(() => setLoading(false));
  }, []);

  function handleFileSelect(
    file: File | null,
    setFile: (f: File | null) => void,
    setPreview: (s: string) => void
  ) {
    if (!file) {
      setFile(null);
      setPreview("");
      return;
    }
    setFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!nin || !homeAddress || !utilityBillFile || !ninSlipFile || !profilePicFile) {
      setError("All fields are required, including document uploads");
      return;
    }

    // Check file sizes (max 1MB per file to avoid Vercel's 4.5MB body limit with base64 overhead)
    const maxSize = 1 * 1024 * 1024; // 1MB
    if (utilityBillFile.size > maxSize || ninSlipFile.size > maxSize || profilePicFile.size > maxSize) {
      setError("Each file must be less than 1MB. Please compress your documents.");
      return;
    }

    // Estimate total body size (base64 adds ~33% overhead)
    const totalSize = (utilityBillFile.size + ninSlipFile.size + profilePicFile.size) * 1.33;
    if (totalSize > 4 * 1024 * 1024) {
      setError(`Total file size too large (estimated ${(totalSize / 1024 / 1024).toFixed(1)}MB). Use smaller files.`);
      return;
    }

    setSubmitting(true);
    try {
      // Read all files to base64
      const toBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = reject;
          r.readAsDataURL(file);
        });

      const [utilityBillData, ninSlipData, profilePicData] = await Promise.all([
        toBase64(utilityBillFile),
        toBase64(ninSlipFile),
        toBase64(profilePicFile),
      ]);

      const res = await authFetch("/api/verification", {
        method: "POST",
        body: JSON.stringify({
          nin,
          homeAddress,
          utilityBillUrl: utilityBillData,
          ninSlipUrl: ninSlipData,
          profilePicUrl: profilePicData,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        // Response is not JSON (e.g. 413 Request Entity Too Large)
        setError(`Server error (${res.status} — ${res.statusText}). Your files may be too large. Try smaller files.`);
        return;
      }
      if (!res.ok) {
        setError(data.error || "Submission failed");
      } else {
        setSuccess("Verification documents submitted! Awaiting admin approval.");
        setUserStatus("pending");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred. Please check console for details.");
      console.error("Verification submit error:", err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
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
          <p className="text-green-600">Your account has been approved. You can now list properties.</p>
          <Link href="/landlord/listings/new" className="mt-4 inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
            Create a Listing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Landlord Verification</h1>

      {userStatus === "pending" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-amber-800 text-sm">
          ⏳ Your verification is currently <strong>pending admin review</strong>. You'll be able to list properties once approved.
        </div>
      )}

      {userStatus === "rejected" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-800 text-sm">
          ❌ Your verification was <strong>rejected</strong>. Please update your documents below and resubmit.
        </div>
      )}

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-sm text-gray-500 mb-6">
          Submit your details and documents below for verification. Admin will review and approve your account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">National Identification Number (NIN)</label>
            <input type="text" value={nin} onChange={e => setNin(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Home Address</label>
            <textarea value={homeAddress} onChange={e => setHomeAddress(e.target.value)} rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          {/* Utility Bill Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Utility Bill (recent document)</label>
            <input
              type="file"
              accept="image/*,.pdf"
              ref={utilityBillRef}
              onChange={e => handleFileSelect(e.target.files?.[0] || null, setUtilityBillFile, setUtilityBillPreview)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {utilityBillPreview && (
              <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                <span>✅ Uploaded</span>
                {utilityBillPreview.startsWith("data:image") && (
                  <img src={utilityBillPreview} alt="Preview" className="h-12 w-12 object-cover rounded border" />
                )}
                <button type="button" onClick={() => { setUtilityBillFile(null); setUtilityBillPreview(""); if (utilityBillRef.current) utilityBillRef.current.value = ""; }}
                  className="text-red-500 hover:text-red-700">Remove</button>
              </div>
            )}
          </div>

          {/* NIN Slip Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NIN Slip (document/photo)</label>
            <input
              type="file"
              accept="image/*,.pdf"
              ref={ninSlipRef}
              onChange={e => handleFileSelect(e.target.files?.[0] || null, setNinSlipFile, setNinSlipPreview)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {ninSlipPreview && (
              <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                <span>✅ Uploaded</span>
                {ninSlipPreview.startsWith("data:image") && (
                  <img src={ninSlipPreview} alt="Preview" className="h-12 w-12 object-cover rounded border" />
                )}
                <button type="button" onClick={() => { setNinSlipFile(null); setNinSlipPreview(""); if (ninSlipRef.current) ninSlipRef.current.value = ""; }}
                  className="text-red-500 hover:text-red-700">Remove</button>
              </div>
            )}
          </div>

          {/* Profile Picture Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
            <input
              type="file"
              accept="image/*"
              ref={profilePicRef}
              onChange={e => handleFileSelect(e.target.files?.[0] || null, setProfilePicFile, setProfilePicPreview)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {profilePicPreview && (
              <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                <img src={profilePicPreview} alt="Preview" className="h-16 w-16 object-cover rounded-full border" />
                <button type="button" onClick={() => { setProfilePicFile(null); setProfilePicPreview(""); if (profilePicRef.current) profilePicRef.current.value = ""; }}
                  className="text-red-500 hover:text-red-700">Remove</button>
              </div>
            )}
          </div>

          <button type="submit" disabled={submitting || userStatus === "pending"}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50">
            {submitting ? "Uploading & Submitting..." : "Submit for Verification"}
          </button>

          {userStatus === "pending" && (
            <p className="text-xs text-gray-400 text-center">You've already submitted. Awaiting admin review.</p>
          )}
        </form>
      </div>
    </div>
  );
}