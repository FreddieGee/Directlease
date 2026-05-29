"use client";

import { useEffect, useState } from "react";

export default function TenantChat() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    fetch("/api/chat")
      .then(r => r.json())
      .then(d => setConversations(d.conversations || []))
      .catch(() => {});
  }, []);

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
          <p className="text-gray-500">No conversations yet. Subscribe and request viewings to start chatting with landlords.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {conversations.map((conv: any) => (
            <div key={`${conv.property_id}-${conv.sender_id}`} className="p-3 border-b last:border-0 hover:bg-gray-50">
              <p className="font-medium">{conv.other_user_name}</p>
              <p className="text-sm text-gray-500">{conv.property_title}</p>
              <p className="text-xs text-gray-400">{conv.last_message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}