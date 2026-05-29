"use client";

import { useEffect, useState } from "react";

export default function LandlordChat() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");

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
    // Determine the other user (not the current user)
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

  return (
    <div>
      <div className="chat-warning-banner p-3 rounded-lg mb-4 text-sm font-medium text-amber-900 text-center">
        ⚠️ IMPORTANT: Keep all communications within this chat system. 
        External communication (phone, WhatsApp, email) may limit our ability to assist with dispute resolution. 
        Chat logs serve as the official record.
      </div>

      <h1 className="text-2xl font-bold mb-6">Messages</h1>

      {conversations.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No conversations yet. Messages will appear here when tenants contact you about your listings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 h-[60vh]">
          <div className="bg-white rounded-xl border border-gray-200 overflow-y-auto">
            <div className="p-3 font-semibold border-b sticky top-0 bg-white">Conversations</div>
            {conversations.map((conv: any, i: number) => (
              <button key={i}
                onClick={() => loadMessages(conv)}
                className={`w-full text-left p-3 border-b hover:bg-gray-50 ${selectedConv?.property_id === conv.property_id ? 'bg-blue-50' : ''}`}>
                <p className="font-medium text-sm">{conv.other_user_name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{conv.property_title}</p>
                <p className="text-xs text-gray-400 truncate">{conv.last_message}</p>
              </button>
            ))}
          </div>

          <div className="col-span-2 bg-white rounded-xl border border-gray-200 flex flex-col h-full">
            {selectedConv ? (
              <>
                <div className="p-3 border-b font-semibold bg-white">{selectedConv.property_title}</div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && <p className="text-gray-400 text-center mt-8">No messages yet. Start the conversation.</p>}
                  {messages.map((msg: any) => (
                    <div key={msg.id} className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs p-3 rounded-lg ${msg.sender_id === currentUserId ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-xs mt-1 opacity-70">{new Date(msg.created_at).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t bg-white">
                  <div className="flex gap-2">
                    <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 border rounded-lg text-sm" />
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
    </div>
  );
}