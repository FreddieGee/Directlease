"use client";

import { Suspense } from "react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function TermsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAccept() {
    if (!accepted) return;
    setLoading(true);
    setError("");

    const token = searchParams.get("token") || localStorage.getItem("token");
    if (!token) {
      setError("No authentication token found. Please login again.");
      return;
    }

    try {
      const res = await fetch("/api/auth/accept-tc", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to accept terms");
        return;
      }
      const meRes = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
      const meData = await meRes.json();
      if (meData.user) {
        const type = meData.user.userType;
        router.push(type === "landlord" || type === "seller" ? "/landlord/dashboard" : "/tenant/browse");
      } else {
        router.push("/login");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <div className="prose prose-sm max-w-none mb-8 overflow-y-auto max-h-96 border border-gray-200 rounded-lg p-4">
        <h2 className="text-lg font-bold mb-4">DirectLease Terms &amp; Conditions</h2>
        <p className="mb-4">Welcome to DirectLease. By using our platform, you agree to the following terms and conditions.</p>
        <h3 className="font-semibold mt-4 mb-2">1. Platform Usage</h3>
        <p className="mb-2">DirectLease is a marketplace connecting property owners directly with tenants/buyers.</p>
        <h3 className="font-semibold mt-4 mb-2">2. User Accounts</h3>
        <p className="mb-2">You are responsible for maintaining account confidentiality.</p>
        <h3 className="font-semibold mt-4 mb-2">3. Verification</h3>
        <p className="mb-2">All users must undergo verification as outlined in our process.</p>
        <h3 className="font-semibold mt-4 mb-2">4. In-App Communication</h3>
        <p className="mb-2">All communication must be through our in-app chat system. External communication is discouraged.</p>
        <h3 className="font-semibold mt-4 mb-2">5. Listings</h3>
        <p className="mb-2">Property listings must be accurate with minimum 6 photos and 2 videos.</p>
        <h3 className="font-semibold mt-4 mb-2">6. Fees &amp; Subscriptions</h3>
        <p className="mb-2">Subscription fees and 2% service fee on completed transactions apply.</p>
        <h3 className="font-semibold mt-4 mb-2">7. Dispute Resolution</h3>
        <p className="mb-2">Chat logs serve as official records for disputes.</p>
        <h3 className="font-semibold mt-4 mb-2">8. Liability</h3>
        <p className="mb-2">DirectLease is not responsible for property condition or suitability.</p>
        <h3 className="font-semibold mt-4 mb-2">9. Termination</h3>
        <p className="mb-2">We reserve the right to suspend accounts violating terms.</p>
        <h3 className="font-semibold mt-4 mb-2">10. Changes to Terms</h3>
        <p className="mb-2">Terms may be updated at any time.</p>
      </div>

      <label className="flex items-start gap-3 mb-6">
        <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)}
          className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300" />
        <span className="text-sm text-gray-700">
          I have read and agree to the Terms &amp; Conditions.
        </span>
      </label>

      <button onClick={handleAccept} disabled={!accepted || loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50">
        {loading ? "Processing..." : "Accept &amp; Continue"}
      </button>
    </div>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-blue-600">DirectLease</Link>
          <p className="text-gray-500 mt-2">Terms &amp; Conditions</p>
        </div>
        <Suspense fallback={<div className="bg-white rounded-xl border border-gray-200 p-8 animate-pulse h-64"></div>}>
          <TermsContent />
        </Suspense>
      </div>
    </div>
  );
}