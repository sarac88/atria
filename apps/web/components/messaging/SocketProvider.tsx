"use client";

// Holds the authenticated Socket.IO connection. Lives inside the QueryClient
// provider and reads the session from the ["me"] query, so it connects only
// when logged in. Incoming "message.new" events are appended to the messages
// cache and bump the conversation list.

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import type { MessageActionAck, MessageDto, NotificationDto, UserDto } from "@atria/types";
import { getMe } from "@/lib/api/auth";
import { formatTime } from "@/lib/time";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1").replace(/\/api\/v1\/?$/, "");

interface RawMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  edited?: boolean;
}

interface SocketContextValue {
  connected: boolean;
  sendMessage: (conversationId: string, body: string) => void;
  /** Reescribe un mensaje propio; el servidor responde si el plazo ya pasó. */
  editMessage: (messageId: string, body: string) => Promise<MessageActionAck>;
  deleteMessage: (messageId: string) => Promise<MessageActionAck>;
}

const OFFLINE: MessageActionAck = { ok: false, error: "Sin conexión con el servidor." };

const SocketContext = createContext<SocketContextValue>({
  connected: false,
  sendMessage: () => {},
  editMessage: async () => OFFLINE,
  deleteMessage: async () => OFFLINE,
});

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

    // Las tres mutaciones refrescan lo mismo: la lista de conversaciones y la
    // insignia de no leídos del panel de módulos dependen del último mensaje.
    const refreshLists = () => {
      void qc.invalidateQueries({ queryKey: ["conversations"] });
      void qc.invalidateQueries({ queryKey: ["classChat"] });
    };

    socket.on("message.new", (raw: RawMessage) => {
      const dto: MessageDto = {
        id: raw.id,
        conversationId: raw.conversationId,
        senderId: raw.senderId,
        from: raw.senderId === user.id ? "me" : "them",
        text: raw.body,
        time: formatTime(raw.createdAt),
        createdAt: raw.createdAt,
        edited: false,
      };
      qc.setQueryData<MessageDto[]>(["messages", raw.conversationId], (old) => {
        if (!old) return old;
        if (old.some((m) => m.id === dto.id)) return old;
        return [...old, dto];
      });
      refreshLists();
    });

    socket.on("message.updated", (raw: RawMessage) => {
      qc.setQueryData<MessageDto[]>(["messages", raw.conversationId], (old) =>
        old?.map((m) => (m.id === raw.id ? { ...m, text: raw.body, edited: true } : m)),
      );
      refreshLists();
    });

    socket.on("message.deleted", (raw: { id: string; conversationId: string }) => {
      qc.setQueryData<MessageDto[]>(["messages", raw.conversationId], (old) =>
        old?.filter((m) => m.id !== raw.id),
      );
      refreshLists();
    });

    socket.on("notification.new", (raw: NotificationDto) => {
      void qc.invalidateQueries({ queryKey: ["notifications"] });
      // Aceptar una invitación cambia el alumnado y la lista de invitaciones del docente.
      if (raw?.type === "invite") {
        void qc.invalidateQueries({ queryKey: ["roster"] });
        void qc.invalidateQueries({ queryKey: ["invitations"] });
        void qc.invalidateQueries({ queryKey: ["classes"] });
      }
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

  // Editar y borrar sí necesitan respuesta: el servidor es quien decide si el
  // plazo de rectificación sigue abierto.
  const ask = useCallback((event: string, payload: unknown): Promise<MessageActionAck> => {
    const socket = socketRef.current;
    if (!socket?.connected) return Promise.resolve(OFFLINE);
    return new Promise((resolve) => {
      socket.timeout(5000).emit(event, payload, (err: unknown, ack: MessageActionAck) => {
        resolve(err ? OFFLINE : ack ?? OFFLINE);
      });
    });
  }, []);

  const editMessage = useCallback(
    (messageId: string, body: string) => ask("message.edit", { messageId, body }),
    [ask],
  );
  const deleteMessage = useCallback((messageId: string) => ask("message.delete", { messageId }), [ask]);

  return (
    <SocketContext.Provider value={{ connected, sendMessage, editMessage, deleteMessage }}>
      {children}
    </SocketContext.Provider>
  );
}
