"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type TabType = 'dashboard' | 'users' | 'properties' | 'verifications' | 'subscriptions' | 'transactions' | 'chat' | 'settings';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [user, setUser] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [data, setData] = useState<any>({});

  function adminFetch(url: string, options: RequestInit = {}) {
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
    adminFetch("/api/auth/me")
      .then(r => r.json())
      .then(d => {
        if (!d.user || d.user.userType !== 'admin') {
          router.push('/admin/login');
        } else {
          setUser(d.user);
        }
      })
      .catch(() => router.push('/admin/login'));
  }, []);

  function fetchAnalytics() {
    setDataLoading(true);
    setDataError(null);
    adminFetch("/api/admin/analytics")
      .then(async r => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({ error: `HTTP ${r.status}` }));
          throw new Error(err.error || `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then(d => setData(d))
      .catch((err) => setDataError(err.message))
      .finally(() => setDataLoading(false));
  }

  function fetchUsers() {
    setDataLoading(true);
    setDataError(null);
    adminFetch("/api/admin/users")
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => setData((prev: any) => ({ ...prev, usersData: d })))
      .catch((err) => setDataError(err.message))
      .finally(() => setDataLoading(false));
  }

  function fetchProperties() {
    setDataLoading(true);
    setDataError(null);
    adminFetch("/api/admin/properties")
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => setData((prev: any) => ({ ...prev, propertiesData: d })))
      .catch((err) => setDataError(err.message))
      .finally(() => setDataLoading(false));
  }

  function fetchVerifications() {
    setDataLoading(true);
    setDataError(null);
    adminFetch("/api/admin/verifications")
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => setData((prev: any) => ({ ...prev, verificationsData: d })))
      .catch((err) => setDataError(err.message))
      .finally(() => setDataLoading(false));
  }

  function fetchSubscriptions() {
    setDataLoading(true);
    setDataError(null);
    adminFetch("/api/admin/subscriptions")
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => setData((prev: any) => ({ ...prev, subsData: d })))
      .catch((err) => setDataError(err.message))
      .finally(() => setDataLoading(false));
  }

  function fetchTransactions() {
    setDataLoading(true);
    setDataError(null);
    adminFetch("/api/admin/transactions")
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => setData((prev: any) => ({ ...prev, txData: d })))
      .catch((err) => setDataError(err.message))
      .finally(() => setDataLoading(false));
  }

  function fetchChatLogs() {
    setDataLoading(true);
    setDataError(null);
    adminFetch("/api/admin/chat")
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => setData((prev: any) => ({ ...prev, chatData: d })))
      .catch((err) => setDataError(err.message))
      .finally(() => setDataLoading(false));
  }

  useEffect(() => {
    if (!user) return;
    setPageLoading(false);
    switch (activeTab) {
      case 'dashboard': fetchAnalytics(); break;
      case 'users': fetchUsers(); break;
      case 'properties': fetchProperties(); break;
      case 'verifications': fetchVerifications(); break;
      case 'subscriptions': fetchSubscriptions(); break;
      case 'transactions': fetchTransactions(); break;
      case 'chat': fetchChatLogs(); break;
    }
  }, [activeTab, user]);

  async function handleVerify(userId: string, userType: string, status: string) {
    await adminFetch("/api/admin/verifications", {
      method: "PATCH",
      body: JSON.stringify({ userId, userType, status }),
    });
    fetchVerifications();
  }

  async function handlePropertyAction(propertyId: string, status: string) {
    await adminFetch("/api/admin/properties", {
      method: "PATCH",
      body: JSON.stringify({ propertyId, status }),
    });
    fetchProperties();
  }

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'properties', label: 'Properties', icon: '🏠' },
    { id: 'verifications', label: 'Verifications', icon: '✅' },
    { id: 'subscriptions', label: 'Subscriptions', icon: '💳' },
    { id: 'transactions', label: 'Transactions', icon: '💰' },
    { id: 'chat', label: 'Chat Logs', icon: '💬' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const kpis = data.kpis || {};
  const defaultKpis = {
    totalUsers: 0,
    totalProperties: 0,
    activeSubscriptions: 0,
    totalTransactions: 0,
    totalServiceFees: 0,
    pendingVerifications: 0,
    totalViewings: 0,
    badgesAwarded: 0,
  };
  const mergedKpis = { ...defaultKpis, ...kpis };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="admin-sidebar w-64 flex-shrink-0">
        <div className="p-6">
          <Link href="/" className="text-xl font-bold text-white">DirectLease</Link>
          <p className="text-blue-200 text-xs mt-1">Administrator Panel</p>
        </div>
        <nav className="px-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 text-left transition ${
                activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4 px-4">
          <button
            onClick={() => { localStorage.removeItem("token"); document.cookie = "session_token=; max-age=0"; router.push('/admin/login'); }}
            className="w-full text-gray-400 hover:text-white text-sm py-2"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 p-8 overflow-auto">
        {/* Error Banner */}
        {dataError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            ⚠️ {dataError}
          </div>
        )}

        {/* Loading Indication */}
        {dataLoading && (
          <div className="mb-4 text-sm text-gray-500 flex items-center gap-2">
            <div className="animate-spin h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            Loading data...
          </div>
        )}

        {/* Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Users', value: mergedKpis.totalUsers, color: 'bg-blue-500' },
                { label: 'Properties', value: mergedKpis.totalProperties, color: 'bg-green-500' },
                { label: 'Active Subs', value: mergedKpis.activeSubscriptions, color: 'bg-purple-500' },
                { label: 'Transactions', value: mergedKpis.totalTransactions, color: 'bg-amber-500' },
                { label: 'Service Fees (₦)', value: mergedKpis.totalServiceFees?.toLocaleString(), color: 'bg-emerald-500' },
                { label: 'Pending Verify', value: mergedKpis.pendingVerifications, color: 'bg-red-500' },
                { label: 'Viewings', value: mergedKpis.totalViewings, color: 'bg-indigo-500' },
                { label: 'Badges Awarded', value: mergedKpis.badgesAwarded, color: 'bg-teal-500' },
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className={`w-3 h-3 rounded-full ${stat.color} mb-2`}></div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Recent Transactions */}
            {data.recentTransactions && data.recentTransactions.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-2">Property</th>
                      <th className="pb-2">Amount (₦)</th>
                      <th className="pb-2">Landlord</th>
                      <th className="pb-2">Tenant</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.recentTransactions || []).map((tx: any) => (
                      <tr key={tx.id} className="border-b last:border-0">
                        <td className="py-2">{tx.title}</td>
                        <td className="py-2">{parseFloat(tx.amount).toLocaleString()}</td>
                        <td className="py-2">{tx.landlord}</td>
                        <td className="py-2">{tx.tenant}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            tx.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>{tx.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Users Section */}
        {activeTab === 'users' && (
          <div>
            <h1 className="text-2xl font-bold mb-6">User Management</h1>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Verified</th>
                    <th className="p-3">T&amp;C</th>
                    <th className="p-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.usersData?.users || []).length === 0 ? (
                    <tr><td className="p-3 text-gray-400 text-center" colSpan={6}>No users found</td></tr>
                  ) : (data.usersData?.users || []).map((u: any) => (
                    <tr key={u.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-medium">{u.name}</td>
                      <td className="p-3 text-gray-500">{u.email}</td>
                      <td className="p-3">
                        <span className="capitalize px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{u.user_type}</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.verification_status === 'approved' ? 'bg-green-100 text-green-800' :
                          u.verification_status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>{u.verification_status}</span>
                      </td>
                      <td className="p-3">{u.tc_accepted ? '✅' : '❌'}</td>
                      <td className="p-3 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Properties Section */}
        {activeTab === 'properties' && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Property Management</h1>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="p-3">Title</th>
                    <th className="p-3">Landlord</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Price (₦)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Featured</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.propertiesData?.properties || []).length === 0 ? (
                    <tr><td className="p-3 text-gray-400 text-center" colSpan={7}>No properties found</td></tr>
                  ) : (data.propertiesData?.properties || []).map((p: any) => (
                    <tr key={p.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-medium">{p.title}</td>
                      <td className="p-3 text-gray-500">{p.landlord_name}</td>
                      <td className="p-3 capitalize">{p.type}</td>
                      <td className="p-3">{parseFloat(p.price_naira).toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.status === 'approved' ? 'bg-green-100 text-green-800' :
                          p.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          p.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>{p.status}</span>
                      </td>
                      <td className="p-3">{p.is_featured ? '⭐' : '-'}</td>
                      <td className="p-3 flex gap-2">
                        {p.status === 'pending' && (
                          <>
                            <button onClick={() => handlePropertyAction(p.id, 'approved')} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200">Approve</button>
                            <button onClick={() => handlePropertyAction(p.id, 'rejected')} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200">Reject</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Verifications Section */}
        {activeTab === 'verifications' && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Verification Management</h1>
            
            <h2 className="text-lg font-semibold mb-3 mt-6">Landlord/Seller Verifications</h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">NIN</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.verificationsData?.landlordVerifications || []).length === 0 ? (
                    <tr><td className="p-3 text-gray-400 text-center" colSpan={5}>No landlord verifications</td></tr>
                  ) : (data.verificationsData?.landlordVerifications || []).map((v: any) => (
                    <tr key={v.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-medium">{v.name}</td>
                      <td className="p-3 text-gray-500">{v.email}</td>
                      <td className="p-3">{v.nin}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          v.status === 'approved' ? 'bg-green-100 text-green-800' :
                          v.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>{v.status}</span>
                      </td>
                      <td className="p-3 flex gap-2">
                        {v.status === 'pending' && (
                          <>
                            <button onClick={() => handleVerify(v.user_id, 'landlord', 'approved')} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200">Approve</button>
                            <button onClick={() => handleVerify(v.user_id, 'landlord', 'rejected')} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200">Reject</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2 className="text-lg font-semibold mb-3">Tenant/Buyer Verifications</h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">NIN</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.verificationsData?.tenantVerifications || []).length === 0 ? (
                    <tr><td className="p-3 text-gray-400 text-center" colSpan={6}>No tenant verifications</td></tr>
                  ) : (data.verificationsData?.tenantVerifications || []).map((v: any) => (
                    <tr key={v.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-medium">{v.name}</td>
                      <td className="p-3 text-gray-500">{v.email}</td>
                      <td className="p-3">{v.nin}</td>
                      <td className="p-3">{v.phone}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          v.status === 'approved' ? 'bg-green-100 text-green-800' :
                          v.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>{v.status}</span>
                      </td>
                      <td className="p-3 flex gap-2">
                        {v.status === 'pending' && (
                          <>
                            <button onClick={() => handleVerify(v.user_id, 'tenant', 'approved')} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200">Approve</button>
                            <button onClick={() => handleVerify(v.user_id, 'tenant', 'rejected')} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200">Reject</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Subscriptions Section */}
        {activeTab === 'subscriptions' && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Subscription Management</h1>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="p-3">User</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Plan</th>
                    <th className="p-3">Start</th>
                    <th className="p-3">End</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.subsData?.subscriptions || []).length === 0 ? (
                    <tr><td className="p-3 text-gray-400 text-center" colSpan={6}>No subscriptions found</td></tr>
                  ) : (data.subsData?.subscriptions || []).map((s: any) => (
                    <tr key={s.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-medium">{s.user_name}</td>
                      <td className="p-3 capitalize">{s.user_type}</td>
                      <td className="p-3">{s.plan}</td>
                      <td className="p-3 text-gray-500">{new Date(s.start_date).toLocaleDateString()}</td>
                      <td className="p-3 text-gray-500">{new Date(s.end_date).toLocaleDateString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          s.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>{s.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Transactions Section */}
        {activeTab === 'transactions' && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Transaction Monitoring</h1>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="p-3">Property</th>
                    <th className="p-3">Landlord</th>
                    <th className="p-3">Tenant</th>
                    <th className="p-3">Amount (₦)</th>
                    <th className="p-3">Fee (₦)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.txData?.transactions || []).length === 0 ? (
                    <tr><td className="p-3 text-gray-400 text-center" colSpan={6}>No transactions found</td></tr>
                  ) : (data.txData?.transactions || []).map((tx: any) => (
                    <tr key={tx.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-medium">{tx.property_title}</td>
                      <td className="p-3">{tx.landlord_name}</td>
                      <td className="p-3">{tx.tenant_name}</td>
                      <td className="p-3">{parseFloat(tx.amount).toLocaleString()}</td>
                      <td className="p-3">{parseFloat(tx.service_fee).toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          tx.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>{tx.status}</span>
                      </td>
                      <td className="p-3 text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Chat Logs Section */}
        {activeTab === 'chat' && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Chat Monitoring</h1>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 bg-amber-50 border-b border-amber-200 text-sm text-amber-800">
                ⚠️ All chat communications are monitored for dispute resolution purposes.
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="p-3">Property</th>
                    <th className="p-3">Sender</th>
                    <th className="p-3">Receiver</th>
                    <th className="p-3">Message</th>
                    <th className="p-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.chatData?.messages || []).length === 0 ? (
                    <tr><td className="p-3 text-gray-400 text-center" colSpan={5}>No chat messages</td></tr>
                  ) : (data.chatData?.messages || []).map((msg: any) => (
                    <tr key={msg.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-medium">{msg.property_title}</td>
                      <td className="p-3">{msg.sender_name} <span className="text-xs text-gray-400">({msg.sender_type})</span></td>
                      <td className="p-3">{msg.receiver_name} <span className="text-xs text-gray-400">({msg.receiver_type})</span></td>
                      <td className="p-3 text-gray-500 max-w-xs truncate">{msg.message}</td>
                      <td className="p-3 text-gray-500">{new Date(msg.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Section */}
        {activeTab === 'settings' && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Platform Settings</h1>
            <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg">
              <h2 className="font-semibold mb-4">Fee Configuration</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Fee (%)</label>
                  <input type="number" defaultValue="2" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Protection - Legal (Lease %)</label>
                  <input type="number" defaultValue="10" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Protection - Legal (Sale %)</label>
                  <input type="number" defaultValue="5" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Protection - Background Check (Lease %)</label>
                  <input type="number" defaultValue="5" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seller Protection (%)</label>
                  <input type="number" defaultValue="10" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}