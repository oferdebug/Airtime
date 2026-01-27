"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
  }
}

export function Analytics() {
  useEffect(() => {
    // Google Analytics 4
    const gaId = process.env.NEXT_PUBLIC_GA_ID;
    if (gaId && typeof window !== "undefined") {
      // Load gtag script
      const script1 = document.createElement("script");
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script1);

      const script2 = document.createElement("script");
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaId}');
      `;
      document.head.appendChild(script2);
    }

    // Note: To use Vercel Analytics, install @vercel/analytics and add it to your layout
    // Example: import { Analytics as VercelAnalytics } from '@vercel/analytics/react'
    // Then add <VercelAnalytics /> to your layout
  }, []);

  return null;
}
