"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";

function CheckoutContent() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<'paystack' | 'flutterwave'>('paystack');
  const [includeLegalProtection, setIncludeLegalProtection] = useState(false);
  const [includeBgCheck, setIncludeBgCheck] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/properties/${params.propertyId}`)
      .then(r => r.json())
      .then(d => { setProperty(d.property); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.propertyId]);

  async function handlePayment() {
    setProcessing(true);
    setError("");

    // If no protection selected, show warning first
    if (!includeLegalProtection && !includeBgCheck && !showWarning) {
      setShowWarning(true);
      setProcessing(false);
      return;
    }

    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: params.propertyId,
          landlordId: property.landlordId,
          gateway: selectedGateway,
          buyerProtectionLegal: includeLegalProtection,
          buyerProtectionBgcheck: includeBgCheck,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Payment initialization failed");
        setProcessing(false);
        return;
      }

      // Redirect to payment gateway
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        // Fallback: use Paystack popup
        if (selectedGateway === 'paystack' && typeof window !== 'undefined') {
          const handler = (window as any).PaystackPop?.setup({
            key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxxxxxxxxxxxx',
            email: data.email || 'user@example.com',
            amount: Math.round(data.totalAmount * 100),
            ref: data.reference,
            callback: () => router.push('/tenant/transactions'),
            onClose: () => setProcessing(false),
          });
          handler?.openIframe();
        } else if (selectedGateway === 'flutterwave' && typeof window !== 'undefined') {
          const handler = (window as any).FlutterwaveCheckout?.setup({
            public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-xxxxxxxxxxxxxx',
            tx_ref: data.reference,
            amount: data.totalAmount,
            currency: 'NGN',
            callback: () => router.push('/tenant/transactions'),
            onclose: () => setProcessing(false),
          });
        }
      }
    } catch (err) {
      setError("Connection error. Please try again.");
      setProcessing(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>;
  }

  if (!property) {
    return <div className="bg-white rounded-xl p-8 text-center"><p className="text-gray-500">Property not found.</p></div>;
  }

  const amount = property.priceNaira || 0;
  const serviceFee = amount * 0.02;
  const legalFee = includeLegalProtection ? (property.type === 'lease' ? amount * 0.10 : amount * 0.05) : 0;
  const bgFee = includeBgCheck ? (property.type === 'lease' ? amount * 0.05 : amount * 0.03) : 0;
  const total = amount + serviceFee + legalFee + bgFee;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      {showWarning && !includeLegalProtection && !includeBgCheck && (
        <div className="bg-red-50 border-2 border-red-400 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-red-800 mb-2">⚠️ Important: Due Diligence Warning</h2>
          <p className="text-red-700 mb-4">
            You have declined all buyer protection options. Without these protections:
          </p>
          <ul className="list-disc list-inside text-red-700 mb-4 space-y-1">
            <li>You will not have legal document review</li>
            <li>The property will not be background-checked</li>
            <li>DirectLease will have limited ability to assist in disputes</li>
          </ul>
          <p className="text-red-700 font-medium mb-4">
            We strongly recommend carrying out proper due diligence with a qualified legal practitioner to avoid fraud.
          </p>
          <div className="flex gap-3">
            <button onClick={() => { setIncludeLegalProtection(true); setShowWarning(false); }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
              Add Legal Protection (₦{legalFee.toLocaleString()})
            </button>
            <button onClick={handlePayment}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
              Proceed Without Protection
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-lg mb-4">Transaction Summary</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Property</span>
            <span className="font-medium">{property.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Type</span>
            <span className="capitalize">{property.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Location</span>
            <span>{property.city}, {property.state}</span>
          </div>
          <hr />
          <div className="flex justify-between">
            <span className="text-gray-600">Property Price</span>
            <span className="font-bold">₦{amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Service Fee (2%)</span>
            <span>₦{serviceFee.toLocaleString()}</span>
          </div>
          {legalFee > 0 && (
            <div className="flex justify-between text-green-700">
              <span>➕ Legal Protection ({(property.type === 'lease' ? '10%' : '5%')})</span>
              <span>₦{legalFee.toLocaleString()}</span>
            </div>
          )}
          {bgFee > 0 && (
            <div className="flex justify-between text-green-700">
              <span>➕ Background Check ({(property.type === 'lease' ? '5%' : '3%')})</span>
              <span>₦{bgFee.toLocaleString()}</span>
            </div>
          )}
          <hr className="border-2" />
          <div className="flex justify-between text-xl font-bold">
            <span>Total</span>
            <span className="text-blue-600">₦{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {!showWarning && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">Buyer Protection (Optional)</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" checked={includeLegalProtection}
                onChange={e => setIncludeLegalProtection(e.target.checked)}
                className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Legal Fee Protection</p>
                <p className="text-sm text-gray-500">
                  {property.type === 'lease' ? '10%' : '5%'} of {property.type === 'lease' ? 'lease' : 'sale'} value
                  — Document review and legal support
                </p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" checked={includeBgCheck}
                onChange={e => setIncludeBgCheck(e.target.checked)}
                className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Property Background Check</p>
                <p className="text-sm text-gray-500">
                  {property.type === 'lease' ? '5%' : '3%'} of {property.type === 'lease' ? 'lease' : 'sale'} value
                  — Verify property ownership and history
                </p>
              </div>
            </label>
          </div>
        </div>
      )}

      {!showWarning && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">Select Payment Method</h2>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setSelectedGateway('paystack')}
              className={`p-4 border-2 rounded-xl text-center transition ${
                selectedGateway === 'paystack' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
              <div className="text-2xl mb-1">💳</div>
              <div className="font-medium">Paystack</div>
              <div className="text-xs text-gray-500">Card, Bank Transfer, USSD</div>
            </button>
            <button onClick={() => setSelectedGateway('flutterwave')}
              className={`p-4 border-2 rounded-xl text-center transition ${
                selectedGateway === 'flutterwave' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
              <div className="text-2xl mb-1">🌊</div>
              <div className="font-medium">Flutterwave</div>
              <div className="text-xs text-gray-500">Card, Bank, Mobile Money</div>
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {!showWarning && (
        <button onClick={handlePayment} disabled={processing}
          className="w-full bg-blue-600 text-white py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 shadow-lg">
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              Processing...
            </span>
          ) : (
            `Pay ₦${total.toLocaleString()} via ${selectedGateway === 'paystack' ? 'Paystack' : 'Flutterwave'}`
          )}
        </button>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <Suspense fallback={<div className="max-w-2xl mx-auto animate-pulse h-96 bg-gray-200 rounded-xl"></div>}>
        <CheckoutContent />
      </Suspense>
    </div>
  );
}