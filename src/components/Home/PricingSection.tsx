'use client';

import { PricingTable } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';

interface PricingSectionProps {
  compact?: boolean;
}

export default function PricingSection({
  compact = false,
}: PricingSectionProps) {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 mesh-background-subtle"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-extrabold mb-7 text-slate-950 dark:text-slate-100">
              Simple, <span className="gradient-brand-text">Transparent</span>{' '}
              Pricing
            </h2>
            <p className="text-xl md:text-2xl text-slate-700 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Choose the plan that fits your podcasting needs. No hidden fees,
              no surprises.
            </p>
          </div>

          {/* Pricing Table */}
          <div className="flex justify-center w-full">
            <div
              className={`glass-card ${compact ? 'max-w-4xl w-full' : 'max-w-5xl w-full'}`}
            >
              <PricingTable
                fallback={
                  <div className="flex items-center justify-center py-20">
                    <div className="text-center space-y-4 p-12 rounded-2xl">
                      <Loader2 className="h-16 w-16 animate-spin text-brand-500 mx-auto" />
                      <p className="text-slate-900 dark:text-slate-100 text-lg font-medium">
                        Loading pricing options...
                      </p>
                    </div>
                  </div>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
