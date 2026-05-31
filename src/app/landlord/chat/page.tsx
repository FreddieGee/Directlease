"use client";

import { useEffect, useState } from "react";

export default function LandlordChat() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsText, setTermsText] = useState("");
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showConfirmAccept, setShowConfirmAccept] = useState(false);
  const [showConfirmReject, setShowConfirmReject] = useState(false);
  const [showSellerProtection, setShowSellerProtection] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => {
        if (data.user) setCurrentUserId(data.user.id);
      });

    fetch("/api/chat")
      .then(r => r.json())
      .then(d => setConversations(d.conversations || []))
      .catch(() => {});
  }, []);

  function loadMessages(conv: any) {
    setSelectedConv(conv);
    const otherId = conv.sender_id === currentUserId ? conv.receiver_id : conv.sender_id;

    fetch(`/api/chat/${conv.property_id}?userId=${otherId}`)
      .then(r => r.json())
      .then(d => setMessages(d.messages || []))
      .catch(() => {});
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedConv) return;
    const token = document.cookie.split('; ').find(c => c.startsWith('session_token='))?.split('=')[1];
    const otherId = selectedConv.sender_id === currentUserId ? selectedConv.receiver_id : selectedConv.sender_id;

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token || ''}` },
      body: JSON.stringify({ propertyId: selectedConv.property_id, receiverId: otherId, message: newMessage }),
    });
    if (res.ok) {
      setMessages([...messages, (await res.json()).chatMessage]);
      setNewMessage("");
    }
  }

  async function postTerms() {
    if (!termsText.trim() || !selectedConv) return;
    const token = document.cookie.split('; ').find(c => c.startsWith('session_token='))?.split('=')[1];
    const otherId = selectedConv.sender_id === currentUserId ? selectedConv.receiver_id : selectedConv.sender_id;

    const message = `📄 LEASE/TERMS PROPOSAL:\n---\n${termsText}\n---\nTo accept these terms, click "Accept Terms" below.`;
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token || ''}` },
      body: JSON.stringify({ propertyId: selectedConv.property_id, receiverId: otherId, message }),
    });
    if (res.ok) {
      setMessages([...messages, (await res.json()).chatMessage]);
      setTermsText("");
      setShowTermsModal(false);
    }
  }

  const otherUser = (conv: any) => conv.sender_id === currentUserId ? conv.receiver_id : conv.sender_id;
  const otherName = (conv: any) => conv.other_user_name || 'User';

  return (
    <div>
      {/* Persistent Chat Warning Banner */}
      <div className="chat-warning-banner p-3 rounded-lg mb-4 text-sm font-medium text-amber-900 text-center">
        ⚠️ IMPORTANT: Keep all communications within this chat system. 
        External communication (phone, WhatsApp, email) may limit our ability to assist with dispute resolution. 
        <strong> Chat logs serve as the official record.</strong>
      </div>

      <h1 className="text-2xl font-bold mb-6">Messages</h1>

      {conversations.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No conversations yet. Messages will appear here when tenants contact you.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 h-[65vh]">
          {/* Conversation List */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-y-auto">
            <div className="p-3 font-semibold border-b sticky top-0 bg-white">Conversations</div>
            {conversations.map((conv: any, i: number) => (
              <button key={i} onClick={() => loadMessages(conv)}
                className={`w-full text-left p-3 border-b hover:bg-gray-50 ${selectedConv?.property_id === conv.property_id ? 'bg-blue-50' : ''}`}>
                <p className="font-medium text-sm">{otherName(conv)}</p>
                <p className="text-xs text-gray-500 truncate">{conv.property_title}</p>
                <p className="text-xs text-gray-400 truncate">{conv.last_message?.substring(0, 60)}</p>
              </button>
            ))}
          </div>

          {/* Chat Area */}
          <div className="col-span-2 bg-white rounded-xl border border-gray-200 flex flex-col h-full">
            {selectedConv ? (
              <>
                <div className="p-3 border-b bg-white flex justify-between items-center">
                  <div>
                    <span className="font-semibold">{selectedConv.property_title}</span>
                    <span className="text-xs text-gray-400 ml-2">— Chat with {otherName(selectedConv)}</span>
                  </div>
                  <button onClick={() => setShowTermsModal(true)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 font-medium">
                    📄 Post Terms
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && <p className="text-gray-400 text-center mt-8">No messages yet. Start the conversation.</p>}
                  {messages.map((msg: any) => {
                    const isMine = msg.sender_id === currentUserId;
                    const isTermsProposal = msg.message?.startsWith('📄 LEASE/TERMS PROPOSAL:');

                    return (
                      <div key={msg.id} className="space-y-1">
                        <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs p-3 rounded-lg ${isMine ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                            <p className="text-xs mt-1 opacity-70">{new Date(msg.created_at).toLocaleTimeString()}</p>
                          </div>
                        </div>
                        {!isMine && isTermsProposal && (
                          <div className="flex justify-start gap-2 ml-2">
                            <button onClick={() => { setShowConfirmAccept(true); setShowAcceptModal(false); }}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 font-medium border border-green-300">
                              ✅ Accept Terms
                            </button>
                            <button onClick={() => setShowConfirmReject(true)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 font-medium border border-red-300">
                              ❌ Reject
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
                    <button onClick={sendMessage} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Send</button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">Select a conversation</div>
            )}
          </div>
        </div>
      )}

      {/* Post Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
            <h2 className="font-semibold text-lg mb-2">📄 Post Lease/Sale Terms</h2>
            <p className="text-sm text-gray-500 mb-4">
              Post your terms directly in the chat. The tenant will see them with an option to accept or reject.
            </p>
            <textarea value={termsText} onChange={e => setTermsText(e.target.value)}
              className="w-full h-32 px-3 py-2 border rounded-lg text-sm" placeholder="Describe your terms here... e.g., Monthly rent: ₦150,000, Deposit: 2 months, Lease duration: 12 months, etc." />
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowTermsModal(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={postTerms} disabled={!termsText.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                Post Terms
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accept Terms Warning Modal */}
      {showConfirmAccept && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 border-2 border-amber-400">
            <h2 className="font-semibold text-lg text-amber-800 mb-2">⚠️ Confirm Acceptance</h2>
            <p className="text-sm text-gray-700 mb-4">
              By accepting these terms, you signal agreement to proceed. 
              <strong> This is a binding step in the transaction process.</strong>
            </p>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowConfirmAccept(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={() => { setShowConfirmAccept(false); setShowSellerProtection(true); }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                I Understand, Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showConfirmReject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 border-2 border-red-400">
            <h2 className="font-semibold text-lg text-red-800 mb-2">⚠️ Reject Terms</h2>
            <p className="text-sm text-gray-700 mb-4">
              Are you sure you want to reject these terms? This will end the negotiation for this property.
            </p>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowConfirmReject(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={() => { setShowConfirmReject(false); }} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seller Protection Modal */}
      {showSellerProtection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="font-semibold text-lg mb-2">🛡️ Seller Protection</h2>
            <p className="text-sm text-gray-600 mb-4">
              Add Seller Protection (10% of {selectedConv?.property_type || 'lease/sale'} value) to cover:
            </p>
            <ul className="text-sm text-gray-700 space-y-2 mb-4">
              <li>✅ Buyer/Lessee background check</li>
              <li>✅ Legal support and document review</li>
              <li>✅ Enforcement of seller's terms</li>
            </ul>
            <p className="text-xs text-gray-500 mb-4">You can also skip this and proceed without protection.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowSellerProtection(false); }}
                className="px-4 py-2 border rounded-lg text-sm">Skip</button>
              <button onClick={() => { setShowSellerProtection(false); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                Add Protection (10%)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}