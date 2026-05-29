"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [stats, setStats] = useState({ properties: 0, landlords: 0, tenants: 0 });

  useEffect(() => {
    fetch("/api/properties?limit=1")
      .then(r => r.json())
      .then(data => {
        if (data.pagination) setStats(prev => ({ ...prev, properties: data.pagination.total }));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                DirectLease
              </Link>
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
                No Agents
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
              No Agents.{" "}
              <span className="text-blue-600">Direct Deals.</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              The home leasing and real estate platform that cuts out agents 
              entirely. Landlords list, tenants browse, and you deal directly 
              — saving thousands in commissions.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/register?type=landlord"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition shadow-lg"
              >
                I&apos;m a Landlord
              </Link>
              <Link
                href="/register?type=tenant"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition"
              >
                I&apos;m a Tenant
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why DirectLease?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Zero Agent Fees</h3>
              <p className="text-gray-600">
                No commissions. No agent markups. You deal directly with the 
                property owner and save thousands.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Direct Chat</h3>
              <p className="text-gray-600">
                Chat one-on-one with landlords or tenants. Schedule viewings, 
                negotiate terms — all in one place.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🛡️</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Platform</h3>
              <p className="text-gray-600">
                Verified users, protected chats, and optional buyer/seller 
                protection add-ons for peace of mind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-blue-600">
                For Landlords &amp; Sellers
              </h3>
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600">1.</span>
                  <span>Register and verify your identity</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600">2.</span>
                  <span>List your property with photos and videos</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600">3.</span>
                  <span>Set viewing schedules and manage inquiries</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600">4.</span>
                  <span>Chat, negotiate, and close deals directly</span>
                </li>
              </ol>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4 text-green-600">
                For Tenants &amp; Buyers
              </h3>
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="font-bold text-green-600">1.</span>
                  <span>Browse properties with full details</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-green-600">2.</span>
                  <span>Subscribe to unlock chat and schedule viewings</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-green-600">3.</span>
                  <span>Tour properties and negotiate terms</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-green-600">4.</span>
                  <span>Complete the transaction securely</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Link href="/" className="text-2xl font-bold text-white">
              DirectLease
            </Link>
            <p className="mt-2">No Agents. Direct Deals.</p>
            <div className="mt-4">
              <Link href="/terms" className="hover:text-white mx-3">
                Terms &amp; Conditions
              </Link>
              <Link href="/admin/login" className="hover:text-white mx-3">
                Admin
              </Link>
            </div>
            <p className="mt-6 text-sm">
              &copy; {new Date().getFullYear()} DirectLease. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}