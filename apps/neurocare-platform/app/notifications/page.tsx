"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authenticatedFetch } from "../../lib/client-api";

type Notification = {
  id: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
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
    return () => {
      active = false;
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

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f3f6f8", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-#145742" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f3f6f8", color: "#15233a", padding: "28px clamp(20px, 5vw, 64px) 56px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Link href="/" style={{ textDecoration: "none", color: "#64748b", marginBottom: 24, display: "inline-block" }}>
          ← Back to dashboard
        </Link>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px" }}>Notifications</h1>
        <p style={{ color: "#64748b", margin: 0 }}>
          {unreadCount} unread · {notifications.length} total
        </p>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{
              background: "none",
              border: "none",
              color: "#4e6ef2",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              font: "inherit",
              marginTop: 12,
            }}
          >
            Mark all as read
          </button>
        )}

        <div style={{ marginTop: 32, border: "1px solid #e2e8f0", borderRadius: 12, background: "#fff" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", fontWeight: 800, fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>
            All notifications
          </div>
          <div style={{ maxHeight: 500, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  style={{
                    padding: "16px 20px",
                    borderBottom: "1px solid #f1f5f9",
                    cursor: "pointer",
                    opacity: n.readAt ? 0.6 : 1,
                    background: n.readAt ? "#fff" : "#fef3f7",
                    transition: "opacity 0.2s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#15233a" }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>
                      {new Date(n.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "#334155", marginTop: 6, lineHeight: 1.5 }}>
                    {n.body}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}