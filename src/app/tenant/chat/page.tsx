"use client";

import { useEffect, useState } from "react";

export default function TenantChat() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [showAcceptWarning, setShowAcceptWarning] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(data => {
      if (data.user) setCurrentUserId(data.user.id);
    });
    fetch("/api/chat").then(r => r.json()).then(d => setConversations(d.conversations || [])).catch(() => {});
  }, []);

  function loadMessages(conv: any) {
    setSelectedConv(conv);
    const otherId = conv.sender_id === currentUserId ? conv.receiver_id : conv.sender_id;
    fetch(`/api/chat/${conv.property_id}?userId=${otherId}`)
      .then(r => r.json()).then(d => setMessages(d.messages || [])).catch(() => {});
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

  const otherName = (conv: any) => conv.other_user_name || 'User';

  return (
    <div>
      <div className="chat-warning-banner p-3 rounded-lg mb-4 text-sm font-medium text-amber-900 text-center">
        ⚠️ IMPORTANT: Keep all communications within this chat system. 
        External communication (phone, WhatsApp, email) may limit our ability to assist with dispute resolution. 
        <strong> Chat logs serve as the official record.</strong>
      </div>

      <h1 className="text-2xl font-bold mb-6">Messages</h1>

      {conversations.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No conversations yet. Subscribe to unlock full access and start chatting with landlords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 h-[65vh]">
          <div className="bg-white rounded-xl border border-gray-200 overflow-y-auto">
            <div className="p-3 font-semibold border-b sticky top-0 bg-white">Conversations</div>
            {conversations.map((conv: any, i: number) => (
              <button key={i} onClick={() => loadMessages(conv)}
                className={`w-full text-left p-3 border-b hover:bg-gray-50 ${selectedConv?.property_id === conv.property_id ? 'bg-green-50' : ''}`}>
                <p className="font-medium text-sm">{otherName(conv)}</p>
                <p className="text-xs text-gray-500 truncate">{conv.property_title}</p>
                <p className="text-xs text-gray-400 truncate">{conv.last_message?.substring(0, 60)}</p>
              </button>
            ))}
          </div>

          <div className="col-span-2 bg-white rounded-xl border border-gray-200 flex flex-col h-full">
            {selectedConv ? (
              <>
                <div className="p-3 border-b bg-white font-semibold">{selectedConv.property_title}</div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && <p className="text-gray-400 text-center mt-8">No messages yet.</p>}
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
              <div className="flex items-center justify-center h-full text-gray-400">Select a conversation</div>
            )}
          </div>
        </div>
      )}

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