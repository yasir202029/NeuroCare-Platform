"use client";

import { useEffect, useState } from "react";
import { authenticatedFetch } from "../lib/client-api";

type Notification = {
  id: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await authenticatedFetch("/api/v1/notifications");
        if (res.ok) {
          const data = (await res.json()) as {
            notifications: Notification[];
            unreadCount: number;
          };
          if (active) {
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
          }
        }
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    const timer = setInterval(load, 30000); // poll every 30s
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  async function markRead(id: string) {
    await authenticatedFetch(`/api/v1/notifications/${id}/read`, {
      method: "PATCH",
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function markAllRead() {
    await authenticatedFetch("/api/v1/notifications/read-all", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    setUnreadCount(0);
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 8,
          position: "relative",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#15233a"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 10,
              height: 10,
              background: "#dc2626",
              borderRadius: "50%",
              border: "2px solid #fff",
            }}
          />
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: 40,
            right: 0,
            width: 360,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            zIndex: 50,
            fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
          }}
        >
          <div
            style={{
              padding: 16,
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#15233a" }}>
              Notifications
            </h3>
            <button
              onClick={markAllRead}
              style={{
                background: "none",
                border: "none",
                color: "#4e6ef2",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                font: "inherit",
              }}
            >
              Mark all read
            </button>
          </div>
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
                Loading…
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "#64748b" }}>
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  style={{
                    padding: 14,
                    borderBottom: "1px solid #f1f5f9",
                    cursor: "pointer",
                    opacity: n.readAt ? 0.6 : 1,
                    background: n.readAt ? "#fff" : "#fef3f7",
                    transition: "opacity 0.2s",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#15233a" }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    {n.body}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#94a3b8",
                      marginTop: 6,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    {new Date(n.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}