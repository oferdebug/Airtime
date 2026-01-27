"use client";

import { useState } from "react";
import { Mail, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { toast } from "sonner";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    
    // Simulate API call - replace with actual newsletter API
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Successfully subscribed to our newsletter!", {
        description: "Check your email for a confirmation message.",
      });
      setEmail("");
    }, 1000);
  };

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8" suppressHydrationWarning>
      <div className="flex items-start gap-4 mb-4">
        <div className="p-2 rounded-lg gradient-brand">
          <Mail className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-extrabold text-lg mb-1 text-slate-950">
            Stay Updated
          </h3>
          <p className="text-sm text-slate-600">
            Get the latest podcast tips and product updates delivered to your inbox.
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
