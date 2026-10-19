"use client";
import { useEffect, useState } from "react";

export function useLiveData(patientId: string) {
  const [status, setStatus] = useState<"connecting" | "open" | "closed">("connecting");
  const [lastMessage, setLastMessage] = useState<unknown>(null);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
    const wsUrl = base.replace(/^http/, "ws") + "/api/v1/live-data/ws";
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => setStatus("open");
    ws.onmessage = (e) => {
      try { setLastMessage(JSON.parse(e.data)); } catch { setLastMessage(e.data); }
    };
    ws.onclose = () => setStatus("closed");
    ws.onerror = () => setStatus("closed");
    return () => ws.close();
  }, [patientId]);

  return { status, lastMessage };
}
