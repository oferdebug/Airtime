"use client";

import { Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Replace with actual newsletter API endpoint
      // Example: const response = await fetch('/api/newsletter', { method: 'POST', body: JSON.stringify({ email: trimmed }) });
      // For now, simulate API call with occasional failures for testing error handling (development only)
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate ~10% failure rate for testing error handling (development only)
          if (process.env.NODE_ENV === "development" && Math.random() < 0.1) {
            reject(new Error("Network error: Unable to connect to server"));
          } else {
            resolve(undefined);
          }
        }, 1000);
      });

      toast.success("Successfully subscribed to our newsletter!", {
        description: "Check your email for a confirmation message.",
      });
      setEmail("");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to subscribe. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="flex items-start gap-4 mb-4">
        <div className="p-2 rounded-lg gradient-brand">
          <Mail className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-extrabold text-lg mb-1 text-slate-950">
            Stay Updated
          </h3>
          <p className="text-sm text-slate-600">
            Get the latest podcast tips and product updates delivered to your
            inbox.
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          disabled={isLoading}
          required
        />
        <Button
          type="submit"
          className="gradient-brand text-white hover:opacity-90 transition-opacity"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Subscribing...
            </>
          ) : (
            "Subscribe"
          )}
        </Button>
      </form>
    </div>
  );
}
