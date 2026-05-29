"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function TermsPage() {
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to accept terms");
        return;
      }

      // Check user type to redirect
      const meRes = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const meData = await meRes.json();

      if (meData.user) {
        const type = meData.user.userType;
        if (type === "landlord" || type === "seller") {
          router.push("/landlord/dashboard");
        } else {
          router.push("/tenant/browse");
        }
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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-blue-600">
            DirectLease
          </Link>
          <p className="text-gray-500 mt-2">Terms &amp; Conditions</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="prose prose-sm max-w-none mb-8 overflow-y-auto max-h-96 border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-bold mb-4">DirectLease Terms &amp; Conditions</h2>
            <p className="mb-4">
              Welcome to DirectLease. By using our platform, you agree to the
              following terms and conditions. Please read them carefully.
            </p>

            <h3 className="font-semibold mt-4 mb-2">1. Platform Usage</h3>
            <p className="mb-2">
              DirectLease is a marketplace connecting property owners (landlords/sellers)
              directly with tenants/buyers. We do not act as agents, brokers, or
              intermediaries in any transaction. All dealings are between the parties
              directly.
            </p>

            <h3 className="font-semibold mt-4 mb-2">2. User Accounts</h3>
            <p className="mb-2">
              You are responsible for maintaining the confidentiality of your account
              credentials. All activities under your account are your responsibility.
              You must provide accurate, current, and complete information during
              registration.
            </p>

            <h3 className="font-semibold mt-4 mb-2">3. Verification</h3>
            <p className="mb-2">
              All users must undergo verification as outlined in our verification
              process. Landlords/sellers must be verified before listing properties.
              Tenants/buyers must be verified before accessing full property details
              and chat features.
            </p>

            <h3 className="font-semibold mt-4 mb-2">4. In-App Communication</h3>
            <p className="mb-2">
              All communication regarding properties listed on DirectLease must be
              conducted through our in-app chat system. External communication
              (phone, WhatsApp, email, etc.) is discouraged and may limit our
              ability to assist with dispute resolution. Chat logs serve as the
              official record for any disputes.
            </p>

            <h3 className="font-semibold mt-4 mb-2">5. Listings</h3>
            <p className="mb-2">
              Property listings must be accurate and include a minimum of 6 photos
              and 2 videos. False or misleading listings may result in account
              suspension. All prices are displayed in Nigerian Naira (₦).
            </p>

            <h3 className="font-semibold mt-4 mb-2">6. Fees &amp; Subscriptions</h3>
            <p className="mb-2">
              DirectLease charges subscription fees for premium features. A 2%
              service fee applies to completed transactions. Optional buyer and
              seller protection add-ons are available at additional costs as
              specified on the platform.
            </p>

            <h3 className="font-semibold mt-4 mb-2">7. Dispute Resolution</h3>
            <p className="mb-2">
              Any disputes arising from transactions on the platform will be
              resolved using the in-app chat history as the official record.
              DirectLease may assist in mediation but is not liable for disputes
              between users.
            </p>

            <h3 className="font-semibold mt-4 mb-2">8. Liability</h3>
            <p className="mb-2">
              DirectLease is not responsible for the condition, legality, or
              suitability of any listed property. Users are encouraged to perform
              their own due diligence before entering into any agreement. The
              platform is provided &quot;as is&quot; without warranties of any kind.
            </p>

            <h3 className="font-semibold mt-4 mb-2">9. Termination</h3>
            <p className="mb-2">
              DirectLease reserves the right to suspend or terminate accounts that
              violate these terms or engage in fraudulent, abusive, or illegal
              activity.
            </p>

            <h3 className="font-semibold mt-4 mb-2">10. Changes to Terms</h3>
            <p className="mb-2">
              We may update these terms at any time. Continued use of the platform
              after changes constitutes acceptance of the new terms.
            </p>

            <p className="mt-4 text-sm text-gray-500">
              Last updated: {new Date().getFullYear()}
            </p>
          </div>

          <label className="flex items-start gap-3 mb-6">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">
              I have read and agree to the Terms &amp; Conditions set forth by
              DirectLease. I understand that all communications must be kept within
              the in-app chat system.
            </span>
          </label>

          <button
            onClick={handleAccept}
            disabled={!accepted || loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Accept &amp; Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}