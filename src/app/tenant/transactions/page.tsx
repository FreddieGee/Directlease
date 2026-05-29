"use client";

import { useEffect, useState } from "react";

export default function TenantTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/transactions")
      .then(r => r.json())
      .then(d => { setTransactions(d.transactions || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Transactions</h1>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No transactions yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-left"><th className="p-3">Property</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3">Date</th></tr></thead>
            <tbody>
              {transactions.map((tx: any) => (
                <tr key={tx.id} className="border-t"><td className="p-3">{tx.property_title}</td><td className="p-3">₦{parseFloat(tx.amount).toLocaleString()}</td><td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tx.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{tx.status}</span></td><td className="p-3 text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}