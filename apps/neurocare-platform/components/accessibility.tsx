"use client";

import { useEffect, useState } from "react";

export function SkipLink() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab" && !e.altKey && !e.ctrlKey && !e.metaKey) {
        setIsVisible(true);
      }
    };
    const handleBlur = () => setIsVisible(false);

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("scroll", handleBlur, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("scroll", handleBlur, true);
    };
  }, []);

  return (
    isVisible ? (
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-#ffffff focus:text-#145742 focus:border focus:border-#145742 focus:rounded-md focus:font-semibold focus:text-sm"
      >
        Skip to main content
      </a>
    ) : null
  );
}

export function Announcement({
  message,
  type = "info",
}: {
  message: string;
  type?: "info" | "success" | "warning" | "error";
}) {
  const tones: Record<string, string> = {
    info: "bg-#e2e8f0 text-#1e40af border border-#3b82f6",
    success: "bg-#f0fdf4 text-#166534 border border-#bbf7d0",
    warning: "bg-#fffbeb text-#92400e border border-#fcd34d",
    error: "bg-#fef2f2 text-#991b1b border border-#fecaca",
  };
  return (
    <div
      role="status"
      aria-live="polite"
      className={`p-4 rounded-md border ${tones[type]} text-sm`}
    >
      {message}
    </div>
  );
}
