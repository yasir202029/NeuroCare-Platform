"use client";

import React, { useState } from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  static getDerivedStateFromProps(props: ErrorBoundaryState): ErrorBoundaryState {
    if (props.hasError) {
      return { hasError: false, error: null, errorInfo: null };
    }
    return props;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const stack: string | null = errorInfo.componentStack ?? null;
    this.setState({ errorInfo: stack });
    console.error("[NeuroCare ErrorBoundary]", error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div
          role="alert"
          className="p-6 rounded-lg border border-#ef4444 bg-#fef2f2 text-#991b1b"
        >
          <h3 className="font-semibold text-#ef4444 mb-2">
            Something went wrong
          </h3>
          <p className="text-sm mb-4">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            className="px-4 py-2 text-sm font-medium text-#ffffff bg-#145742 rounded hover:bg-#0f4d3a"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function ErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
