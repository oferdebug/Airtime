"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error | null, reset: () => void) => ReactNode);
}

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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    // Send error to reporting service
    // Example with modern @sentry/nextjs:
    // import * as Sentry from "@sentry/nextjs";
    // Sentry.captureException(error, { extra: errorInfo });
    // Ensure Sentry is initialized at app startup (e.g., in layout.tsx or _app.tsx)
    // For now, this is a placeholder - uncomment and configure when Sentry is set up:
    // import * as Sentry from "@sentry/nextjs";
    // Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === "function") {
          return this.props.fallback(this.state.error, this.handleReset);
        }
        return this.props.fallback;
      }

      return (
        <ErrorFallbackUI
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

// Separate component to use Next.js router hook
function ErrorFallbackUI({
  onReset,
}: {
  onReset: () => void;
}) {
  const router = useRouter();

  // Generic user-facing message - never expose raw error.message
  const userMessage = "An unexpected error occurred. Please try again.";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-white to-brand-50/30">
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
            onClick={onReset}
            className="gradient-brand text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/")}
          >
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}
