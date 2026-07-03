"use client";

// Holds the authenticated Socket.IO connection. Lives inside the QueryClient
// provider and reads the session from the ["me"] query, so it connects only
// when logged in. Incoming "message.new" events are appended to the messages
// cache and bump the conversation list.

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import type { MessageDto, UserDto } from "@atria/types";
import { getMe } from "@/lib/api/auth";
import { formatTime } from "@/lib/time";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1").replace(/\/api\/v1\/?$/, "");

interface RawMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

interface SocketContextValue {
  connected: boolean;
  sendMessage: (conversationId: string, body: string) => void;
}

const SocketContext = createContext<SocketContextValue>({ connected: false, sendMessage: () => {} });

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const { data: user } = useQuery<UserDto>({ queryKey: ["me"], queryFn: getMe });
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) return;
    const socket = io(API_ORIGIN, { path: "/ws", withCredentials: true });
    socketRef.current = socket;
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("message.new", (raw: RawMessage) => {
      const dto: MessageDto = {
        id: raw.id,
        conversationId: raw.conversationId,
        senderId: raw.senderId,
        from: raw.senderId === user.id ? "me" : "them",
        text: raw.body,
        time: formatTime(raw.createdAt),
        createdAt: raw.createdAt,
      };
      qc.setQueryData<MessageDto[]>(["messages", raw.conversationId], (old) => {
        if (!old) return old;
        if (old.some((m) => m.id === dto.id)) return old;
        return [...old, dto];
      });
      void qc.invalidateQueries({ queryKey: ["conversations"] });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user, qc]);

  const sendMessage = useCallback((conversationId: string, body: string) => {
    socketRef.current?.emit("message.send", { conversationId, body });
  }, []);

  return <SocketContext.Provider value={{ connected, sendMessage }}>{children}</SocketContext.Provider>;
}
