"use client";

import { useEffect, useState } from "react";
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

  const [form, setForm] = useState({
    nin: "",
    homeAddress: "",
    utilityBillUrl: "",
    ninSlipUrl: "",
    profilePicUrl: "",
  });

  function authFetch(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem("token");
    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  }

  useEffect(() => {
    authFetch("/api/verification")
      .then(r => r.json())
      .then(d => {
        if (d.verification) {
          setVerification(d.verification);
          setForm({
            nin: d.verification.nin || "",
            homeAddress: d.verification.home_address || "",
            utilityBillUrl: d.verification.utility_bill_url || "",
            ninSlipUrl: d.verification.nin_slip_url || "",
            profilePicUrl: d.verification.profile_pic_url || "",
          });
        }
        setUserStatus(d.status || "unverified");
      })
      .catch(() => setError("Failed to load verification status"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.nin || !form.homeAddress || !form.utilityBillUrl || !form.ninSlipUrl || !form.profilePicUrl) {
      setError("All fields are required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await authFetch("/api/verification", {
        method: "POST",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Submission failed");
      } else {
        setSuccess("Verification documents submitted! Awaiting admin approval.");
        setUserStatus("pending");
      }
    } catch {
      setError("Connection error");
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

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-sm text-gray-500 mb-6">
          Submit your details below for verification. All documents must be valid and up-to-date.
          Admin will review and approve your account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">National Identification Number (NIN)</label>
            <input type="text" value={form.nin} onChange={e => setForm({...form, nin: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Home Address</label>
            <textarea value={form.homeAddress} onChange={e => setForm({...form, homeAddress: e.target.value})} rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Utility Bill (URL — recent)</label>
            <input type="url" value={form.utilityBillUrl} onChange={e => setForm({...form, utilityBillUrl: e.target.value})}
              placeholder="https://example.com/utility-bill.pdf"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NIN Slip (URL)</label>
            <input type="url" value={form.ninSlipUrl} onChange={e => setForm({...form, ninSlipUrl: e.target.value})}
              placeholder="https://example.com/nin-slip.jpg"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture (URL)</label>
            <input type="url" value={form.profilePicUrl} onChange={e => setForm({...form, profilePicUrl: e.target.value})}
              placeholder="https://example.com/profile.jpg"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <button type="submit" disabled={submitting || userStatus === "pending"}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50">
            {submitting ? "Submitting..." : "Submit for Verification"}
          </button>

          {userStatus === "pending" && (
            <p className="text-xs text-gray-400 text-center">You've already submitted. Awaiting admin review.</p>
          )}
        </form>
      </div>
    </div>
  );
}