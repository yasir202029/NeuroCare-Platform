"use client";

export function LoadingSpinner({
  size = "medium",
  className = "",
}: {
  size?: "small" | "medium" | "large";
  className?: string;
}) {
  const sizes = {
    small: "w-4 h-4",
    medium: "w-6 h-6",
    large: "w-8 h-8",
  };
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`flex items-center justify-center ${className}`}
    >
      <svg
        className={`animate-spin ${sizes[size]} text-#145742`}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
        />
        <path
          className="opacity-75"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray="80, 200"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

export function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="h-4 bg-#e2e8f0 rounded animate-pulse"
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="text-center py-12"
      aria-label={title}
    >
      <div className="w-12 h-12 rounded-full bg-#f0fdf4 flex items-center justify-center mx-auto mb-4 text-#16a34a">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-#15233a mb-2">{title}</h3>
      <p className="text-#6b7280 mb-6">{description}</p>
      {action && <div className="justify-center">{action}</div>}
    </div>
  );
}
