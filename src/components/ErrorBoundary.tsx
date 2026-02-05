"use client";
/** biome-ignore-all assist/source/organizeImports: preserve import order required by ErrorBoundary initialization */
import React, { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

/** Canonical props for fallback component. Matches render-prop API: (error, reset). */
type FallbackProps = {
  error?: Error | null;
  reset?: () => void;
  /** @deprecated Prefer `reset` for consistency with render-prop API */
  resetErrorBoundary?: () => void;
};

type Props =
  | { children: ReactNode; fallback?: ReactNode }
  | {
      children: ReactNode;
      fallback: (error: Error | null, reset: () => void) => ReactNode;
      fallbackType: "render";
    }
  | {
      children: ReactNode;
      fallback: React.ComponentType<FallbackProps>;
      fallbackType: "component";
    };

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    // Send to reporting service, e.g.:
    // import * as Sentry from "@sentry/nextjs";
    // Sentry.captureException(error, { extra: errorInfo });
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        if (
          typeof this.props.fallback === "function" &&
          "fallbackType" in this.props
        ) {
          const { fallback, fallbackType } = this.props;
          if (fallbackType === "render") {
            return (
              fallback as (error: Error | null, reset: () => void) => ReactNode
            )(this.state.error, this.resetErrorBoundary);
          }
          if (fallbackType === "component") {
            return React.createElement(
              fallback as React.ComponentType<FallbackProps>,
              {
                error: this.state.error,
                reset: this.resetErrorBoundary,
                resetErrorBoundary: this.resetErrorBoundary,
              },
            );
          }
          console.error("[ErrorBoundary] Unknown fallbackType:", fallbackType);
          throw new Error(
            `[ErrorBoundary] Unknown fallbackType: ${String(fallbackType)}`,
          );
        }
        if (React.isValidElement(this.props.fallback)) {
          const props = this.props.fallback.props as Record<string, unknown>;
          const onReset =
            typeof props?.onReset === "function" ? props.onReset : undefined;
          const handleReset =
            typeof props?.handleReset === "function"
              ? props.handleReset
              : undefined;
          if (handleReset !== undefined) {
            console.warn(
              "[ErrorBoundary] handleReset is deprecated; use resetErrorBoundary on your fallback component.",
            );
          }
          const effectiveReset =
            onReset ?? handleReset ?? this.resetErrorBoundary;
          return React.cloneElement(this.props.fallback, {
            resetErrorBoundary: effectiveReset,
            onReset: effectiveReset,
            handleReset: effectiveReset,
          } as Record<string, unknown>);
        }
        if (typeof this.props.fallback === "function") {
          if (process.env.NODE_ENV === "development") {
            console.error(
              "[ErrorBoundary] fallback is a function but fallbackType is missing. Use fallbackType: 'render' or 'component'.",
            );
          }
          return (
            <ErrorFallbackUI resetErrorBoundary={this.resetErrorBoundary} />
          );
        }
        return (
          <div className="relative">
            {this.props.fallback}
            <button
              type="button"
              onClick={this.resetErrorBoundary}
              className="mt-4 px-4 py-2 text-sm text-brand-600 hover:text-brand-800 flex items-center gap-2 justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
              aria-label="Reset error state"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        );
      }

      return <ErrorFallbackUI resetErrorBoundary={this.resetErrorBoundary} />;
    }

    return this.props.children;
  }
}

// Separate component to use Next.js router hook
function ErrorFallbackUI({
  resetErrorBoundary,
}: {
  resetErrorBoundary: () => void;
}) {
  const router = useRouter();

  // Generic user-facing message - never expose raw error.message
  const userMessage = "An unexpected error occurred. Please try again.";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-b from-white to-brand-50/30">
      <div
        className="max-w-md w-full glass-card rounded-2xl p-8 text-center"
        role="alert"
        aria-describedby="error-message"
      >
        <div className="p-3 rounded-full bg-red-100 w-fit mx-auto mb-4">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-extrabold mb-2 text-slate-950">
          Something went wrong
        </h1>
        <p id="error-message" className="text-slate-600 mb-6">
          {userMessage}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={resetErrorBoundary}
            className="gradient-brand text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" onClick={() => router.push("/")}>
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}
