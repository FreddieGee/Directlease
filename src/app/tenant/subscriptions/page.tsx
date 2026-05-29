"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Subscriptions() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function subscribe(plan: string) {
    setLoading(true);
    const token = document.cookie.split('; ').find(c => c.startsWith('session_token='))?.split('=')[1];
    const res = await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token || ''}` },
      body: JSON.stringify({ plan }),
    });
    if (res.ok) {
      alert("Subscription activated! You now have full access.");
      router.push('/tenant/browse');
    } else {
      const data = await res.json();
      alert(data.error || "Subscription failed");
    }
    setLoading(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Choose Your Plan</h1>
      <div className="grid md:grid-cols-2 gap-6 max-w-2xl">
        <div className="bg-white rounded-xl border-2 border-green-500 p-6">
          <h2 className="text-xl font-bold mb-2">Monthly Access</h2>
          <p className="text-3xl font-bold text-green-600 mb-4">₦5,000<span className="text-sm text-gray-500">/month</span></p>
          <ul className="space-y-2 mb-6 text-sm">
            <li>✅ Full property details</li>
            <li>✅ Direct chat with landlords</li>
            <li>✅ Schedule viewings</li>
            <li>✅ Contact information</li>
          </ul>
          <button onClick={() => subscribe('tenant_monthly')} disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
            {loading ? "Processing..." : "Subscribe Monthly"}
          </button>
        </div>
        <div className="bg-white rounded-xl border-2 border-blue-500 p-6">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl font-bold">Yearly Access</h2>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Save 17%</span>
          </div>
          <p className="text-3xl font-bold text-blue-600 mb-4">₦50,000<span className="text-sm text-gray-500">/year</span></p>
          <ul className="space-y-2 mb-6 text-sm">
            <li>✅ All monthly features</li>
            <li>✅ Priority support</li>
            <li>✅ Early access to new listings</li>
            <li>✅ Best value</li>
          </ul>
          <button onClick={() => subscribe('tenant_yearly')} disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Processing..." : "Subscribe Yearly"}
          </button>
        </div>
      </div>
    </div>
  );
}