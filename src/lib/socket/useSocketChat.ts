'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  property_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function useSocketChat(propertyId: string, otherUserId: string) {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    // Load existing messages
    fetchMessages();

    // Connect socket
    const token = getSessionToken();
    if (!token || !propertyId || !otherUserId) return;

    const socket = io(window.location.origin, {
      path: '/api/socketio',
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join:conversation', { propertyId, otherUserId });
    });

    socket.on('chat:message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('chat:read-receipt', (data: { readBy: string; propertyId: string }) => {
      setMessages(prev => prev.map(m => ({
        ...m,
        is_read: m.sender_id !== data.readBy ? true : m.is_read,
      })));
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socket.emit('leave:conversation', { propertyId, otherUserId });
      socket.disconnect();
    };
  }, [propertyId, otherUserId]);

  async function fetchMessages() {
    try {
      const token = getSessionToken();
      const res = await fetch(`/api/chat/${propertyId}?userId=${otherUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }

  const sendMessage = useCallback((message: string) => {
    if (!socketRef.current || !message.trim()) return;
    socketRef.current.emit('chat:send', {
      propertyId,
      receiverId: otherUserId,
      message: message.trim(),
    });
  }, [propertyId, otherUserId]);

  const markAsRead = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('chat:read', { propertyId, senderId: otherUserId });
  }, [propertyId, otherUserId]);

  return {
    messages,
    sendMessage,
    markAsRead,
    isConnected,
  };
}

function getSessionToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/session_token=([^;]+)/);
  return match ? match[1] : localStorage.getItem('token');
}