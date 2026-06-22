"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function TenantChat() {
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [showAcceptWarning, setShowAcceptWarning] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  // Check for new conversation params from property detail page
  const urlPropertyId = searchParams?.get("propertyId");
  const urlLandlordId = searchParams?.get("landlordId");
  const urlPropertyTitle = searchParams?.get("propertyTitle");

  useEffect(() => {
    fetch("/api/auth/me", { headers: authHeaders })
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setCurrentUserId(data.user.id);
        }
      })
      .catch(() => {});

    fetch("/api/chat", { headers: authHeaders })
      .then(r => r.json())
      .then(d => {
        if (d.error && d.status === 'subscription_required') {
          setSubscriptionError(true);
        } else {
          const convs = d.conversations || [];
          setConversations(convs);

          // If URL has propertyId, find matching conversation or create virtual one
          if (urlPropertyId && urlLandlordId) {
            const existing = convs.find((c: any) => c.property_id === urlPropertyId);
            if (existing) {
              // Conversation exists, select it
              setSelectedConv(existing);
              loadMessagesForConv(existing);
            } else {
              // New conversation — create a virtual entry to show the chat box
              const newConv = {
                property_id: urlPropertyId,
                property_title: urlPropertyTitle || "Property",
                receiver_id: urlLandlordId,
                sender_id: currentUserId || "",
                other_user_name: "Landlord",
                other_user_type: "landlord",
                last_message: "",
              };
              setSelectedConv(newConv);
            }
          }
        }
      })
      .catch(() => {});
  }, [urlPropertyId, urlLandlordId, urlPropertyTitle, currentUserId]);

  function loadMessagesForConv(conv: any) {
    const otherId = conv.sender_id === currentUserId ? conv.receiver_id : conv.sender_id;
    fetch(`/api/chat/${conv.property_id}?userId=${otherId}`, { headers: authHeaders })
      .then(r => r.json())
      .then(d => setMessages(d.messages || []))
      .catch(() => {});
  }

  function selectConversation(conv: any) {
    setSelectedConv(conv);
    loadMessagesForConv(conv);
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedConv) return;
    const otherId = selectedConv.other_user_type === 'landlord'
      ? selectedConv.receiver_id || selectedConv.sender_id
      : (selectedConv.sender_id === currentUserId ? selectedConv.receiver_id : selectedConv.sender_id);

    // For a new conversation, the landlord is the receiver
    const receiverId = selectedConv.other_user_type === 'landlord'
      ? selectedConv.receiver_id
      : (selectedConv.sender_id === currentUserId ? selectedConv.receiver_id : selectedConv.sender_id);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ propertyId: selectedConv.property_id, receiverId: receiverId, message: newMessage }),
    });
    if (res.ok) {
      const newMsg = (await res.json()).chatMessage;
      setMessages([...messages, newMsg]);
      setNewMessage("");

      // If this was a new virtual conversation, add it to conversations list
      if (selectedConv && !selectedConv.id) {
        const newConv = {
          ...selectedConv,
          sender_id: currentUserId,
          last_message: newMessage,
        };
        setConversations(prev => {
          const exists = prev.find(c => c.property_id === newConv.property_id);
          if (exists) return prev;
          return [newConv, ...prev];
        });
      }
    }
  }

  const otherName = (conv: any) => conv.other_user_name || 'Landlord';

  if (subscriptionError) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Messages</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-4xl mb-4">💳</p>
          <h2 className="text-xl font-semibold mb-2">Subscription Required</h2>
          <p className="text-gray-500 mb-6">An active subscription is required to use chat. Subscribe now to unlock messaging with landlords and sellers.</p>
          <Link href="/tenant/subscriptions" className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition">
            View Subscription Plans
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="chat-warning-banner p-3 rounded-lg mb-4 text-sm font-medium text-amber-900 text-center">
        ⚠️ IMPORTANT: Keep all communications within this chat system. 
        External communication (phone, WhatsApp, email) may limit our ability to assist with dispute resolution. 
        <strong> Chat logs serve as the official record.</strong>
      </div>

      <h1 className="text-2xl font-bold mb-6">Messages</h1>

      <div className="grid grid-cols-3 gap-4 h-[65vh]">
        {/* Conversations List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-y-auto">
          <div className="p-3 font-semibold border-b sticky top-0 bg-white">Conversations</div>
          {conversations.length === 0 && !selectedConv ? (
            <div className="p-6 text-center text-gray-400 text-sm">No conversations yet.</div>
          ) : (
            <>
              {selectedConv && !selectedConv.id && (
                <div className="p-3 border-b bg-green-50 text-green-700 text-sm font-medium">
                  💬 New: {selectedConv.property_title}
                </div>
              )}
              {conversations.map((conv: any, i: number) => (
                <button key={i} onClick={() => selectConversation(conv)}
                  className={`w-full text-left p-3 border-b hover:bg-gray-50 ${selectedConv?.property_id === conv.property_id && !selectedConv?.id !== true ? 'bg-green-50' : ''}`}>
                  <p className="font-medium text-sm">{otherName(conv)}</p>
                  <p className="text-xs text-gray-500 truncate">{conv.property_title}</p>
                  <p className="text-xs text-gray-400 truncate">{conv.last_message?.substring(0, 60)}</p>
                </button>
              ))}
            </>
          )}
        </div>

        {/* Chat Area */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 flex flex-col h-full">
          {selectedConv ? (
            <>
              <div className="p-3 border-b bg-white font-semibold">{selectedConv.property_title}</div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <p className="text-gray-400 text-center mt-8">
                    {selectedConv.last_message ? "" : "Start a conversation with the landlord..."}
                  </p>
                )}
                {messages.map((msg: any) => {
                  const isMine = msg.sender_id === currentUserId;
                  const isTermsProposal = msg.message?.startsWith('📄 LEASE/TERMS PROPOSAL:');
                  return (
                    <div key={msg.id} className="space-y-1">
                      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs p-3 rounded-lg ${isMine ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          <p className="text-xs mt-1 opacity-70">{new Date(msg.created_at).toLocaleTimeString()}</p>
                        </div>
                      </div>
                      {!isMine && isTermsProposal && (
                        <div className="flex justify-start ml-2">
                          <button onClick={() => setShowAcceptWarning(true)}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 font-medium border border-green-300">
                            ✅ Accept Terms
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="p-3 border-t bg-white">
                <div className="flex gap-2">
                  <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..." className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                  <button onClick={sendMessage} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">Send</button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">Select a conversation or click "Chat with Landlord" on a property page</div>
          )}
        </div>
      </div>

      {/* Accept Terms Warning Modal */}
      {showAcceptWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 border-2 border-amber-400">
            <h2 className="font-semibold text-lg text-amber-800 mb-2">⚠️ Accept Terms?</h2>
            <p className="text-sm text-gray-700 mb-4">
              By accepting these terms, you signal agreement to proceed. 
              <strong> This is a binding step in the transaction process.</strong>
              You will be taken to checkout to complete the transaction.
            </p>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowAcceptWarning(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={() => {
                setShowAcceptWarning(false);
                window.location.href = `/tenant/checkout/${selectedConv?.property_id}`;
              }} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                I Understand, Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}